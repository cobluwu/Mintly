import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type {
  AllowanceRunwaySummary,
  BudgetStatus,
  ContextualNudge,
  IncomeSource,
  MintlyWorkspaceState,
  MonthlyMoneyReport,
  PaymentMode,
  SavingsVault,
  SpendingCategory,
  SplitMode,
  StayType,
  Transaction,
  UserProfile,
} from '../shared/types';
import {
  computeAllowanceRunway,
  computeBudgetStatuses,
  computeContextualNudges,
  computeMonthlyMoneyReport,
  computeRoundUpPaise,
  computeTotalBalanceCents,
  mergeIdempotentTransactions,
  validateWorkspaceInvariants,
  type WorkspaceInvariantReport,
} from '../shared/finance';
import { createInitialSeedState } from '../shared/seed';
import { loadLocalWorkspace, resetLocalWorkspace, saveLocalWorkspace } from './storage';

export type MintlyStoreAction =
  | { type: 'HYDRATE'; payload: MintlyWorkspaceState }
  | {
      type: 'ADD_TRANSACTION';
      payload: {
        txType: 'expense' | 'income';
        accountId: string;
        amountCents: number;
        category: SpendingCategory;
        merchant: string;
        note?: string;
        paymentMode?: PaymentMode;
        upiRef?: string;
        paidToUpiId?: string;
        incomeSource?: IncomeSource;
      };
    }
  | { type: 'REVERSE_TRANSACTION'; txId: string }
  | {
      type: 'UPDATE_TRANSACTION_CATEGORY';
      txId: string;
      category: SpendingCategory;
    }
  | { type: 'IMPORT_TRANSACTIONS'; transactions: Transaction[] }
  | { type: 'TOGGLE_ACCOUNT_FREEZE'; accountId: string }
  | { type: 'SET_ACCOUNT_LIMIT'; accountId: string; dailyLimitCents: number }
  | {
      type: 'CONTRIBUTE_VAULT';
      vaultId: string;
      accountId: string;
      amountCents: number;
      note?: string;
    }
  | {
      type: 'TOGGLE_ROUND_UPS';
      enabled: boolean;
      targetVaultId?: string;
    }
  | {
      type: 'ADD_CIRCLE_EXPENSE';
      circleId: string;
      title: string;
      amountCents: number;
      paidByMemberId: string;
      splitBetweenIds: string[];
      splitMode?: SplitMode;
      customSplits?: Record<string, number>;
    }
  | {
      type: 'SETTLE_CIRCLE_TRANSFER';
      circleId: string;
      fromMemberId: string;
      toMemberId: string;
      amountCents: number;
      upiRef?: string;
      accountId?: string;
      upiApp?: string;
    }
  | { type: 'UPDATE_PROFILE'; patch: Partial<UserProfile> }
  | {
      type: 'APPLY_ONBOARDING';
      payload: {
        allowanceAmountCents: number;
        allowanceDayOfMonth: number;
        allowanceSource: IncomeSource;
        stayType: StayType;
        selectedVaultKeys: Array<'laptop' | 'trip' | 'emergency' | 'festivals' | 'placement'>;
      };
    }
  | { type: 'SKIP_ONBOARDING' }
  | {
      type: 'UNLOCK_REWARD';
      itemId: string;
      costCoins: number;
      equip?: boolean;
    }
  | { type: 'RESET_DEMO' };

function make12DigitUpiRef(): string {
  const rand = Math.floor(100000000000 + Math.random() * 899999999999);
  return String(rand);
}

export function mintlyWorkspaceReducer(
  state: MintlyWorkspaceState,
  action: MintlyStoreAction
): MintlyWorkspaceState {
  const nowIso = new Date().toISOString();

  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'RESET_DEMO':
      return createInitialSeedState(nowIso, state.profile.uid);

    case 'ADD_TRANSACTION': {
      const {
        txType,
        accountId,
        amountCents,
        category,
        merchant,
        note,
        paymentMode,
        upiRef,
        paidToUpiId,
        incomeSource,
      } = action.payload;

      const roundUpConfig = state.roundUp;
      const roundUpPaise =
        txType === 'expense' && roundUpConfig?.enabled
          ? computeRoundUpPaise(amountCents)
          : 0;

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        ownerId: state.profile.uid,
        accountId,
        type: txType,
        status: 'posted',
        amountCents,
        currency: 'INR',
        category,
        merchant: merchant.trim(),
        note: note?.trim() || undefined,
        paymentMode: paymentMode ?? (txType === 'income' ? 'bank' : 'upi'),
        upiRef:
          upiRef ??
          (paymentMode === 'upi' || paymentMode === 'upi_lite'
            ? make12DigitUpiRef()
            : undefined),
        paidToUpiId,
        incomeSource,
        roundUpPaise: roundUpPaise > 0 ? roundUpPaise : undefined,
        occurredAtUtc: nowIso,
        idempotencyKey: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };

      const totalDebitFromAccount =
        txType === 'expense' ? amountCents + roundUpPaise : 0;

      const nextAccounts = state.accounts.map((acc) => {
        if (acc.id !== accountId) return acc;
        const delta = txType === 'income' ? amountCents : -totalDebitFromAccount;
        return {
          ...acc,
          balanceCents: Math.max(0, acc.balanceCents + delta),
          lastSyncedIso: nowIso,
        };
      });

      let nextVaults = state.vaults;
      let nextRoundUp = roundUpConfig;
      if (roundUpPaise > 0 && roundUpConfig?.targetVaultId) {
        nextVaults = state.vaults.map((v) =>
          v.id === roundUpConfig.targetVaultId
            ? {
                ...v,
                savedCents: v.savedCents + roundUpPaise,
                contributions: [
                  {
                    id: `vc_ru_${Date.now()}`,
                    amountCents: roundUpPaise,
                    currency: 'INR',
                    occurredAtUtc: nowIso,
                    note: `Round-up from ${merchant.trim()}`,
                  },
                  ...v.contributions,
                ],
              }
            : v
        );
        nextRoundUp = {
          ...roundUpConfig,
          monthlySavedCents: roundUpConfig.monthlySavedCents + roundUpPaise,
        };
      }

      const prevRewards = state.rewards ?? {
        coins: 0,
        streakDays: 1,
        unlockedItemIds: [],
        equippedAccessoryId: null,
      };

      return {
        ...state,
        accounts: nextAccounts,
        transactions: [newTx, ...state.transactions],
        vaults: nextVaults,
        roundUp: nextRoundUp,
        rewards: {
          ...prevRewards,
          coins: prevRewards.coins + 10,
        },
        auditLogs: [
          {
            id: `aud_${Date.now()}`,
            action: txType === 'income' ? 'INCOME_LOGGED' : 'EXPENSE_LOGGED',
            detail: `${merchant} (${amountCents} paise)`,
            occurredAtUtc: nowIso,
          },
          ...state.auditLogs.slice(0, 24),
        ],
      };
    }

    case 'REVERSE_TRANSACTION': {
      const target = state.transactions.find((tx) => tx.id === action.txId);
      if (!target || target.status !== 'posted') return state;
      const refundTotal = target.amountCents + (target.roundUpPaise ?? 0);

      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.txId ? { ...tx, status: 'reversed' } : tx
        ),
        accounts: state.accounts.map((acc) => {
          if (acc.id !== target.accountId) return acc;
          const delta = target.type === 'expense' ? refundTotal : -target.amountCents;
          return {
            ...acc,
            balanceCents: Math.max(0, acc.balanceCents + delta),
            lastSyncedIso: nowIso,
          };
        }),
        auditLogs: [
          {
            id: `aud_${Date.now()}`,
            action: 'TRANSACTION_REVERSED',
            detail: `Reversed ${target.merchant}`,
            occurredAtUtc: nowIso,
          },
          ...state.auditLogs.slice(0, 24),
        ],
      };
    }

    case 'UPDATE_TRANSACTION_CATEGORY': {
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.txId ? { ...tx, category: action.category } : tx
        ),
      };
    }

    case 'IMPORT_TRANSACTIONS': {
      const { merged } = mergeIdempotentTransactions(
        state.transactions,
        action.transactions
      );
      return {
        ...state,
        transactions: merged,
        auditLogs: [
          {
            id: `aud_${Date.now()}`,
            action: 'BATCH_IMPORT',
            detail: `Imported ${action.transactions.length} transactions`,
            occurredAtUtc: nowIso,
          },
          ...state.auditLogs.slice(0, 24),
        ],
      };
    }

    case 'TOGGLE_ACCOUNT_FREEZE': {
      return {
        ...state,
        accounts: state.accounts.map((acc) =>
          acc.id === action.accountId ? { ...acc, frozen: !acc.frozen } : acc
        ),
      };
    }

    case 'SET_ACCOUNT_LIMIT': {
      return {
        ...state,
        accounts: state.accounts.map((acc) =>
          acc.id === action.accountId
            ? { ...acc, dailyLimitCents: Math.max(10000, action.dailyLimitCents) }
            : acc
        ),
      };
    }

    case 'CONTRIBUTE_VAULT': {
      const { vaultId, accountId, amountCents, note } = action;
      const targetVault = state.vaults.find((v) => v.id === vaultId);
      if (!targetVault) return state;

      const vaultTx: Transaction = {
        id: `tx_vault_${Date.now()}`,
        ownerId: state.profile.uid,
        accountId,
        type: 'transfer',
        status: 'posted',
        amountCents,
        currency: 'INR',
        category: 'savings',
        merchant: `Vault: ${targetVault.title}`,
        note: note || 'Goal transfer',
        paymentMode: 'upi',
        occurredAtUtc: nowIso,
        idempotencyKey: `vault-${vaultId}-${Date.now()}`,
      };

      const prevRewards = state.rewards ?? {
        coins: 0,
        streakDays: 1,
        unlockedItemIds: [],
        equippedAccessoryId: null,
      };

      return {
        ...state,
        accounts: state.accounts.map((acc) =>
          acc.id === accountId
            ? {
                ...acc,
                balanceCents: Math.max(0, acc.balanceCents - amountCents),
                lastSyncedIso: nowIso,
              }
            : acc
        ),
        vaults: state.vaults.map((v) =>
          v.id === vaultId
            ? {
                ...v,
                savedCents: v.savedCents + amountCents,
                contributions: [
                  {
                    id: `vc_${Date.now()}`,
                    amountCents,
                    currency: 'INR',
                    occurredAtUtc: nowIso,
                    note: note || 'Manual boost',
                  },
                  ...v.contributions,
                ],
              }
            : v
        ),
        transactions: [vaultTx, ...state.transactions],
        rewards: {
          ...prevRewards,
          coins: prevRewards.coins + 25,
        },
      };
    }

    case 'TOGGLE_ROUND_UPS': {
      const curr = state.roundUp ?? {
        enabled: false,
        targetVaultId: state.vaults[0]?.id ?? 'vault_goa',
        monthlySavedCents: 0,
      };
      return {
        ...state,
        roundUp: {
          ...curr,
          enabled: action.enabled,
          targetVaultId: action.targetVaultId ?? curr.targetVaultId,
        },
      };
    }

    case 'ADD_CIRCLE_EXPENSE': {
      return {
        ...state,
        circles: state.circles.map((c) =>
          c.id === action.circleId
            ? {
                ...c,
                expenses: [
                  {
                    id: `ce_${Date.now()}`,
                    title: action.title.trim(),
                    amountCents: action.amountCents,
                    currency: 'INR',
                    paidByMemberId: action.paidByMemberId,
                    splitBetweenIds: action.splitBetweenIds,
                    splitMode: action.splitMode ?? 'equal',
                    customSplits: action.customSplits,
                    occurredAtUtc: nowIso,
                  },
                  ...c.expenses,
                ],
              }
            : c
        ),
      };
    }

    case 'SETTLE_CIRCLE_TRANSFER': {
      const ref = action.upiRef || make12DigitUpiRef();
      const targetCircle = state.circles.find((c) => c.id === action.circleId);
      const fromMember = targetCircle?.members.find((m) => m.id === action.fromMemberId);
      const toMember = targetCircle?.members.find((m) => m.id === action.toMemberId);
      const selfIsPayer = Boolean(fromMember?.isSelf);
      const selfIsReceiver = Boolean(toMember?.isSelf);

      let nextAccounts = state.accounts;
      let nextTransactions = state.transactions;

      if (action.accountId && (selfIsPayer || selfIsReceiver)) {
        nextAccounts = state.accounts.map((acc) => {
          if (acc.id !== action.accountId) return acc;
          const delta = selfIsPayer ? -action.amountCents : action.amountCents;
          return {
            ...acc,
            balanceCents: Math.max(0, acc.balanceCents + delta),
            lastSyncedIso: nowIso,
          };
        });

        const settleTx: Transaction = {
          id: `tx_settle_${Date.now()}`,
          ownerId: state.profile.uid,
          accountId: action.accountId,
          type: 'transfer',
          status: 'posted',
          amountCents: action.amountCents,
          currency: 'INR',
          category: 'trips',
          merchant: selfIsPayer
            ? `UPI Settle · ${toMember?.name || 'Member'}`
            : `UPI Received · ${fromMember?.name || 'Member'}`,
          note: `${targetCircle?.name || 'Circle'}${action.upiApp ? ` via ${action.upiApp}` : ''}`,
          paymentMode: 'upi',
          upiRef: ref,
          paidToUpiId: selfIsPayer ? toMember?.upiId : fromMember?.upiId,
          occurredAtUtc: nowIso,
          idempotencyKey: `settle-${action.circleId}-${ref}`,
        };
        nextTransactions = [settleTx, ...state.transactions];
      }

      const prevRewards = state.rewards ?? {
        coins: 0,
        streakDays: 1,
        unlockedItemIds: [],
        equippedAccessoryId: null,
      };

      return {
        ...state,
        accounts: nextAccounts,
        transactions: nextTransactions,
        circles: state.circles.map((c) =>
          c.id === action.circleId
            ? {
                ...c,
                expenses: [
                  ...c.expenses,
                  {
                    id: `ce_settle_${Date.now()}`,
                    title: `UPI Settlement (${action.upiApp ? `${action.upiApp} · ` : ''}Ref ${ref.slice(-6)})`,
                    amountCents: action.amountCents,
                    currency: 'INR',
                    paidByMemberId: action.fromMemberId,
                    splitBetweenIds: [action.toMemberId],
                    splitMode: 'equal',
                    occurredAtUtc: nowIso,
                    settledRef: ref,
                  },
                ],
              }
            : c
        ),
        rewards: {
          ...prevRewards,
          coins: prevRewards.coins + 15,
        },
        auditLogs: [
          {
            id: `aud_${Date.now()}`,
            action: 'CIRCLE_UPI_SETTLED',
            detail: `${fromMember?.name || action.fromMemberId} -> ${toMember?.name || action.toMemberId} (${action.amountCents} paise, Ref ${ref})`,
            occurredAtUtc: nowIso,
          },
          ...state.auditLogs.slice(0, 24),
        ],
      };
    }

    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.patch, currency: 'INR' },
      };

    case 'APPLY_ONBOARDING': {
      const {
        allowanceAmountCents,
        allowanceDayOfMonth,
        allowanceSource,
        stayType,
        selectedVaultKeys,
      } = action.payload;

      const today = new Date();
      const y = today.getUTCFullYear();
      const m = today.getUTCMonth();
      const nextMonth = m === 11 ? 0 : m + 1;
      const nextYear = m === 11 ? y + 1 : y;
      const nextDate = new Date(
        Date.UTC(nextYear, nextMonth, Math.min(28, Math.max(1, allowanceDayOfMonth)))
      );
      const nextAllowanceIso = nextDate.toISOString().slice(0, 10);

      const filteredRecurring = state.recurring.filter((r) => {
        if (stayType === 'home' && /mess|rent|hostel/i.test(r.title)) return false;
        return true;
      });
      if (stayType === 'pg' && !filteredRecurring.some((r) => /pg rent/i.test(r.title))) {
        filteredRecurring.unshift({
          id: 'rec_pg_rent',
          ownerId: state.profile.uid,
          title: 'PG Rent & Wi-Fi',
          type: 'expense',
          category: 'rent',
          amountCents: 650000,
          currency: 'INR',
          cadence: 'monthly',
          nextDueIso: nextAllowanceIso,
          active: true,
        });
      }

      const selectedVaults: SavingsVault[] = state.vaults.filter((v) => {
        if (selectedVaultKeys.length === 0) return true;
        if (v.goalTheme === 'laptop' && selectedVaultKeys.includes('laptop')) return true;
        if (v.goalTheme === 'trip' && selectedVaultKeys.includes('trip')) return true;
        if (v.goalTheme === 'emergency' && selectedVaultKeys.includes('emergency')) return true;
        if (v.goalTheme === 'festivals' && selectedVaultKeys.includes('festivals')) return true;
        if (v.goalTheme === 'placement' && selectedVaultKeys.includes('placement')) return true;
        return false;
      });

      return {
        ...state,
        profile: {
          ...state.profile,
          allowanceAmountCents,
          allowanceDayOfMonth,
          allowanceSource,
          stayType,
          nextAllowanceIso,
          onboardingCompleted: true,
        },
        recurring: filteredRecurring,
        vaults: selectedVaults.length > 0 ? selectedVaults : state.vaults,
      };
    }

    case 'SKIP_ONBOARDING':
      return {
        ...state,
        profile: { ...state.profile, onboardingCompleted: true },
      };

    case 'UNLOCK_REWARD': {
      const prevRewards = state.rewards ?? {
        coins: 0,
        streakDays: 1,
        unlockedItemIds: [],
        equippedAccessoryId: null,
      };
      const alreadyUnlocked = prevRewards.unlockedItemIds.includes(action.itemId);
      if (!alreadyUnlocked && prevRewards.coins < action.costCoins) return state;

      return {
        ...state,
        rewards: {
          ...prevRewards,
          coins: alreadyUnlocked ? prevRewards.coins : prevRewards.coins - action.costCoins,
          unlockedItemIds: alreadyUnlocked
            ? prevRewards.unlockedItemIds
            : [...prevRewards.unlockedItemIds, action.itemId],
          equippedAccessoryId: action.equip ? action.itemId : prevRewards.equippedAccessoryId,
        },
      };
    }

    default:
      return state;
  }
}

interface MintlyStoreContextValue {
  state: MintlyWorkspaceState;
  dispatch: React.Dispatch<MintlyStoreAction>;
  totalBalancePaise: number;
  runway: AllowanceRunwaySummary;
  budgets: BudgetStatus[];
  totalBudgetedPaise: number;
  totalBudgetSpentPaise: number;
  monthlyReport: MonthlyMoneyReport;
  nudges: ContextualNudge[];
  invariants: WorkspaceInvariantReport;
  resetDemoData: () => void;
}

const MintlyStoreContext = createContext<MintlyStoreContextValue | null>(null);

export const MintlyStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(mintlyWorkspaceReducer, undefined, loadLocalWorkspace);

  useEffect(() => {
    saveLocalWorkspace(state);
  }, [state]);

  const value = useMemo<MintlyStoreContextValue>(() => {
    const nowUtcIso = new Date().toISOString();
    const totalBalancePaise = computeTotalBalanceCents(state.accounts);
    const runway = computeAllowanceRunway({
      profile: state.profile,
      accounts: state.accounts,
      transactions: state.transactions,
      recurring: state.recurring,
      nowUtcIso,
    });
    const budgets = computeBudgetStatuses({
      budgets: state.budgets,
      transactions: state.transactions,
    });
    const totalBudgetedPaise = budgets.reduce((s, b) => s + b.budget.limitCents, 0);
    const totalBudgetSpentPaise = budgets.reduce((s, b) => s + b.spentCents, 0);
    const monthlyReport = computeMonthlyMoneyReport(state, nowUtcIso);
    const nudges = computeContextualNudges(state, runway, nowUtcIso);
    const invariants = validateWorkspaceInvariants(state, nowUtcIso);

    return {
      state,
      dispatch,
      totalBalancePaise,
      runway,
      budgets,
      totalBudgetedPaise,
      totalBudgetSpentPaise,
      monthlyReport,
      nudges,
      invariants,
      resetDemoData: () => {
        const fresh = resetLocalWorkspace();
        dispatch({ type: 'HYDRATE', payload: fresh });
      },
    };
  }, [state]);

  return (
    <MintlyStoreContext.Provider value={value}>
      {children}
    </MintlyStoreContext.Provider>
  );
};

export function useMintlyStore(): MintlyStoreContextValue {
  const ctx = useContext(MintlyStoreContext);
  if (!ctx) {
    throw new Error('useMintlyStore must be used inside MintlyStoreProvider');
  }
  return ctx;
}
