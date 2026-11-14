import type {
  AllowanceRunwaySummary,
  BudgetCategory,
  BudgetPlan,
  BudgetStatus,
  CircleDebtTransfer,
  ContextualNudge,
  CurrencyCode,
  ExpenseCircle,
  FinancialAccount,
  MascotMood,
  MintlyWorkspaceState,
  MonthlyMoneyReport,
  PaymentMode,
  RecurringRule,
  RunwayPace,
  SavingsVault,
  SpendingCategory,
  SplitMode,
  Transaction,
  UserProfile,
} from './types';

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; locale: string; name: string }
> = {
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
};

const IN_INTEGER_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const IN_DECIMAL_FORMATTER = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Single INR formatter for the entire application.
 * - Accepts integer paise only (never floats).
 * - Uses Indian digit grouping via Intl.NumberFormat("en-IN") (e.g. ₹1,14,900).
 * - Hides paise unless non-zero or options.showPaise is true.
 * - Compact mode formats Lakhs (₹1.15L), Crores (₹1.2Cr), and Thousands (₹12.5k).
 */
export function fmtINR(
  paise: number,
  options?: { compact?: boolean; sign?: boolean; showPaise?: boolean }
): string {
  if (!Number.isInteger(paise)) {
    throw new Error(`Amount must be integer paise, received ${paise}`);
  }

  const isNeg = paise < 0;
  const absPaise = Math.abs(paise);
  const absRupees = absPaise / 100;
  const hasPaise = absPaise % 100 !== 0;

  let body: string;
  if (options?.compact && absRupees >= 10_000_000) {
    const cr = (absRupees / 10_000_000)
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1');
    body = `₹${cr}Cr`;
  } else if (options?.compact && absRupees >= 100_000) {
    const lakh = (absRupees / 100_000)
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1');
    body = `₹${lakh}L`;
  } else if (options?.compact && absRupees >= 1_000) {
    const k = (absRupees / 1_000)
      .toFixed(1)
      .replace(/\.0$/, '');
    body = `₹${k}k`;
  } else if (hasPaise || options?.showPaise) {
    body = `₹${IN_DECIMAL_FORMATTER.format(absRupees)}`;
  } else {
    body = `₹${IN_INTEGER_FORMATTER.format(Math.trunc(absPaise / 100))}`;
  }

  if (isNeg) return `-${body}`;
  if (options?.sign && paise > 0) return `+${body}`;
  return body;
}

/**
 * Splits integer paise into Indian-grouped whole rupees and optional paise suffix
 * for editorial hero typography.
 */
export function splitINRParts(
  paise: number,
  options?: { showZeroPaise?: boolean }
): {
  sign: '-' | '';
  symbol: '₹';
  whole: string;
  paiseSuffix: string;
} {
  const safePaise = Number.isInteger(paise) ? paise : Math.round(paise);
  const sign: '-' | '' = safePaise < 0 ? '-' : '';
  const absPaise = Math.abs(safePaise);
  const wholeRupees = Math.floor(absPaise / 100);
  const remPaise = absPaise % 100;

  return {
    sign,
    symbol: '₹',
    whole: IN_INTEGER_FORMATTER.format(wholeRupees),
    paiseSuffix:
      remPaise > 0 || options?.showZeroPaise
        ? `.${String(remPaise).padStart(2, '0')}`
        : '',
  };
}

/**
 * Single currency (INR): preserves integer paise with zero FX multiplication.
 */
export function convertMinorUnits(
  amountPaise: number,
  _from?: CurrencyCode,
  _to?: CurrencyCode
): number {
  if (!Number.isInteger(amountPaise)) {
    throw new Error(`Amount must be integer paise, received ${amountPaise}`);
  }
  return amountPaise;
}

/**
 * Compatibility wrapper delegating directly to fmtINR.
 */
export function formatMinorUnits(
  amountPaise: number,
  _currency?: CurrencyCode,
  options?: { compact?: boolean; signed?: boolean; showPaise?: boolean }
): string {
  return fmtINR(amountPaise, {
    compact: options?.compact,
    sign: options?.signed,
    showPaise: options?.showPaise,
  });
}

/**
 * Parses a decimal rupee string (e.g. "1,14,900" or "₹245.50") safely into integer paise.
 */
export function parseAmountToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/[₹$,€£,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [wholePart, fracPart = ''] = cleaned.split('.');
  const paddedFrac = (fracPart + '00').slice(0, 2);
  const paise = Number(wholePart) * 100 + Number(paddedFrac);
  if (!Number.isSafeInteger(paise) || paise <= 0) return null;
  return paise;
}

/**
 * Returns YYYY-MM-DD in Asia/Kolkata (IST) for any UTC ISO string.
 */
export function toIstDateKey(utcIso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(utcIso)) return utcIso;
  const date = new Date(utcIso);
  if (Number.isNaN(date.getTime())) return utcIso.slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

/**
 * Formats an ISO timestamp or YYYY-MM-DD date in "14 Nov" (DD MMM) format in IST.
 */
export function formatDateDDMMM(isoOrDate: string): string {
  const dateKey = toIstDateKey(isoOrDate);
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(dt);
}

/**
 * Formats Activity day headers cleanly ("Today", "Yesterday", or "12 Nov").
 */
export function formatActivityDayHeader(
  utcIso: string,
  nowUtcIso: string = new Date().toISOString()
): string {
  const txDay = toIstDateKey(utcIso);
  const todayKey = toIstDateKey(nowUtcIso);
  if (txDay === todayKey) return 'Today';

  const [ty, tm, td] = todayKey.split('-').map(Number);
  const yesterdayDt = new Date(Date.UTC(ty, (tm || 1) - 1, (td || 1) - 1));
  const yesterdayKey = yesterdayDt.toISOString().slice(0, 10);
  if (txDay === yesterdayKey) return 'Yesterday';

  return formatDateDDMMM(txDay);
}

/**
 * Formats 12-hour IST time (e.g. "7:30 PM").
 */
export function formatTimeIST12h(utcIso: string): string {
  const dt = new Date(utcIso);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(dt)
    .toUpperCase();
}

/**
 * Computes day difference between two calendar dates (YYYY-MM-DD or UTC ISO resolved in IST).
 */
export function diffUtcDays(fromDateIso: string, toDateIso: string): number {
  const parseIstMidnight = (iso: string): number => {
    const dayPart = toIstDateKey(iso);
    const [y, m, d] = dayPart.split('-').map(Number);
    return Date.UTC(y, (m || 1) - 1, d || 1);
  };
  const diffMs = parseIstMidnight(toDateIso) - parseIstMidnight(fromDateIso);
  return Math.max(0, Math.round(diffMs / 86_400_000));
}

/**
 * Computes Allowance Runway from liquid accounts, upcoming fixed bills before the next allowance date,
 * and current cycle transactions.
 */
export function computeAllowanceRunway(params: {
  profile: UserProfile;
  accounts: FinancialAccount[];
  transactions: Transaction[];
  recurring: RecurringRule[];
  nowUtcIso: string;
}): AllowanceRunwaySummary {
  const { profile, accounts, transactions, recurring, nowUtcIso } = params;

  const liquidBalanceCents = accounts
    .filter((a) => a.type !== 'savings')
    .reduce((sum, a) => sum + convertMinorUnits(a.balanceCents), 0);

  const todayIst = toIstDateKey(nowUtcIso);
  const nextAllowanceDay = profile.nextAllowanceIso.slice(0, 10);
  const daysRemaining = Math.max(1, diffUtcDays(todayIst, nextAllowanceDay));

  const derivedCycleDays = profile.lastAllowanceIso
    ? Math.max(7, diffUtcDays(profile.lastAllowanceIso, nextAllowanceDay))
    : Math.max(7, profile.cycleDays);

  const cycleDays = derivedCycleDays;
  const elapsedDays = Math.max(1, cycleDays - daysRemaining);
  const cycleProgressRatio = Math.min(1, Math.max(0, elapsedDays / cycleDays));

  // Upcoming active recurring bills due between today (inclusive) and next allowance date (exclusive of next reset)
  const upcomingBillsCents = recurring
    .filter(
      (r) =>
        r.active &&
        r.type === 'expense' &&
        r.nextDueIso.slice(0, 10) >= todayIst &&
        r.nextDueIso.slice(0, 10) < nextAllowanceDay
    )
    .reduce((sum, r) => sum + convertMinorUnits(r.amountCents), 0);

  const spendableAfterBillsCents = Math.max(0, liquidBalanceCents - upcomingBillsCents);
  const dailySafeSpendCents = Math.floor(spendableAfterBillsCents / daysRemaining);
  const expectedDailyBudgetCents = Math.max(
    100,
    Math.floor(profile.allowanceAmountCents / cycleDays)
  );

  // Sum posted transactions in current cycle window (since lastAllowanceIso or elapsedDays ago)
  const cycleStartDay = profile.lastAllowanceIso
    ? profile.lastAllowanceIso.slice(0, 10)
    : (() => {
        const [y, m, d] = todayIst.split('-').map(Number);
        return new Date(Date.UTC(y, (m || 1) - 1, (d || 1) - elapsedDays))
          .toISOString()
          .slice(0, 10);
      })();

  let spentThisCycleCents = 0;
  let incomeThisCycleCents = 0;

  for (const tx of transactions) {
    if (tx.status !== 'posted') continue;
    const txDayIst = toIstDateKey(tx.occurredAtUtc);
    if (txDayIst < cycleStartDay || txDayIst > todayIst) continue;
    const paise = convertMinorUnits(tx.amountCents);
    if (tx.type === 'expense') {
      spentThisCycleCents += paise;
    } else if (tx.type === 'income') {
      incomeThisCycleCents += paise;
    }
  }

  let pace: RunwayPace = 'on_track';
  if (liquidBalanceCents <= upcomingBillsCents) {
    pace = 'over';
  } else if (dailySafeSpendCents >= Math.round(expectedDailyBudgetCents * 1.15)) {
    pace = 'ahead';
  } else if (dailySafeSpendCents < Math.round(expectedDailyBudgetCents * 0.7)) {
    pace = 'caution';
  }

  return {
    daysRemaining,
    cycleDays,
    cycleProgressRatio,
    liquidBalanceCents,
    upcomingBillsCents,
    spendableAfterBillsCents,
    dailySafeSpendCents,
    expectedDailyBudgetCents,
    pace,
    spentThisCycleCents,
    incomeThisCycleCents,
    nextAllowanceLabel: formatDateDDMMM(nextAllowanceDay),
  };
}

/**
 * Computes monthly spending plan status per budget category in INR paise.
 */
export function computeBudgetStatuses(params: {
  budgets: BudgetPlan[];
  transactions: Transaction[];
  targetCurrency?: CurrencyCode;
}): BudgetStatus[] {
  const { budgets, transactions } = params;

  return budgets.map((budget) => {
    const limitCents = convertMinorUnits(budget.limitCents);
    const spentCents = transactions
      .filter(
        (tx) =>
          tx.status === 'posted' &&
          tx.type === 'expense' &&
          tx.category === budget.category &&
          toIstDateKey(tx.occurredAtUtc).slice(0, 7) === budget.monthKey
      )
      .reduce((sum, tx) => sum + convertMinorUnits(tx.amountCents), 0);

    const remainingCents = limitCents - spentCents;
    const utilizationRatio = limitCents > 0 ? spentCents / limitCents : 0;
    const status =
      utilizationRatio > 1 ? 'exceeded' : utilizationRatio >= 0.8 ? 'warning' : 'healthy';

    return {
      budget: { ...budget, limitCents, currency: 'INR' },
      spentCents,
      remainingCents,
      utilizationRatio,
      status,
    };
  });
}

/**
 * Computes savings vault progress, milestone level, and projected completion date at current pace.
 */
export function computeVaultMetrics(
  vault: SavingsVault,
  nowUtcIso: string = new Date().toISOString()
): {
  percent: number;
  remainingCents: number;
  estimatedWeeks: number | null;
  projectedDateLabel: string | null;
  milestoneLevel: 0 | 25 | 50 | 75 | 100;
} {
  const percent =
    vault.targetCents > 0
      ? Math.min(100, Math.round((vault.savedCents / vault.targetCents) * 100))
      : 0;
  const remainingCents = Math.max(0, vault.targetCents - vault.savedCents);
  const estimatedWeeks =
    remainingCents === 0
      ? 0
      : vault.weeklyAutoCents > 0
      ? Math.ceil(remainingCents / vault.weeklyAutoCents)
      : null;

  let projectedDateLabel: string | null = null;
  if (estimatedWeeks !== null) {
    const baseKey = toIstDateKey(nowUtcIso);
    const [y, m, d] = baseKey.split('-').map(Number);
    const proj = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + estimatedWeeks * 7));
    projectedDateLabel = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(proj);
  }

  let milestoneLevel: 0 | 25 | 50 | 75 | 100 = 0;
  if (percent >= 100) milestoneLevel = 100;
  else if (percent >= 75) milestoneLevel = 75;
  else if (percent >= 50) milestoneLevel = 50;
  else if (percent >= 25) milestoneLevel = 25;

  return { percent, remainingCents, estimatedWeeks, projectedDateLabel, milestoneLevel };
}

/**
 * Jar-inspired ₹10 round-up calculator: returns extra paise needed to reach next ₹10 (0 if already multiple of ₹10).
 */
export function computeRoundUpPaise(amountPaise: number): number {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) return 0;
  const remainder = amountPaise % 1000;
  return remainder === 0 ? 0 : 1000 - remainder;
}

/**
 * Computes exact per-member split paise for Equal, Exact, Percent, or Shares modes,
 * guaranteeing exact integer paise conservation (sum === amountCents).
 */
export function computeSplitShares(params: {
  amountCents: number;
  memberIds: string[];
  mode: SplitMode;
  rawValues?: Record<string, number>;
}): Record<string, number> {
  const { amountCents, memberIds, mode, rawValues = {} } = params;
  const shares: Record<string, number> = {};
  if (memberIds.length === 0 || amountCents <= 0) return shares;

  if (mode === 'equal') {
    const base = Math.floor(amountCents / memberIds.length);
    const rem = amountCents % memberIds.length;
    memberIds.forEach((id, idx) => {
      shares[id] = base + (idx < rem ? 1 : 0);
    });
    return shares;
  }

  if (mode === 'exact') {
    let running = 0;
    memberIds.forEach((id, idx) => {
      if (idx === memberIds.length - 1) {
        shares[id] = Math.max(0, amountCents - running);
      } else {
        const val = Math.max(0, Math.round(rawValues[id] ?? 0));
        const clamped = Math.min(val, amountCents - running);
        shares[id] = clamped;
        running += clamped;
      }
    });
    return shares;
  }

  // Percent or Shares: proportional integer allocation with remainder distributed deterministically
  const weights = memberIds.map((id) => Math.max(0, rawValues[id] ?? 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) {
    return computeSplitShares({ amountCents, memberIds, mode: 'equal' });
  }

  let allocated = 0;
  const remainders: Array<{ id: string; frac: number }> = [];
  memberIds.forEach((id, idx) => {
    const exact = (amountCents * weights[idx]) / totalWeight;
    const floored = Math.floor(exact);
    shares[id] = floored;
    allocated += floored;
    remainders.push({ id, frac: exact - floored });
  });

  let leftover = amountCents - allocated;
  remainders.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainders.length && leftover > 0; i++) {
    shares[remainders[i].id] += 1;
    leftover -= 1;
  }

  return shares;
}

/**
 * Greedy minimum-cash-flow debt settlement for a Circle.
 * Guarantees exact integer-paise conservation (sum of netBalances === 0).
 */
export function computeCircleSettlements(circle: ExpenseCircle): {
  totalSpendCents: number;
  netBalances: Record<string, number>;
  transfers: CircleDebtTransfer[];
} {
  const netBalances: Record<string, number> = {};
  for (const m of circle.members) {
    netBalances[m.id] = 0;
  }

  let totalSpendCents = 0;

  for (const exp of circle.expenses) {
    if (exp.settled) continue;
    const amountInPaise = convertMinorUnits(exp.amountCents);
    if (!exp.settledRef) {
      totalSpendCents += amountInPaise;
    }

    const participants = exp.splitBetweenIds.filter((id) => id in netBalances);
    if (participants.length === 0) continue;

    if (exp.paidByMemberId in netBalances) {
      netBalances[exp.paidByMemberId] += amountInPaise;
    }

    if (exp.customSplits) {
      let splitSum = 0;
      const validIds = participants.filter((id) => typeof exp.customSplits?.[id] === 'number');
      if (validIds.length === participants.length) {
        for (const id of participants) {
          splitSum += exp.customSplits[id];
        }
        if (splitSum === amountInPaise) {
          for (const id of participants) {
            netBalances[id] -= exp.customSplits[id];
          }
          continue;
        }
      }
    }

    const baseShare = Math.floor(amountInPaise / participants.length);
    const remainder = amountInPaise % participants.length;
    participants.forEach((memberId, idx) => {
      const share = baseShare + (idx < remainder ? 1 : 0);
      netBalances[memberId] -= share;
    });
  }

  const memberById = new Map(circle.members.map((m) => [m.id, m]));
  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];

  for (const [id, net] of Object.entries(netBalances)) {
    if (net < 0) debtors.push({ id, amount: -net });
    else if (net > 0) creditors.push({ id, amount: net });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: CircleDebtTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      const fromM = memberById.get(debtor.id);
      const toM = memberById.get(creditor.id);
      transfers.push({
        fromMemberId: debtor.id,
        fromName: fromM?.name ?? debtor.id,
        fromUpiId: fromM?.upiId,
        fromPhone: fromM?.phone,
        toMemberId: creditor.id,
        toName: toM?.name ?? creditor.id,
        toUpiId: toM?.upiId,
        toPhone: toM?.phone,
        amountCents: settleAmount,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;
    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return { totalSpendCents, netBalances, transfers };
}

/**
 * Builds a WhatsApp wa.me reminder link with pre-filled ₹ amount and UPI ID.
 */
export function buildWhatsAppRemindUrl(params: {
  phone?: string;
  fromName: string;
  toName: string;
  circleName: string;
  amountCents: number;
  toUpiId?: string;
}): string {
  const digits = (params.phone || '').replace(/\D/g, '');
  const amt = fmtINR(params.amountCents);
  const upiSuffix = params.toUpiId ? ` UPI ID: ${params.toUpiId}` : '';
  const text = `Hey ${params.fromName}! Friendly reminder for ${params.circleName}: ${amt} pending to ${params.toName}.${upiSuffix}`;
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Idempotent transaction batch importer (deduplicates against existing idempotencyKeys).
 */
export function mergeIdempotentTransactions(
  existing: Transaction[],
  incoming: Transaction[]
): {
  merged: Transaction[];
  addedCount: number;
  duplicateCount: number;
} {
  const seenKeys = new Set<string>();
  for (const tx of existing) {
    if (tx.idempotencyKey) seenKeys.add(tx.idempotencyKey);
    seenKeys.add(tx.id);
  }

  const additions: Transaction[] = [];
  let duplicateCount = 0;

  for (const tx of incoming) {
    const key = tx.idempotencyKey || tx.id;
    if (seenKeys.has(key) || seenKeys.has(tx.id)) {
      duplicateCount++;
      continue;
    }
    seenKeys.add(key);
    seenKeys.add(tx.id);
    additions.push(tx);
  }

  const merged = [...additions, ...existing].sort(
    (a, b) => new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime()
  );

  return {
    merged,
    addedCount: additions.length,
    duplicateCount,
  };
}

/**
 * Computes total liquid balance across all accounts in INR paise.
 */
export function computeTotalBalanceCents(
  accounts: FinancialAccount[],
  _targetCurrency?: CurrencyCode
): number {
  return accounts.reduce((sum, acc) => sum + convertMinorUnits(acc.balanceCents), 0);
}

/**
 * Computes 7-day Monday-to-Sunday daily spending series in IST for the Home chart.
 */
export function computeWeeklySpendingSeries(params: {
  transactions: Transaction[];
  targetCurrency?: CurrencyCode;
  nowUtcIso: string;
}): Array<{ dayKey: string; label: string; spentCents: number }> {
  const { transactions, nowUtcIso } = params;
  const todayIst = toIstDateKey(nowUtcIso);
  const [y, m, d] = todayIst.split('-').map(Number);
  const todayDt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));

  // Monday = 0 ... Sunday = 6
  const utcDay = todayDt.getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay;
  const mondayDt = new Date(
    Date.UTC(y, (m || 1) - 1, (d || 1) + mondayOffset)
  );

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const series: Array<{ dayKey: string; label: string; spentCents: number }> = [];

  for (let i = 0; i < 7; i++) {
    const dayDt = new Date(
      Date.UTC(
        mondayDt.getUTCFullYear(),
        mondayDt.getUTCMonth(),
        mondayDt.getUTCDate() + i
      )
    );
    const dayKey = dayDt.toISOString().slice(0, 10);
    const spentCents = transactions
      .filter(
        (tx) =>
          tx.status === 'posted' &&
          tx.type === 'expense' &&
          toIstDateKey(tx.occurredAtUtc) === dayKey
      )
      .reduce((sum, tx) => sum + convertMinorUnits(tx.amountCents), 0);

    series.push({ dayKey, label: dayNames[i], spentCents });
  }

  return series;
}

/**
 * Computes monthly Money Report metrics comparing current IST month vs previous month.
 */
export function computeMonthlyMoneyReport(
  state: MintlyWorkspaceState,
  nowUtcIso: string
): MonthlyMoneyReport {
  const todayIst = toIstDateKey(nowUtcIso);
  const monthKey = todayIst.slice(0, 7);
  const [year, month] = monthKey.split('-').map(Number);
  const prevDate = new Date(Date.UTC(year, (month || 1) - 2, 1));
  const previousMonthKey = prevDate.toISOString().slice(0, 7);

  let totalSpentCents = 0;
  let previousMonthSpentCents = 0;
  let totalIncomeCents = 0;

  const categoryTotals: Partial<Record<BudgetCategory, number>> = {};
  const dayTotals: Record<string, number> = {};

  for (const tx of state.transactions) {
    if (tx.status !== 'posted') continue;
    const dayIst = toIstDateKey(tx.occurredAtUtc);
    const txMonth = dayIst.slice(0, 7);
    const amt = convertMinorUnits(tx.amountCents);

    if (txMonth === monthKey) {
      if (tx.type === 'expense') {
        totalSpentCents += amt;
        if (tx.category !== 'income' && tx.category !== 'savings') {
          categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + amt;
        }
        dayTotals[dayIst] = (dayTotals[dayIst] ?? 0) + amt;
      } else if (tx.type === 'income') {
        totalIncomeCents += amt;
      }
    } else if (txMonth === previousMonthKey && tx.type === 'expense') {
      previousMonthSpentCents += amt;
    }
  }

  const deltaPercent =
    previousMonthSpentCents > 0
      ? Math.round(
          ((totalSpentCents - previousMonthSpentCents) / previousMonthSpentCents) * 100
        )
      : 0;

  const topEntry = Object.entries(categoryTotals).sort(
    (a, b) => (b[1] ?? 0) - (a[1] ?? 0)
  )[0];
  const topCategory = (topEntry?.[0] as BudgetCategory | undefined) ?? null;
  const topCategorySpentCents = topEntry?.[1] ?? 0;

  const bestDayEntry = Object.entries(dayTotals).sort((a, b) => a[1] - b[1])[0];
  const bestDayLabel = bestDayEntry ? formatDateDDMMM(bestDayEntry[0]) : null;
  const bestDaySpentCents = bestDayEntry ? bestDayEntry[1] : 0;

  const savedCents = Math.max(0, totalIncomeCents - totalSpentCents);

  return {
    monthKey,
    previousMonthKey,
    totalSpentCents,
    previousMonthSpentCents,
    deltaPercent,
    totalIncomeCents,
    savedCents,
    topCategory,
    topCategorySpentCents,
    bestDayLabel,
    bestDaySpentCents,
  };
}

/**
 * Computes calendar & balance-aware student nudges (Exam week, Fest season, Diwali, Semester fee, Month-end).
 */
export function computeContextualNudges(
  state: MintlyWorkspaceState,
  runway: AllowanceRunwaySummary,
  nowUtcIso: string
): ContextualNudge[] {
  const istKey = toIstDateKey(nowUtcIso);
  const month = Number(istKey.slice(5, 7));
  const day = Number(istKey.slice(8, 10));
  const nudges: ContextualNudge[] = [];

  if (runway.pace === 'caution' || runway.pace === 'over' || day >= 24) {
    nudges.push({
      id: 'nudge_month_end',
      kind: 'month_end',
      title: 'Month-end buffer check',
      body: `${runway.daysRemaining} days until ${runway.nextAllowanceLabel}. Keeping daily spends under ${fmtINR(runway.dailySafeSpendCents)} keeps mess & recharge bills protected.`,
      actionLabel: 'Review Budgets',
    });
  }

  const semFee = state.recurring.find(
    (r) => r.active && /semester|fee/i.test(r.title)
  );
  if (semFee) {
    nudges.push({
      id: 'nudge_sem_fee',
      kind: 'fee',
      title: 'Semester fee due ahead',
      body: `${semFee.title} (${fmtINR(semFee.amountCents)}) is due on ${formatDateDDMMM(semFee.nextDueIso)}.`,
      actionLabel: 'Check Bills',
    });
  }

  if (month === 10 || month === 11) {
    nudges.push({
      id: 'nudge_fest_exam',
      kind: 'exam',
      title: 'End-sem prep week nudge',
      body: 'Swapping 2 Swiggy late-night orders for hostel canteen chai frees ~₹450 for your Placement Prep Kit.',
      actionLabel: 'Boost Vault',
    });
  }

  if (month === 10 || month === 11) {
    nudges.push({
      id: 'nudge_diwali',
      kind: 'diwali',
      title: 'Festive & Diwali gifting',
      body: 'Set aside small ₹200 drops in your Diwali & Gifts vault so festival sweets and train tickets stay stress-free.',
      actionLabel: 'Open Vaults',
    });
  }

  return nudges.slice(0, 3);
}

export interface MochiAccessorySpec {
  id: string;
  label: string;
  hinglishLabel: string;
  description: string;
  costCoins: number;
}

export const MOCHI_ACCESSORIES: MochiAccessorySpec[] = [
  {
    id: 'mochi_specs',
    label: 'Campus Specs',
    hinglishLabel: 'Smart Chashma',
    description: 'Signature round frames for late-night library grinds.',
    costCoins: 80,
  },
  {
    id: 'mochi_headphones',
    label: 'Lo-Fi Headphones',
    hinglishLabel: 'Lo-Fi Headphones',
    description: 'Mint-teal studio cans for coding & focus sprints.',
    costCoins: 120,
  },
  {
    id: 'mochi_grad_cap',
    label: 'B.Tech Grad Cap',
    hinglishLabel: 'B.Tech Topi',
    description: 'Convocation tassel unlocked by steady budget discipline.',
    costCoins: 160,
  },
  {
    id: 'mochi_diwali_crown',
    label: 'Festive Diya Crown',
    hinglishLabel: 'Festive Crown',
    description: 'Golden marigold crown for Diwali & fest season savings.',
    costCoins: 200,
  },
];

/**
 * Generates a grounded INR snapshot payload for Mochi Coach (Gemini + offline fallback).
 */
export function buildCoachFinancialSnapshot(state: MintlyWorkspaceState, nowUtcIso: string) {
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
  const totalBalancePaise = computeTotalBalanceCents(state.accounts);
  const monthlyReport = computeMonthlyMoneyReport(state, nowUtcIso);

  const categoryTotals: Partial<Record<SpendingCategory, number>> = {};
  for (const tx of state.transactions) {
    if (tx.status !== 'posted' || tx.type !== 'expense') continue;
    categoryTotals[tx.category] = (categoryTotals[tx.category] ?? 0) + tx.amountCents;
  }

  const targetVault = state.vaults.find((v) => v.id === state.roundUp?.targetVaultId);

  return {
    studentName: state.profile.displayName,
    university: state.profile.university,
    stayType: state.profile.stayType || 'hostel',
    currency: 'INR',
    language: state.profile.language,
    totalBalanceFormatted: fmtINR(totalBalancePaise),
    liquidBalanceFormatted: fmtINR(runway.liquidBalanceCents),
    upcomingBillsFormatted: fmtINR(runway.upcomingBillsCents),
    dailySafeSpendFormatted: fmtINR(runway.dailySafeSpendCents),
    daysUntilAllowance: runway.daysRemaining,
    nextAllowanceDate: runway.nextAllowanceLabel,
    pace: runway.pace,
    spentThisCycleFormatted: fmtINR(runway.spentThisCycleCents),
    incomeThisCycleFormatted: fmtINR(runway.incomeThisCycleCents),
    roundUp: {
      enabled: Boolean(state.roundUp?.enabled),
      monthlySaved: fmtINR(state.roundUp?.monthlySavedCents ?? 0),
      targetVault: targetVault?.title ?? state.vaults[0]?.title ?? 'Goa Trip',
    },
    rewards: {
      coins: state.rewards?.coins ?? 0,
      streakDays: state.rewards?.streakDays ?? 1,
    },
    monthlyReport: {
      monthKey: monthlyReport.monthKey,
      totalSpent: fmtINR(monthlyReport.totalSpentCents),
      previousMonthSpent: fmtINR(monthlyReport.previousMonthSpentCents),
      deltaPercent: monthlyReport.deltaPercent,
      savedThisMonth: fmtINR(monthlyReport.savedCents),
      topCategory: monthlyReport.topCategory,
    },
    upcomingBills: state.recurring
      .filter((r) => r.active && r.type === 'expense')
      .map((r) => ({
        title: r.title,
        amount: fmtINR(r.amountCents),
        dueDate: formatDateDDMMM(r.nextDueIso),
      })),
    accounts: state.accounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: fmtINR(a.balanceCents),
      frozen: Boolean(a.frozen),
    })),
    budgets: budgets.map((b) => ({
      category: b.budget.category,
      spent: fmtINR(b.spentCents),
      limit: fmtINR(b.budget.limitCents),
      remaining: fmtINR(Math.max(0, b.remainingCents)),
      status: b.status,
    })),
    vaults: state.vaults.map((v) => {
      const m = computeVaultMetrics(v, nowUtcIso);
      return {
        id: v.id,
        title: v.title,
        saved: fmtINR(v.savedCents),
        target: fmtINR(v.targetCents),
        percent: m.percent,
        projectedDate: m.projectedDateLabel,
      };
    }),
    circlesPending: state.circles.map((c) => {
      const s = computeCircleSettlements(c);
      const selfMember = c.members.find((m) => m.isSelf);
      const selfNet = selfMember ? s.netBalances[selfMember.id] ?? 0 : 0;
      return {
        name: c.name,
        yourNetBalance: fmtINR(selfNet, { sign: true }),
        pendingTransfers: s.transfers.slice(0, 3).map((tr) => ({
          from: tr.fromName,
          to: tr.toName,
          amount: fmtINR(tr.amountCents),
        })),
      };
    }),
    recentTransactions: state.transactions.slice(0, 8).map((tx) => ({
      merchant: tx.merchant,
      amount: fmtINR(tx.amountCents),
      type: tx.type,
      category: tx.category,
      date: formatDateDDMMM(tx.occurredAtUtc),
    })),
    topCategories: Object.entries(categoryTotals)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 4)
      .map(([category, paise]) => ({
        category,
        total: fmtINR(paise ?? 0),
      })),
  };
}

export interface ParsedSmsTransaction {
  amountCents: number;
  type: 'expense' | 'income';
  merchant: string;
  category: SpendingCategory;
  paymentMode: PaymentMode;
  upiRef: string;
  paidToUpiId?: string;
  dateIso: string;
  rawText: string;
}

export const SAMPLE_INDIAN_BANK_SMS: Array<{
  id: string;
  bank: string;
  label: string;
  sms: string;
}> = [
  {
    id: 'sms_hdfc_swiggy',
    bank: 'HDFC',
    label: 'HDFC · Swiggy ₹250',
    sms: 'Rs.250.00 debited from A/c XX4821 on 14-Nov-26 to VPA swiggy@icici (UPI Ref 431910284712). Not you? Call 18002586161.',
  },
  {
    id: 'sms_sbi_chai',
    bank: 'SBI',
    label: 'SBI · Chai Tapri ₹45',
    sms: 'Dear UPI user A/c X4821 debited by Rs 45.00 on date 14Nov26 trf to SHARMA CHAI TAPRI Refno 431922410985. If not u? call-SBI',
  },
  {
    id: 'sms_icici_credit',
    bank: 'ICICI',
    label: 'ICICI · Tutoring +₹1,500',
    sms: 'INR 1,500.00 credited to A/c XX4821 on 14-Nov-26 via UPI from VPA rohan.verma@okaxis (UPI Ref 431933812044).',
  },
  {
    id: 'sms_axis_blinkit',
    bank: 'Axis',
    label: 'Axis · Blinkit ₹318.50',
    sms: 'INR 318.50 debited from A/c no. XX4821 on 14-11-2026 at BLINKIT GROCERIES. Info: UPI/431944910231.',
  },
  {
    id: 'sms_kotak_rapido',
    bank: 'Kotak',
    label: 'Kotak · Rapido ₹82',
    sms: 'Sent Rs.82.00 from Kotak Bank A/c X4821 to rapido.rides@ybl on 14-11-26. UPI Ref: 431955102984.',
  },
];

/**
 * Deterministic category guesser for Indian merchants & UPI VPAs.
 */
export function suggestCategoryForMerchant(
  merchant: string,
  fallbackType: 'expense' | 'income' = 'expense'
): SpendingCategory {
  if (fallbackType === 'income') return 'income';
  const m = merchant.toLowerCase();
  if (/chai|canteen|swiggy|zomato|cafe|mess|biryani|dosa|maggi|coffee|bakery|nescafe|samosa/.test(m)) {
    return 'dining';
  }
  if (/blinkit|zepto|instamart|kirana|bigbasket|dmart|mart|grocer|milk|dairy|amul/.test(m)) {
    return 'groceries';
  }
  if (/rapido|uber|ola|auto|metro|dmrc|bus|irctc|train|rickshaw|petrol|yulu/.test(m)) {
    return 'transport';
  }
  if (/xerox|print|book|stationery|pen|notebook|amazon|flipkart|crossword/.test(m)) {
    return 'textbooks';
  }
  if (/airtel|jio|vi |recharge|spotify|netflix|prime|youtube|notion|icloud|wifi/.test(m)) {
    return 'subscriptions';
  }
  if (/pvr|inox|cinema|fest|concert|movie|bms|bookmyshow|arcade/.test(m)) {
    return 'fun';
  }
  if (/hostel rent|pg rent|room rent/.test(m)) {
    return 'rent';
  }
  if (/pharmacy|apollo|medplus|gym|cult|health|clinic|1mg/.test(m)) {
    return 'health';
  }
  if (/laundry|dhobi|wash|iron/.test(m)) {
    return 'laundry';
  }
  if (/diwali|sweet|haldiram|gift|rakhi|archies|mithai/.test(m)) {
    return 'festivals';
  }
  if (/goa|trip|nandi|redbus|makemytrip|zostel/.test(m)) {
    return 'trips';
  }
  return 'dining';
}

/**
 * Regex fallback parser for Indian bank & UPI SMS alerts.
 */
export function parseBankSmsFallback(
  rawSms: string,
  nowUtcIso: string = new Date().toISOString()
): ParsedSmsTransaction | null {
  const amtMatch = rawSms.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amtMatch) return null;
  const amountCents = parseAmountToCents(amtMatch[1]);
  if (!amountCents) return null;

  const isCredit = /\b(credited|received|deposited|refund|cashback)\b/i.test(rawSms);
  const type: 'expense' | 'income' = isCredit ? 'income' : 'expense';

  // Prefer VPA when present (avoid capturing bank codes as merchant)
  const vpaMatch = rawSms.match(/(?:to|from)?\s*(?:vpa\s+)?([a-z0-9._-]+@[a-z0-9]+)/i);
  const paidToUpiId = vpaMatch?.[1]?.toLowerCase();

  // Match merchant after trf to / at / to / from while ignoring account numbers (A/c XX1234)
  const merchantAtMatch = rawSms.match(
    /(?:trf\s+to|at|(?<!debited\s+from\s+|credited\s+)to|(?<!debited\s+)from)\s+(?!A\/c\b|VPA\b)([A-Za-z0-9 &'._-]{2,34}?)(?=\s+(?:on\s+\d|refno|upi\s*ref|ref\b|utr|info|\()|\s*[.,]|$)/i
  );

  let merchant = 'UPI Merchant';
  if (paidToUpiId) {
    const handle = paidToUpiId.split('@')[0].replace(/[._-]+/g, ' ');
    merchant = handle.replace(/\b\w/g, (c) => c.toUpperCase());
  } else if (merchantAtMatch?.[1] && !/^a\/c/i.test(merchantAtMatch[1].trim())) {
    const rawMerch = merchantAtMatch[1].trim();
    merchant =
      rawMerch === rawMerch.toUpperCase()
        ? rawMerch.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : rawMerch;
  }

  const refMatch = rawSms.match(
    /(?:upi\s*ref(?:\s*no)?|ref\s*no|refno|ref|utr|upi)[:\s/#-]*(\d{8,16})/i
  );
  const upiRef =
    refMatch?.[1]?.slice(0, 12).padEnd(12, '0') ??
    `${Math.floor(400000000000 + (amountCents % 599999999999))}`;

  return {
    amountCents,
    type,
    merchant,
    category: suggestCategoryForMerchant(merchant, type),
    paymentMode: /upi|vpa/i.test(rawSms) || Boolean(paidToUpiId) ? 'upi' : 'bank',
    upiRef,
    paidToUpiId,
    dateIso: nowUtcIso,
    rawText: rawSms.trim(),
  };
}

/**
 * Parses multi-line pasted Indian bank SMS alerts OR CSV lines ("Merchant, Amount, Category").
 */
export function parseImportTextFallback(
  rawText: string,
  nowUtcIso: string = new Date().toISOString()
): ParsedSmsTransaction[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedSmsTransaction[] = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    // Try bank SMS first if it has bank/UPI cues
    if (/(?:rs\.?|inr|₹|debited|credited|vpa|upi|a\/c)/i.test(line)) {
      const smsParsed = parseBankSmsFallback(line, nowUtcIso);
      if (smsParsed) {
        results.push(smsParsed);
        continue;
      }
    }

    // CSV format: Merchant, Amount, [Category], [expense|income]
    const parts = line.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      const [rawMerchant, rawAmount, rawCat, rawType] = parts;
      if (/^merchant$/i.test(rawMerchant)) continue; // skip header row
      const cents = parseAmountToCents(rawAmount);
      if (cents && rawMerchant) {
        const type: 'expense' | 'income' =
          rawType?.toLowerCase() === 'income' ? 'income' : 'expense';
        const validCat = rawCat as SpendingCategory | undefined;
        results.push({
          amountCents: cents,
          type,
          merchant: rawMerchant.slice(0, 80),
          category:
            validCat && validCat.length > 0
              ? validCat
              : suggestCategoryForMerchant(rawMerchant, type),
          paymentMode: 'upi',
          upiRef: `${431900000000 + ((cents + idx * 137) % 99999999)}`,
          dateIso: nowUtcIso,
          rawText: line,
        });
      }
    }
  }
  return results;
}

export interface ParsedUpiQr {
  vpa: string;
  merchant: string;
  amountCents: number | null;
  note?: string;
  category: SpendingCategory;
  rawUri: string;
}

export const SAMPLE_UPI_QR_CODES: Array<{
  id: string;
  label: string;
  merchant: string;
  vpa: string;
  amountLabel: string;
  uri: string;
}> = [
  {
    id: 'qr_chai',
    label: 'Chai Tapri · ₹45',
    merchant: 'Sharma Chai Tapri',
    vpa: 'sharma.chai@okicici',
    amountLabel: '₹45',
    uri: 'upi://pay?pa=sharma.chai@okicici&pn=Sharma%20Chai%20Tapri&am=45.00&cu=INR&tn=Masala%20Chai',
  },
  {
    id: 'qr_canteen',
    label: 'Canteen · ₹120',
    merchant: 'College Canteen',
    vpa: 'hostel.canteen@okaxis',
    amountLabel: '₹120',
    uri: 'upi://pay?pa=hostel.canteen@okaxis&pn=College%20Canteen&am=120&cu=INR&tn=Lunch%20Thali',
  },
  {
    id: 'qr_xerox',
    label: 'Xerox · ₹60',
    merchant: 'Local Xerox Shop',
    vpa: 'campus.xerox@ybl',
    amountLabel: '₹60',
    uri: 'upi://pay?pa=campus.xerox@ybl&pn=Local%20Xerox%20Shop&am=60&cu=INR&tn=OS%20Lab%20Printouts',
  },
  {
    id: 'qr_blinkit',
    label: 'Blinkit · ₹248.50',
    merchant: 'Blinkit Express',
    vpa: 'blinkit.pay@icici',
    amountLabel: '₹248.50',
    uri: 'upi://pay?pa=blinkit.pay@icici&pn=Blinkit%20Express&am=248.50&cu=INR&tn=Hostel%20Snacks',
  },
];

/**
 * Parses a standard NPCI UPI QR payload (`upi://pay?pa=...&pn=...&am=...&tn=...`)
 * into clean merchant, VPA, integer paise amount, and auto-detected category.
 */
export function parseUpiQrUri(rawUri: string): ParsedUpiQr | null {
  const trimmed = rawUri.trim();
  if (!trimmed) return null;

  const queryStart = trimmed.indexOf('?');
  const queryString =
    trimmed.toLowerCase().startsWith('upi://') && queryStart >= 0
      ? trimmed.slice(queryStart + 1)
      : trimmed.includes('pa=')
        ? trimmed.replace(/^\?/, '')
        : '';

  if (!queryString) return null;

  const params = new URLSearchParams(queryString);
  const vpa = (params.get('pa') || '').trim().toLowerCase();
  if (!vpa || !vpa.includes('@')) return null;

  const rawPn = (params.get('pn') || '').trim();
  const handleFallback = vpa
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const merchant = rawPn || handleFallback;

  const rawAm = (params.get('am') || '').trim();
  const amountCents = rawAm ? parseAmountToCents(rawAm) : null;
  const note = (params.get('tn') || '').trim() || undefined;

  return {
    vpa,
    merchant,
    amountCents,
    note,
    category: suggestCategoryForMerchant(merchant, 'expense'),
    rawUri: trimmed,
  };
}

export interface MascotStateResolution {
  mood: MascotMood;
  triggerLabel: string;
}

/**
 * Resolves Mochi's animated expression from live spending health and savings vault milestones.
 */
export function resolveMascotState(params: {
  runway: AllowanceRunwaySummary;
  budgets: BudgetStatus[];
  vaults: SavingsVault[];
  recentMilestoneTitle?: string | null;
}): MascotStateResolution {
  const { runway, budgets, vaults, recentMilestoneTitle } = params;

  if (recentMilestoneTitle) {
    return {
      mood: 'celebrate',
      triggerLabel: `Milestone unlocked · ${recentMilestoneTitle}`,
    };
  }

  const exceededBudget = budgets.find((b) => b.status === 'exceeded');
  if (runway.pace === 'over' || exceededBudget) {
    return {
      mood: 'coach',
      triggerLabel: exceededBudget
        ? `Over ${exceededBudget.budget.category} plan`
        : 'Bills reserve tight',
    };
  }

  const warningBudget = budgets.find((b) => b.status === 'warning');
  if (runway.pace === 'caution' || warningBudget) {
    return {
      mood: 'caution',
      triggerLabel: warningBudget
        ? `${warningBudget.budget.category} at ${Math.round(warningBudget.utilizationRatio * 100)}%`
        : 'Daily safe spend tightening',
    };
  }

  const topMilestoneVault = vaults
    .map((v) => ({ vault: v, metrics: computeVaultMetrics(v) }))
    .filter(({ metrics }) => metrics.percent >= 75)
    .sort((a, b) => b.metrics.percent - a.metrics.percent)[0];

  if (topMilestoneVault && (runway.pace === 'ahead' || topMilestoneVault.metrics.percent >= 100)) {
    return {
      mood: 'celebrate',
      triggerLabel: `${topMilestoneVault.vault.title} · ${topMilestoneVault.metrics.percent}% milestone`,
    };
  }

  return {
    mood: 'happy',
    triggerLabel: runway.pace === 'ahead' ? 'Healthy runway buffer' : 'Steady semester pace',
  };
}

export interface WorkspaceInvariantReport {
  ok: boolean;
  totalAccountsPaise: number;
  homeLiquidPaise: number;
  budgetedSpendSumPaise: number;
  plansSpendSumPaise: number;
  circleBalanceSums: Array<{ circleId: string; name: string; netSumPaise: number }>;
  errors: string[];
}

/**
 * Single-source-of-truth sanity checks:
 * 1. Sum of account balances === Home liquid total (for liquid accounts)
 * 2. Sum of category spend on Home budgets === Plans totals
 * 3. Every Circle's member net balances sum strictly to zero
 * 4. All monetary values are integer paise in INR
 */
export function validateWorkspaceInvariants(
  state: MintlyWorkspaceState,
  nowUtcIso: string = new Date().toISOString()
): WorkspaceInvariantReport {
  const errors: string[] = [];

  for (const acc of state.accounts) {
    if (!Number.isInteger(acc.balanceCents)) {
      errors.push(`Account ${acc.id} has non-integer balance ${acc.balanceCents}`);
    }
    if (acc.currency !== 'INR') {
      errors.push(`Account ${acc.id} currency expected INR, got ${acc.currency}`);
    }
  }

  for (const tx of state.transactions) {
    if (!Number.isInteger(tx.amountCents) || tx.amountCents <= 0) {
      errors.push(`Transaction ${tx.id} invalid paise ${tx.amountCents}`);
    }
    if (tx.currency !== 'INR') {
      errors.push(`Transaction ${tx.id} currency expected INR, got ${tx.currency}`);
    }
  }

  const totalAccountsPaise = computeTotalBalanceCents(state.accounts);
  const runway = computeAllowanceRunway({
    profile: state.profile,
    accounts: state.accounts,
    transactions: state.transactions,
    recurring: state.recurring,
    nowUtcIso,
  });

  if (totalAccountsPaise !== runway.liquidBalanceCents) {
    errors.push(
      `Account sum (${totalAccountsPaise}) !== Home liquid balance (${runway.liquidBalanceCents})`
    );
  }

  const budgetStatuses = computeBudgetStatuses({
    budgets: state.budgets,
    transactions: state.transactions,
  });
  const budgetedSpendSumPaise = budgetStatuses.reduce((s, b) => s + b.spentCents, 0);

  const budgetCategories = new Set(state.budgets.map((b) => b.category));
  const activeMonth = state.budgets[0]?.monthKey ?? toIstDateKey(nowUtcIso).slice(0, 7);
  const plansSpendSumPaise = state.transactions
    .filter(
      (tx) =>
        tx.status === 'posted' &&
        tx.type === 'expense' &&
        toIstDateKey(tx.occurredAtUtc).slice(0, 7) === activeMonth &&
        budgetCategories.has(tx.category as BudgetCategory)
    )
    .reduce((s, tx) => s + tx.amountCents, 0);

  if (budgetedSpendSumPaise !== plansSpendSumPaise) {
    errors.push(
      `Budget sum (${budgetedSpendSumPaise}) !== Plans category spend sum (${plansSpendSumPaise})`
    );
  }

  const circleBalanceSums = state.circles.map((circle) => {
    const res = computeCircleSettlements(circle);
    const netSumPaise = Object.values(res.netBalances).reduce((a, b) => a + b, 0);
    if (netSumPaise !== 0) {
      errors.push(`Circle ${circle.name} net balances sum to ${netSumPaise}, expected 0`);
    }
    return { circleId: circle.id, name: circle.name, netSumPaise };
  });

  return {
    ok: errors.length === 0,
    totalAccountsPaise,
    homeLiquidPaise: runway.liquidBalanceCents,
    budgetedSpendSumPaise,
    plansSpendSumPaise,
    circleBalanceSums,
    errors,
  };
}
