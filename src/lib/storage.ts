import { createInitialSeedState } from '../shared/seed';
import type {
  MintlyWorkspaceState,
  SpendingCategory,
} from '../shared/types';

export const STORAGE_KEY = 'mintly.workspace.in.v1';

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

function toSafeInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n);
}

function toSafePositiveInt(value: unknown, fallback: number): number {
  const n = toSafeInt(value, fallback);
  return n > 0 ? n : fallback;
}

function toSafeCategory(value: unknown, txType?: unknown): SpendingCategory {
  if (typeof value === 'string' && VALID_CATEGORIES.has(value as SpendingCategory)) {
    return value as SpendingCategory;
  }
  if (txType === 'income') return 'income';
  if (txType === 'transfer') return 'savings';
  return 'dining';
}

export function sanitizeWorkspaceState(
  raw: unknown,
  fallbackInput?: MintlyWorkspaceState
): MintlyWorkspaceState {
  const nowIso = new Date().toISOString();
  const fallback = fallbackInput ?? createInitialSeedState(nowIso);

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const data = raw as Partial<MintlyWorkspaceState>;
  if (!data.profile || data.profile.currency !== 'INR') {
    return fallback;
  }

  const rawAccounts = Array.isArray(data.accounts) ? data.accounts : [];
  if (rawAccounts.length === 0) {
    return fallback;
  }

  const accounts = rawAccounts
    .filter((a) => a && typeof a === 'object' && typeof a.id === 'string')
    .map((acc) => ({
      ...acc,
      currency: 'INR' as const,
      name: typeof acc.name === 'string' && acc.name ? acc.name : 'Account',
      balanceCents: Math.max(0, toSafeInt(acc.balanceCents, 0)),
      dailyLimitCents:
        acc.dailyLimitCents != null
          ? Math.max(10000, toSafeInt(acc.dailyLimitCents, 250000))
          : 250000,
    }));

  if (accounts.length === 0) {
    return fallback;
  }

  const transactions = Array.isArray(data.transactions)
    ? data.transactions
        .filter((tx) => tx && typeof tx === 'object' && typeof tx.id === 'string')
        .map((tx) => ({
          ...tx,
          currency: 'INR' as const,
          amountCents: Math.max(0, toSafeInt(tx.amountCents, 0)),
          category: toSafeCategory(tx.category, tx.type),
          merchant:
            typeof tx.merchant === 'string' && tx.merchant.trim()
              ? tx.merchant
              : 'Merchant',
          occurredAtUtc:
            typeof tx.occurredAtUtc === 'string' && tx.occurredAtUtc
              ? tx.occurredAtUtc
              : nowIso,
          roundUpPaise:
            tx.roundUpPaise != null && toSafeInt(tx.roundUpPaise, 0) > 0
              ? toSafeInt(tx.roundUpPaise, 0)
              : undefined,
        }))
    : fallback.transactions;

  const budgets =
    Array.isArray(data.budgets) && data.budgets.length > 0
      ? data.budgets
          .filter((b) => b && typeof b === 'object' && typeof b.id === 'string')
          .map((b) => ({
            ...b,
            currency: 'INR' as const,
            category: toSafeCategory(b.category) as MintlyWorkspaceState['budgets'][number]['category'],
            limitCents: toSafePositiveInt(b.limitCents, 100000),
          }))
      : fallback.budgets;

  const vaults =
    Array.isArray(data.vaults) && data.vaults.length > 0
      ? data.vaults
          .filter((v) => v && typeof v === 'object' && typeof v.id === 'string')
          .map((v) => ({
            ...v,
            currency: 'INR' as const,
            title: typeof v.title === 'string' && v.title ? v.title : 'Goal Vault',
            artworkKey: v.artworkKey || 'emergency',
            targetCents: toSafePositiveInt(v.targetCents, 100000),
            savedCents: Math.max(0, toSafeInt(v.savedCents, 0)),
            weeklyAutoCents: Math.max(0, toSafeInt(v.weeklyAutoCents, 0)),
            contributions: Array.isArray(v.contributions)
              ? v.contributions.map((c) => ({
                  ...c,
                  currency: 'INR' as const,
                  amountCents: Math.max(0, toSafeInt(c.amountCents, 0)),
                }))
              : [],
          }))
      : fallback.vaults;

  const recurring = Array.isArray(data.recurring)
    ? data.recurring
        .filter((r) => r && typeof r === 'object' && typeof r.id === 'string')
        .map((r) => ({
          ...r,
          currency: 'INR' as const,
          category: toSafeCategory(r.category, r.type),
          amountCents: Math.max(0, toSafeInt(r.amountCents, 0)),
        }))
    : fallback.recurring;

  const circles =
    Array.isArray(data.circles) && data.circles.length > 0
      ? data.circles
          .filter((c) => c && typeof c === 'object' && typeof c.id === 'string')
          .map((c) => ({
            ...c,
            currency: 'INR' as const,
            members: Array.isArray(c.members) ? c.members : [],
            expenses: Array.isArray(c.expenses)
              ? c.expenses.map((ex) => ({
                  ...ex,
                  currency: 'INR' as const,
                  amountCents: Math.max(0, toSafeInt(ex.amountCents, 0)),
                  splitBetweenIds: Array.isArray(ex.splitBetweenIds)
                    ? ex.splitBetweenIds
                    : [],
                }))
              : [],
          }))
      : fallback.circles;

  const auditLogs = Array.isArray(data.auditLogs)
    ? data.auditLogs
    : fallback.auditLogs;

  const defaultVaultId = vaults[0]?.id ?? fallback.vaults[0]?.id ?? 'vault_goa';
  const roundUp = {
    enabled: data.roundUp?.enabled ?? fallback.roundUp?.enabled ?? false,
    targetVaultId:
      data.roundUp?.targetVaultId && vaults.some((v) => v.id === data.roundUp?.targetVaultId)
        ? data.roundUp.targetVaultId
        : defaultVaultId,
    monthlySavedCents: Math.max(
      0,
      toSafeInt(data.roundUp?.monthlySavedCents, fallback.roundUp?.monthlySavedCents ?? 0)
    ),
  };

  const rewards = {
    coins: Math.max(0, toSafeInt(data.rewards?.coins, fallback.rewards?.coins ?? 0)),
    streakDays: Math.max(
      1,
      toSafeInt(data.rewards?.streakDays, fallback.rewards?.streakDays ?? 1)
    ),
    unlockedItemIds: Array.isArray(data.rewards?.unlockedItemIds)
      ? data.rewards.unlockedItemIds
      : fallback.rewards?.unlockedItemIds ?? [],
    equippedAccessoryId:
      data.rewards?.equippedAccessoryId !== undefined
        ? data.rewards.equippedAccessoryId
        : fallback.rewards?.equippedAccessoryId ?? null,
  };

  return {
    profile: {
      ...fallback.profile,
      ...data.profile,
      uid:
        typeof data.profile.uid === 'string' && data.profile.uid
          ? data.profile.uid
          : fallback.profile.uid,
      displayName:
        typeof data.profile.displayName === 'string' && data.profile.displayName.trim()
          ? data.profile.displayName
          : fallback.profile.displayName,
      currency: 'INR',
      language: data.profile.language === 'hinglish' ? 'hinglish' : 'en',
      allowanceAmountCents: toSafePositiveInt(
        data.profile.allowanceAmountCents,
        fallback.profile.allowanceAmountCents
      ),
      nextAllowanceIso:
        typeof data.profile.nextAllowanceIso === 'string' && data.profile.nextAllowanceIso
          ? data.profile.nextAllowanceIso
          : fallback.profile.nextAllowanceIso,
      cycleDays: toSafePositiveInt(data.profile.cycleDays, fallback.profile.cycleDays || 30),
      onboardingCompleted:
        typeof data.profile.onboardingCompleted === 'boolean'
          ? data.profile.onboardingCompleted
          : fallback.profile.onboardingCompleted,
    },
    accounts,
    transactions,
    budgets,
    vaults,
    recurring,
    circles,
    auditLogs,
    roundUp,
    rewards,
  };
}

export function loadLocalWorkspace(): MintlyWorkspaceState {
  const seed = createInitialSeedState(new Date().toISOString());
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    return sanitizeWorkspaceState(parsed, seed);
  } catch {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      // ignore storage quota errors
    }
    return seed;
  }
}

export function saveLocalWorkspace(state: MintlyWorkspaceState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function resetLocalWorkspace(): MintlyWorkspaceState {
  const seed = createInitialSeedState(new Date().toISOString());
  saveLocalWorkspace(seed);
  return seed;
}
