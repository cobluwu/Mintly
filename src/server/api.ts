import { Router } from 'express';
import type { MintlyWorkspaceState, Transaction } from '../shared/types';
import {
  computeAllowanceRunway,
  computeBudgetStatuses,
  computeTotalBalanceCents,
  computeWeeklySpendingSeries,
  mergeIdempotentTransactions,
  parseAmountToCents,
} from '../shared/finance';
import { generateCoachReply } from './coach';
import { parseRawImportToTransactions } from './importer';

export function createApiV1Router() {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'mintly-api',
      version: 'v1',
      timestampUtc: new Date().toISOString(),
    });
  });

  router.get('/openapi.json', (_req, res) => {
    res.json({
      openapi: '3.1.0',
      info: {
        title: 'Mintly Student Finance API',
        version: '1.0.0',
        description:
          'Modular REST API v1 for Mintly student finance runway calculations, idempotent transaction imports, recurring rules, and grounded AI coaching.',
      },
      paths: {
        '/api/v1/health': { get: { summary: 'Service health check' } },
        '/api/v1/summary': { post: { summary: 'Compute authoritative allowance runway, budgets, and weekly pulse' } },
        '/api/v1/import': { post: { summary: 'Parse & idempotently import Indian bank SMS alerts or CSV lines' } },
        '/api/v1/transactions/import': { post: { summary: 'Idempotently import a batch of transactions in integer paise' } },
        '/api/v1/recurring/process': { post: { summary: 'Process due recurring bills and stipends idempotently' } },
        '/api/v1/coach/chat': { post: { summary: 'Ask Mintly Coach grounded in live user ledger state' } },
      },
    });
  });

  router.post('/summary', (req, res) => {
    try {
      const workspace = req.body?.workspace as MintlyWorkspaceState | undefined;
      if (!workspace || !workspace.profile || !Array.isArray(workspace.accounts)) {
        return res.status(400).json({ error: 'Invalid workspace payload' });
      }
      const nowUtcIso = new Date().toISOString();
      const runway = computeAllowanceRunway({
        profile: workspace.profile,
        accounts: workspace.accounts,
        transactions: workspace.transactions ?? [],
        recurring: workspace.recurring ?? [],
        nowUtcIso,
      });
      const budgets = computeBudgetStatuses({
        budgets: workspace.budgets ?? [],
        transactions: workspace.transactions ?? [],
        targetCurrency: workspace.profile.currency,
      });
      const totalBalanceCents = computeTotalBalanceCents(
        workspace.accounts,
        workspace.profile.currency
      );
      const weeklySeries = computeWeeklySpendingSeries({
        transactions: workspace.transactions ?? [],
        targetCurrency: workspace.profile.currency,
        nowUtcIso,
      });
      return res.json({ runway, budgets, totalBalanceCents, weeklySeries, computedAtUtc: nowUtcIso });
    } catch (err) {
      console.error('Summary error:', err);
      return res.status(500).json({ error: 'Failed to compute financial summary' });
    }
  });

  const handleImportRequest = async (req: Parameters<Parameters<typeof router.post>[1]>[0], res: Parameters<Parameters<typeof router.post>[1]>[1]) => {
    try {
      const existing = (req.body?.existing ?? []) as Transaction[];
      const ownerId = String(req.body?.ownerId || 'student_demo');
      const rawText = typeof req.body?.rawText === 'string' ? req.body.rawText.trim() : '';

      if (rawText) {
        const parsed = await parseRawImportToTransactions({
          rawText,
          ownerId,
          accountId: String(req.body?.accountId || 'acc_bank'),
          nowUtcIso: new Date().toISOString(),
        });
        if (parsed.transactions.length === 0) {
          return res.status(400).json({
            error: 'Could not detect any valid ₹ amounts in the pasted SMS or CSV text.',
          });
        }
        const result = mergeIdempotentTransactions(existing, parsed.transactions);
        return res.json({
          ...result,
          parserUsed: parsed.parserUsed,
          preview: parsed.transactions.map((tx) => ({
            merchant: tx.merchant,
            amountCents: tx.amountCents,
            type: tx.type,
            category: tx.category,
            upiRef: tx.upiRef,
          })),
        });
      }

      const rows = (req.body?.rows ?? []) as Array<{
        merchant: string;
        amount: string | number;
        type?: 'expense' | 'income';
        category?: Transaction['category'];
        currency?: Transaction['currency'];
        accountId?: string;
        occurredAtUtc?: string;
        idempotencyKey?: string;
        note?: string;
        upiRef?: string;
        paidToUpiId?: string;
      }>;

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'Provide raw SMS/CSV text or transaction rows to import' });
      }

      const validIncoming: Transaction[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cents =
          typeof row.amount === 'number'
            ? Math.round(row.amount)
            : parseAmountToCents(String(row.amount ?? ''));
        if (!cents || !Number.isInteger(cents) || cents <= 0) {
          return res.status(400).json({ error: `Row ${i + 1} has invalid positive monetary amount` });
        }
        const merchant = String(row.merchant ?? '').trim();
        if (!merchant) {
          return res.status(400).json({ error: `Row ${i + 1} is missing merchant name` });
        }
        const occurredAtUtc = row.occurredAtUtc || new Date().toISOString();
        const idempotencyKey =
          row.idempotencyKey ||
          `imp_${merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}_${cents}_${occurredAtUtc.slice(0, 10)}`;

        validIncoming.push({
          id: `tx_${Date.now()}_${i}`,
          ownerId,
          accountId: row.accountId || 'acc_bank',
          type: row.type === 'income' ? 'income' : 'expense',
          status: 'posted',
          amountCents: cents,
          currency: row.currency || 'INR',
          category: row.category || (row.type === 'income' ? 'income' : 'dining'),
          merchant: merchant.slice(0, 80),
          note: row.note ? String(row.note).slice(0, 240) : 'Batch import',
          paymentMode: 'upi',
          upiRef: row.upiRef,
          paidToUpiId: row.paidToUpiId,
          occurredAtUtc,
          idempotencyKey,
        });
      }

      const result = mergeIdempotentTransactions(existing, validIncoming);
      return res.json({ ...result, parserUsed: 'csv' });
    } catch (err) {
      console.error('Import error:', err);
      return res.status(500).json({ error: 'Failed to process transaction batch' });
    }
  };

  router.post('/import', handleImportRequest);
  router.post('/transactions/import', handleImportRequest);

  router.post('/coach/chat', async (req, res) => {
    try {
      const question = String(req.body?.question ?? '').trim();
      const workspace = req.body?.workspace as MintlyWorkspaceState | undefined;
      const history = Array.isArray(req.body?.history) ? req.body.history : [];

      if (!question || question.length > 600) {
        return res.status(400).json({ error: 'Question must be between 1 and 600 characters.' });
      }
      if (!workspace || !workspace.profile) {
        return res.status(400).json({ error: 'Workspace financial context is required.' });
      }

      const reply = await generateCoachReply({
        question,
        workspace,
        history,
        nowUtcIso: new Date().toISOString(),
      });
      return res.json(reply);
    } catch (err: unknown) {
      console.error('Coach error:', err);
      const message = err instanceof Error ? err.message : 'Unable to reach Mintly Coach right now.';
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
