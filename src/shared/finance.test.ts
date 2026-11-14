import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCoachFinancialSnapshot,
  computeAllowanceRunway,
  computeBudgetStatuses,
  computeCircleSettlements,
  computeContextualNudges,
  computeMonthlyMoneyReport,
  computeRoundUpPaise,
  computeSplitShares,
  computeVaultMetrics,
  computeWeeklySpendingSeries,
  convertMinorUnits,
  fmtINR,
  formatActivityDayHeader,
  formatDateDDMMM,
  mergeIdempotentTransactions,
  parseAmountToCents,
  parseBankSmsFallback,
  resolveMascotState,
  splitINRParts,
  validateWorkspaceInvariants,
} from './finance';
import { createInitialSeedState } from './seed';
import type { ExpenseCircle, Transaction } from './types';

test('fmtINR formats integer paise with Indian grouping, paise hiding, and compact Lakhs', () => {
  assert.equal(fmtINR(11490000), '₹1,14,900');
  assert.equal(fmtINR(11490000, { compact: true }), '₹1.15L');
  assert.equal(fmtINR(25000), '₹250');
  assert.equal(fmtINR(25050), '₹250.50');
  assert.equal(fmtINR(25000, { showPaise: true }), '₹250.00');
  assert.equal(fmtINR(300, { sign: true }), '+₹3');
  assert.equal(fmtINR(-25000), '-₹250');
  assert.throws(() => fmtINR(12.5));

  const parts = splitINRParts(11490050);
  assert.equal(parts.symbol, '₹');
  assert.equal(parts.whole, '1,14,900');
  assert.equal(parts.paiseSuffix, '.50');
});

test('parseAmountToCents converts INR strings accurately without float drift', () => {
  assert.equal(parseAmountToCents('1,14,900'), 11490000);
  assert.equal(parseAmountToCents('₹245.50'), 24550);
  assert.equal(parseAmountToCents('19.99'), 1999);
  assert.equal(parseAmountToCents('0'), null);
  assert.equal(parseAmountToCents('-12.00'), null);
  assert.equal(parseAmountToCents('12.345'), null);
});

test('convertMinorUnits preserves integer paise with zero FX drift', () => {
  assert.equal(convertMinorUnits(10000, 'INR', 'INR'), 10000);
  assert.equal(convertMinorUnits(25000), 25000);
  assert.throws(() => convertMinorUnits(10.5));
});

test('IST date formatting uses DD MMM, Today/Yesterday headers, and Monday-start weeks', () => {
  const nowIso = '2026-11-14T08:30:00.000Z'; // 14 Nov 2026 2:00 PM IST (Saturday)
  assert.equal(formatDateDDMMM(nowIso), '14 Nov');
  assert.equal(formatActivityDayHeader('2026-11-14T04:00:00.000Z', nowIso), 'Today');
  assert.equal(formatActivityDayHeader('2026-11-13T16:00:00.000Z', nowIso), 'Yesterday');
  assert.equal(formatActivityDayHeader('2026-11-12T12:00:00.000Z', nowIso), '12 Nov');

  const seed = createInitialSeedState(nowIso);
  const week = computeWeeklySpendingSeries({
    transactions: seed.transactions,
    nowUtcIso: nowIso,
  });
  assert.equal(week.length, 7);
  assert.equal(week[0].label, 'Mon');
  assert.equal(week[6].label, 'Sun');
});

test('Indian student seed data invariants pass (accounts, budgets, 40 txs, runway, circles)', () => {
  const nowIso = '2026-11-14T08:30:00.000Z';
  const seed = createInitialSeedState(nowIso);

  assert.equal(seed.accounts.length, 4);
  assert.equal(seed.transactions.length, 40);
  assert.equal(seed.vaults.length, 5);
  assert.equal(seed.circles.length, 3);
  assert.equal(seed.budgets.length, 6);

  const report = validateWorkspaceInvariants(seed, nowIso);
  assert.equal(report.ok, true, `Invariants failed: ${report.errors.join('; ')}`);
  assert.equal(report.totalAccountsPaise, 1119000); // ₹11,190
  assert.equal(report.homeLiquidPaise, 1119000);
  assert.equal(report.budgetedSpendSumPaise, report.plansSpendSumPaise);

  const runway = computeAllowanceRunway({
    profile: seed.profile,
    accounts: seed.accounts,
    transactions: seed.transactions,
    recurring: seed.recurring,
    nowUtcIso: nowIso,
  });
  assert.equal(runway.daysRemaining, 17); // 14 Nov -> 1 Dec
  assert.equal(runway.nextAllowanceLabel, '1 Dec');
  assert.equal(runway.upcomingBillsCents, 420800); // ₹3,200 + ₹299 + ₹59 + ₹650 = ₹4,208
  assert.equal(runway.spendableAfterBillsCents, 698200); // ₹6,982
  assert.equal(runway.dailySafeSpendCents, Math.floor(698200 / 17)); // ₹410.70/day

  const monthlyReport = computeMonthlyMoneyReport(seed, nowIso);
  assert.ok(monthlyReport.totalSpentCents > 0);
  assert.ok(monthlyReport.previousMonthSpentCents > 0);
});

test('computeRoundUpPaise rounds up to next ₹10 accurately', () => {
  assert.equal(computeRoundUpPaise(24500), 500); // ₹245 -> +₹5
  assert.equal(computeRoundUpPaise(24300), 700); // ₹243 -> +₹7
  assert.equal(computeRoundUpPaise(25000), 0);   // ₹250 -> ₹0
  assert.equal(computeRoundUpPaise(5900), 100);  // ₹59 -> +₹1
});

test('computeSplitShares & computeCircleSettlements conserve integer paise exactly', () => {
  const shares = computeSplitShares({
    amountCents: 10000, // ₹100 split by shares 2:1:1
    memberIds: ['m1', 'm2', 'm3'],
    mode: 'shares',
    rawValues: { m1: 2, m2: 1, m3: 1 },
  });
  assert.equal(shares.m1 + shares.m2 + shares.m3, 10000);
  assert.equal(shares.m1, 5000);

  const pctShares = computeSplitShares({
    amountCents: 10001, // ₹100.01 split 33/33/34%
    memberIds: ['m1', 'm2', 'm3'],
    mode: 'percent',
    rawValues: { m1: 33, m2: 33, m3: 34 },
  });
  assert.equal(pctShares.m1 + pctShares.m2 + pctShares.m3, 10001);

  const circle: ExpenseCircle = {
    id: 'c1',
    ownerId: 'u1',
    name: 'Goa Trip Gang',
    themeColor: '#0B3B3A',
    currency: 'INR',
    members: [
      { id: 'm1', name: 'Maya', initials: 'ML', color: '#A9D6B8', isSelf: true },
      { id: 'm2', name: 'Aarav', initials: 'AS', color: '#14504D' },
      { id: 'm3', name: 'Ananya', initials: 'AK', color: '#E8B64C' },
    ],
    expenses: [
      {
        id: 'e1',
        title: 'Train booking',
        amountCents: 10000, // ₹100 split 3 ways -> 3334, 3333, 3333 paise
        currency: 'INR',
        paidByMemberId: 'm1',
        splitBetweenIds: ['m1', 'm2', 'm3'],
        occurredAtUtc: '2026-11-12T10:00:00.000Z',
      },
    ],
  };

  const result = computeCircleSettlements(circle);
  const netSum = Object.values(result.netBalances).reduce((a, b) => a + b, 0);
  assert.equal(netSum, 0);
  assert.equal(result.transfers.length, 2);
  const transferSum = result.transfers.reduce((a, t) => a + t.amountCents, 0);
  assert.equal(transferSum, 6666);
});

import {
  SAMPLE_INDIAN_BANK_SMS,
  SAMPLE_UPI_QR_CODES,
  parseImportTextFallback,
  parseUpiQrUri,
  suggestCategoryForMerchant,
} from './finance';

test('parseUpiQrUri parses standard NPCI upi://pay QR payloads into merchant, VPA, paise, and category', () => {
  const q1 = parseUpiQrUri(SAMPLE_UPI_QR_CODES[0].uri);
  assert.ok(q1);
  assert.equal(q1.vpa, 'sharma.chai@okicici');
  assert.equal(q1.merchant, 'Sharma Chai Tapri');
  assert.equal(q1.amountCents, 4500);
  assert.equal(q1.category, 'dining');

  const q2 = parseUpiQrUri(SAMPLE_UPI_QR_CODES[2].uri);
  assert.ok(q2);
  assert.equal(q2.merchant, 'Local Xerox Shop');
  assert.equal(q2.amountCents, 6000);
  assert.equal(q2.category, 'textbooks');

  const qNoAmt = parseUpiQrUri('upi://pay?pa=metro.dmrc@okaxis&pn=DMRC%20Metro');
  assert.ok(qNoAmt);
  assert.equal(qNoAmt.merchant, 'DMRC Metro');
  assert.equal(qNoAmt.amountCents, null);
  assert.equal(qNoAmt.category, 'transport');

  assert.equal(parseUpiQrUri('https://example.com'), null);
});

test('parseBankSmsFallback & parseImportTextFallback parse all 5 Indian bank SMS samples and CSV lines', () => {
  const nowIso = '2026-11-14T08:30:00.000Z';

  // 1. HDFC Debit to VPA
  const p1 = parseBankSmsFallback(SAMPLE_INDIAN_BANK_SMS[0].sms, nowIso);
  assert.ok(p1);
  assert.equal(p1.amountCents, 25000);
  assert.equal(p1.type, 'expense');
  assert.equal(p1.category, 'dining');
  assert.equal(p1.upiRef, '431910284712');
  assert.equal(p1.paidToUpiId, 'swiggy@icici');

  // 2. SBI Debit via trf to merchant
  const p2 = parseBankSmsFallback(SAMPLE_INDIAN_BANK_SMS[1].sms, nowIso);
  assert.ok(p2);
  assert.equal(p2.amountCents, 4500);
  assert.equal(p2.category, 'dining');
  assert.equal(p2.upiRef, '431922410985');
  assert.ok(p2.merchant.toLowerCase().includes('chai'));

  // 3. ICICI Credit from VPA
  const p3 = parseBankSmsFallback(SAMPLE_INDIAN_BANK_SMS[2].sms, nowIso);
  assert.ok(p3);
  assert.equal(p3.amountCents, 150000);
  assert.equal(p3.type, 'income');
  assert.equal(p3.category, 'income');
  assert.equal(p3.upiRef, '431933812044');
  assert.equal(p3.paidToUpiId, 'rohan.verma@okaxis');

  // 4. Axis Debit with UPI/ slash format
  const p4 = parseBankSmsFallback(SAMPLE_INDIAN_BANK_SMS[3].sms, nowIso);
  assert.ok(p4);
  assert.equal(p4.amountCents, 31850);
  assert.equal(p4.category, 'groceries');
  assert.equal(p4.upiRef, '431944910231');

  // 5. Kotak Debit to Rapido VPA
  const p5 = parseBankSmsFallback(SAMPLE_INDIAN_BANK_SMS[4].sms, nowIso);
  assert.ok(p5);
  assert.equal(p5.amountCents, 8200);
  assert.equal(p5.category, 'transport');
  assert.equal(p5.upiRef, '431955102984');

  // Multi-line batch with all 5 SMS + CSV line
  const batch = [
    ...SAMPLE_INDIAN_BANK_SMS.map((s) => s.sms),
    'Local Xerox Shop, 48, textbooks',
  ].join('\n');
  const parsedBatch = parseImportTextFallback(batch, nowIso);
  assert.equal(parsedBatch.length, 6);
  assert.equal(parsedBatch[5].amountCents, 4800);
  assert.equal(parsedBatch[5].category, 'textbooks');

  // Merchant auto-categorization
  assert.equal(suggestCategoryForMerchant('Chai Tapri'), 'dining');
  assert.equal(suggestCategoryForMerchant('Blinkit'), 'groceries');
  assert.equal(suggestCategoryForMerchant('Rapido Auto'), 'transport');
  assert.equal(suggestCategoryForMerchant('Local Xerox'), 'textbooks');
  assert.equal(suggestCategoryForMerchant('Airtel Prepaid'), 'subscriptions');
});

test('mergeIdempotentTransactions rejects duplicate idempotencyKeys', () => {
  const existing: Transaction[] = [
    {
      id: 'tx-1',
      ownerId: 'u1',
      accountId: 'acc_bank',
      type: 'expense',
      status: 'posted',
      amountCents: 4500,
      currency: 'INR',
      category: 'dining',
      merchant: 'Chai Tapri',
      occurredAtUtc: '2026-11-14T10:00:00.000Z',
      idempotencyKey: 'imp-1',
    },
  ];
  const incoming: Transaction[] = [
    { ...existing[0], id: 'tx-dup' },
    {
      ...existing[0],
      id: 'tx-2',
      merchant: 'Local Xerox',
      idempotencyKey: 'imp-2',
    },
  ];

  const merged = mergeIdempotentTransactions(existing, incoming);
  assert.equal(merged.addedCount, 1);
  assert.equal(merged.duplicateCount, 1);
  assert.equal(merged.merged.length, 2);
});

test('computeBudgetStatuses, computeVaultMetrics & resolveMascotState track thresholds accurately', () => {
  const nowIso = '2026-11-14T08:30:00.000Z';
  const seed = createInitialSeedState(nowIso);
  const statuses = computeBudgetStatuses({
    budgets: seed.budgets,
    transactions: seed.transactions,
  });
  assert.equal(statuses.length, 6);

  const laptopMetrics = computeVaultMetrics(seed.vaults[0], nowIso);
  assert.equal(laptopMetrics.percent, 60);
  assert.ok(laptopMetrics.projectedDateLabel);

  const runway = computeAllowanceRunway({
    profile: seed.profile,
    accounts: seed.accounts,
    transactions: seed.transactions,
    recurring: seed.recurring,
    nowUtcIso: nowIso,
  });

  const mCaution = resolveMascotState({
    runway: { ...runway, pace: 'caution' },
    budgets: statuses,
    vaults: seed.vaults,
  });
  assert.equal(mCaution.mood, 'caution');

  const mOver = resolveMascotState({
    runway: { ...runway, pace: 'over' },
    budgets: statuses,
    vaults: seed.vaults,
  });
  assert.equal(mOver.mood, 'coach');

  const lowVaults = seed.vaults.map((v) => ({ ...v, savedCents: 10000 }));
  const mHappy = resolveMascotState({
    runway: { ...runway, pace: 'on_track' },
    budgets: statuses,
    vaults: lowVaults,
  });
  assert.equal(mHappy.mood, 'happy');
});

import { buildWhatsAppRemindUrl } from './finance';
import { mintlyWorkspaceReducer } from '../lib/store';

test('buildWhatsAppRemindUrl formats wa.me link with ₹ amount and UPI ID', () => {
  const url = buildWhatsAppRemindUrl({
    phone: '919800000002',
    fromName: 'Aarav',
    toName: 'Maya (You)',
    circleName: 'Goa Trip Gang',
    amountCents: 60000,
    toUpiId: 'maya.lin@okbank',
  });
  assert.ok(url.startsWith('https://wa.me/919800000002?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('₹600'));
  assert.ok(decoded.includes('maya.lin@okbank'));
  assert.ok(decoded.includes('Goa Trip Gang'));
});

test('UPI settlement transfer zeroes member debt without inflating pool totalSpendCents', () => {
  const seed = createInitialSeedState('2026-11-14T08:30:00.000Z');
  const goaCircleBefore = seed.circles[0];
  const before = computeCircleSettlements(goaCircleBefore);
  assert.ok(before.transfers.length > 0);
  const firstTransfer = before.transfers[0];

  const afterState = mintlyWorkspaceReducer(seed, {
    type: 'SETTLE_CIRCLE_TRANSFER',
    circleId: goaCircleBefore.id,
    fromMemberId: firstTransfer.fromMemberId,
    toMemberId: firstTransfer.toMemberId,
    amountCents: firstTransfer.amountCents,
    upiRef: '431988112233',
    upiApp: 'GPay',
    accountId: 'acc_bank',
  });

  const goaCircleAfter = afterState.circles[0];
  const after = computeCircleSettlements(goaCircleAfter);
  assert.equal(after.totalSpendCents, before.totalSpendCents);
  assert.equal(after.transfers.length, before.transfers.length - 1);

  const report = validateWorkspaceInvariants(afterState, '2026-11-14T08:30:00.000Z');
  assert.equal(report.ok, true, `Invariants failed after settle: ${report.errors.join('; ')}`);
});

test('Jar ₹10 round-ups route spare paise to target vault and preserve invariants', () => {
  const seed = createInitialSeedState('2026-11-14T08:30:00.000Z');
  const initialGoa = seed.vaults.find((v) => v.id === 'vault_goa')!;
  const initialBank = seed.accounts.find((a) => a.id === 'acc_bank')!;

  const nextState = mintlyWorkspaceReducer(seed, {
    type: 'ADD_TRANSACTION',
    payload: {
      txType: 'expense',
      accountId: 'acc_bank',
      amountCents: 4300, // ₹43 -> +₹7 round-up
      category: 'dining',
      merchant: 'Chai Tapri',
      paymentMode: 'upi',
    },
  });

  const nextGoa = nextState.vaults.find((v) => v.id === 'vault_goa')!;
  const nextBank = nextState.accounts.find((a) => a.id === 'acc_bank')!;
  assert.equal(nextGoa.savedCents, initialGoa.savedCents + 700);
  assert.equal(nextBank.balanceCents, initialBank.balanceCents - 5000);
  assert.equal(nextState.roundUp?.monthlySavedCents, (seed.roundUp?.monthlySavedCents ?? 0) + 700);
  assert.equal(nextState.transactions[0].roundUpPaise, 700);

  const report = validateWorkspaceInvariants(nextState, '2026-11-14T08:30:00.000Z');
  assert.equal(report.ok, true, `Invariants failed after round-up: ${report.errors.join('; ')}`);
});

test('buildCoachFinancialSnapshot grounds Mochi in INR (₹) with zero $ leaks', () => {
  const nowIso = '2026-11-14T08:30:00.000Z';
  const seed = createInitialSeedState(nowIso);
  const snapshot = buildCoachFinancialSnapshot(seed, nowIso);
  const serialized = JSON.stringify(snapshot);

  assert.equal(snapshot.currency, 'INR');
  assert.ok(!serialized.includes('$'), 'Snapshot must never contain USD $ symbols');
  assert.ok(snapshot.totalBalanceFormatted.startsWith('₹'));
  assert.ok(snapshot.dailySafeSpendFormatted.startsWith('₹'));
  assert.ok(snapshot.upcomingBills.length > 0);
  assert.ok(snapshot.circlesPending.length === 3);
  assert.equal(snapshot.rewards.coins, 240);
  assert.ok(snapshot.monthlyReport.totalSpent.startsWith('₹'));
});

test('computeContextualNudges surfaces Indian student calendar & runway nudges', () => {
  const nowIso = '2026-11-14T08:30:00.000Z';
  const seed = createInitialSeedState(nowIso);
  const runway = computeAllowanceRunway({
    profile: seed.profile,
    accounts: seed.accounts,
    transactions: seed.transactions,
    recurring: seed.recurring,
    nowUtcIso: nowIso,
  });

  const cautionNudges = computeContextualNudges(
    seed,
    { ...runway, pace: 'caution' },
    nowIso
  );
  assert.ok(cautionNudges.some((n) => n.kind === 'month_end'));
  assert.ok(cautionNudges.some((n) => n.kind === 'fee'));
  assert.ok(cautionNudges.some((n) => n.kind === 'exam'));
});

test('UNLOCK_REWARD deducts Mint Coins, equips cosmetics, and guards insufficient balance', () => {
  const seed = createInitialSeedState('2026-11-14T08:30:00.000Z');
  assert.equal(seed.rewards?.coins, 240);

  // Unlock Lo-Fi Headphones (120 coins)
  const afterUnlock = mintlyWorkspaceReducer(seed, {
    type: 'UNLOCK_REWARD',
    itemId: 'mochi_headphones',
    costCoins: 120,
    equip: true,
  });
  assert.equal(afterUnlock.rewards?.coins, 120);
  assert.ok(afterUnlock.rewards?.unlockedItemIds.includes('mochi_headphones'));
  assert.equal(afterUnlock.rewards?.equippedAccessoryId, 'mochi_headphones');

  // Re-equipping an already unlocked item costs 0 coins
  const afterReEquip = mintlyWorkspaceReducer(afterUnlock, {
    type: 'UNLOCK_REWARD',
    itemId: 'mochi_headphones',
    costCoins: 120,
    equip: true,
  });
  assert.equal(afterReEquip.rewards?.coins, 120);

  // Trying to unlock 200-coin item with 120 coins is a safe no-op
  const afterGuard = mintlyWorkspaceReducer(afterUnlock, {
    type: 'UNLOCK_REWARD',
    itemId: 'mochi_diwali_crown',
    costCoins: 200,
    equip: true,
  });
  assert.equal(afterGuard.rewards?.coins, 120);
  assert.equal(afterGuard.rewards?.equippedAccessoryId, 'mochi_headphones');
});

test('APPLY_ONBOARDING updates allowance, stay type PG rent rule, and vault selection', () => {
  const seed = createInitialSeedState('2026-11-14T08:30:00.000Z');
  const next = mintlyWorkspaceReducer(seed, {
    type: 'APPLY_ONBOARDING',
    payload: {
      allowanceAmountCents: 1500000,
      allowanceDayOfMonth: 5,
      allowanceSource: 'stipend',
      stayType: 'pg',
      selectedVaultKeys: ['laptop', 'placement'],
    },
  });

  assert.equal(next.profile.allowanceAmountCents, 1500000);
  assert.equal(next.profile.stayType, 'pg');
  assert.equal(next.profile.onboardingCompleted, true);
  assert.ok(next.recurring.some((r) => /PG Rent/i.test(r.title)));
  assert.equal(next.vaults.length, 2);
  assert.ok(next.vaults.some((v) => v.goalTheme === 'placement'));

  const report = validateWorkspaceInvariants(next, '2026-11-14T08:30:00.000Z');
  assert.equal(report.ok, true, `Invariants failed after onboarding: ${report.errors.join('; ')}`);
});


