import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  PaymentMode,
  SpendingCategory,
  Transaction,
} from '../shared/types';
import {
  parseAmountToCents,
  parseImportTextFallback,
  suggestCategoryForMerchant,
} from '../shared/finance';

const VALID_CATEGORIES = new Set<SpendingCategory>([
  'dining',
  'groceries',
  'transport',
  'textbooks',
  'subscriptions',
  'fun',
  'rent',
  'health',
  'laundry',
  'festivals',
  'trips',
  'income',
  'savings',
]);

const VALID_MODES = new Set<PaymentMode>(['upi', 'upi_lite', 'cash', 'card', 'bank']);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeCategory(raw: string | undefined, merchant: string, txType: 'expense' | 'income'): SpendingCategory {
  if (txType === 'income') return 'income';
  const cleaned = (raw || '').trim().toLowerCase() as SpendingCategory;
  if (VALID_CATEGORIES.has(cleaned) && cleaned !== 'income' && cleaned !== 'savings') {
    return cleaned;
  }
  return suggestCategoryForMerchant(merchant, txType);
}

export interface ParsedImportResult {
  transactions: Transaction[];
  parserUsed: 'gemini' | 'regex' | 'csv';
}

export async function parseRawImportToTransactions(params: {
  rawText: string;
  ownerId: string;
  accountId?: string;
  nowUtcIso?: string;
}): Promise<ParsedImportResult> {
  const { rawText, ownerId, accountId = 'acc_bank', nowUtcIso = new Date().toISOString() } = params;
  const trimmed = rawText.trim();
  const hasSmsCues = /(?:rs\.?|inr|₹|debited|credited|vpa|upi|a\/c|refno|utr)/i.test(trimmed);

  // Use deterministic parser immediately for pure CSV lines without bank SMS cues
  if (!hasSmsCues) {
    const fallbackRows = parseImportTextFallback(trimmed, nowUtcIso);
    const transactions: Transaction[] = fallbackRows.map((item, idx) => ({
      id: `tx_imp_${Date.now()}_${idx}`,
      ownerId,
      accountId,
      type: item.type,
      status: 'posted',
      amountCents: item.amountCents,
      currency: 'INR',
      category: normalizeCategory(item.category, item.merchant, item.type),
      merchant: item.merchant.slice(0, 80),
      note: 'Imported entry',
      paymentMode: item.paymentMode,
      upiRef: item.upiRef,
      paidToUpiId: item.paidToUpiId,
      occurredAtUtc: item.dateIso,
      idempotencyKey: `imp_${item.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.amountCents}_${item.dateIso.slice(0, 10)}`,
    }));
    return { transactions, parserUsed: 'csv' };
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const geminiPromise = ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Parse these Indian bank/UPI SMS alerts or CSV lines into structured INR transactions:\n\n${trimmed}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You extract Indian bank and UPI transactions for a college student finance tracker.
Return an array of transactions. Rules:
- amountRupees: positive number in INR rupees (e.g. 250 or 318.5).
- type: "income" if credited/received/refund, otherwise "expense".
- merchant: concise readable payee/payer name (e.g. "Swiggy", "Sharma Chai Tapri", "Rohan Verma", "Blinkit Groceries", "Rapido Rides").
- category: one of dining, groceries, transport, textbooks, subscriptions, fun, rent, health, laundry, festivals, trips, income.
- paymentMode: one of upi, upi_lite, cash, card, bank.
- upiRef: 12-digit UPI reference string if found, else empty string.
- paidToUpiId: UPI VPA (like swiggy@icici) if present, else empty string.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                merchant: { type: Type.STRING },
                amountRupees: { type: Type.NUMBER },
                type: { type: Type.STRING },
                category: { type: Type.STRING },
                paymentMode: { type: Type.STRING },
                upiRef: { type: Type.STRING },
                paidToUpiId: { type: Type.STRING },
              },
              required: ['merchant', 'amountRupees', 'type', 'category'],
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini SMS parse timeout')), 6000);
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const parsed = JSON.parse((response.text ?? '[]').trim()) as Array<{
        merchant?: string;
        amountRupees?: number;
        type?: string;
        category?: string;
        paymentMode?: string;
        upiRef?: string;
        paidToUpiId?: string;
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const transactions: Transaction[] = [];
        parsed.forEach((row, idx) => {
          const amountCents =
            typeof row.amountRupees === 'number' && Number.isFinite(row.amountRupees)
              ? Math.round(row.amountRupees * 100)
              : parseAmountToCents(String(row.amountRupees ?? ''));
          const merchant = String(row.merchant ?? '').trim();
          if (!amountCents || amountCents <= 0 || !merchant) return;
          const txType: 'expense' | 'income' = row.type === 'income' ? 'income' : 'expense';
          const modeRaw = (row.paymentMode || 'upi').toLowerCase() as PaymentMode;
          const paymentMode = VALID_MODES.has(modeRaw) ? modeRaw : 'upi';
          const upiRef = row.upiRef && /^\d{8,16}$/.test(row.upiRef.trim())
            ? row.upiRef.trim().slice(0, 12).padEnd(12, '0')
            : `${431900000000 + ((amountCents + idx * 137) % 99999999)}`;
          const paidToUpiId = row.paidToUpiId?.includes('@') ? row.paidToUpiId.trim().toLowerCase() : undefined;

          transactions.push({
            id: `tx_imp_${Date.now()}_${idx}`,
            ownerId,
            accountId,
            type: txType,
            status: 'posted',
            amountCents,
            currency: 'INR',
            category: normalizeCategory(row.category, merchant, txType),
            merchant: merchant.slice(0, 80),
            note: 'SMS import',
            paymentMode,
            upiRef,
            paidToUpiId,
            occurredAtUtc: nowUtcIso,
            idempotencyKey: row.upiRef
              ? `sms_ref_${upiRef}_${amountCents}`
              : `imp_${merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}_${amountCents}_${nowUtcIso.slice(0, 10)}`,
          });
        });

        if (transactions.length > 0) {
          return { transactions, parserUsed: 'gemini' };
        }
      }
    } catch (err) {
      console.warn('Gemini SMS parser fallback activated:', err);
    }
  }

  // Deterministic regex fallback
  const fallbackRows = parseImportTextFallback(trimmed, nowUtcIso);
  const transactions: Transaction[] = fallbackRows.map((item, idx) => ({
    id: `tx_imp_${Date.now()}_${idx}`,
    ownerId,
    accountId,
    type: item.type,
    status: 'posted',
    amountCents: item.amountCents,
    currency: 'INR',
    category: normalizeCategory(item.category, item.merchant, item.type),
    merchant: item.merchant.slice(0, 80),
    note: item.paidToUpiId ? `UPI alert (${item.paidToUpiId})` : 'Bank SMS import',
    paymentMode: item.paymentMode,
    upiRef: item.upiRef,
    paidToUpiId: item.paidToUpiId,
    occurredAtUtc: item.dateIso,
    idempotencyKey: item.upiRef
      ? `sms_ref_${item.upiRef}_${item.amountCents}`
      : `imp_${item.merchant.toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.amountCents}_${item.dateIso.slice(0, 10)}`,
  }));

  return { transactions, parserUsed: 'regex' };
}
