export type CurrencyCode = 'INR';

export type LanguageCode = 'en' | 'hinglish';
export type MascotMood = 'happy' | 'celebrate' | 'caution' | 'coach';

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionStatus = 'pending' | 'posted' | 'reversed' | 'failed';
export type PaymentMode = 'upi' | 'upi_lite' | 'cash' | 'card' | 'bank';

export type IncomeSource =
  | 'pocket_money'
  | 'scholarship'
  | 'stipend'
  | 'tutoring'
  | 'gift'
  | 'refund'
  | 'other';

export type AccountKind = 'bank' | 'upi_lite' | 'cash' | 'mess_card';
export type StayType = 'hostel' | 'pg' | 'home';
export type SplitMode = 'equal' | 'exact' | 'percent' | 'shares';

export type SpendingCategory =
  | 'dining'
  | 'groceries'
  | 'transport'
  | 'textbooks'
  | 'subscriptions'
  | 'fun'
  | 'rent'
  | 'health'
  | 'laundry'
  | 'festivals'
  | 'trips'
  | 'income'
  | 'savings';

export type BudgetCategory = Exclude<SpendingCategory, 'income' | 'savings'>;

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  university?: string;
  stayType?: StayType;
  currency: CurrencyCode;
  language: LanguageCode;
  allowanceAmountCents: number; // Integer paise
  allowanceSource?: IncomeSource;
  allowanceDayOfMonth?: number; // e.g., 1st of month
  lastAllowanceIso?: string; // YYYY-MM-DD
  nextAllowanceIso: string; // YYYY-MM-DD
  cycleDays: number;
  onboardingCompleted?: boolean;
}

export interface FinancialAccount {
  id: string;
  ownerId: string;
  name: string;
  type: AccountKind | 'checking' | 'savings' | 'campus_card';
  currency: CurrencyCode;
  balanceCents: number; // Integer paise
  institution?: string;
  lastFour?: string;
  upiId?: string;
  lastSyncedIso?: string;
  frozen?: boolean;
  dailyLimitCents?: number; // Integer paise
}

export interface Transaction {
  id: string;
  ownerId: string;
  accountId: string;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number; // Always positive integer paise
  currency: CurrencyCode;
  category: SpendingCategory;
  merchant: string;
  note?: string;
  paymentMode?: PaymentMode;
  upiRef?: string; // 12-digit UPI reference number
  paidToUpiId?: string;
  incomeSource?: IncomeSource;
  roundUpPaise?: number;
  occurredAtUtc: string; // ISO-8601 UTC timestamp
  idempotencyKey?: string;
}

export interface BudgetPlan {
  id: string;
  ownerId: string;
  category: BudgetCategory;
  limitCents: number; // Integer paise
  currency: CurrencyCode;
  monthKey: string; // YYYY-MM
}

export interface VaultContribution {
  id: string;
  amountCents: number; // Integer paise
  currency: CurrencyCode;
  occurredAtUtc: string;
  note?: string;
}

export type VaultThemeKey = 'laptop' | 'trip' | 'emergency' | 'festivals' | 'placement';

export interface SavingsVault {
  id: string;
  ownerId: string;
  title: string;
  artworkKey: 'laptop' | 'trip' | 'emergency';
  goalTheme?: VaultThemeKey;
  targetCents: number; // Integer paise
  savedCents: number; // Integer paise
  weeklyAutoCents: number; // Integer paise
  currency: CurrencyCode;
  targetDateIso?: string;
  contributions: VaultContribution[];
}

export interface RecurringRule {
  id: string;
  ownerId: string;
  title: string;
  type: 'expense' | 'income';
  category: SpendingCategory;
  amountCents: number; // Integer paise
  currency: CurrencyCode;
  cadence: 'weekly' | 'monthly';
  nextDueIso: string; // YYYY-MM-DD
  active: boolean;
}

export interface CircleMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  upiId?: string;
  phone?: string;
  isSelf?: boolean;
}

export interface CircleExpense {
  id: string;
  title: string;
  amountCents: number; // Integer paise
  currency: CurrencyCode;
  paidByMemberId: string;
  splitBetweenIds: string[];
  splitMode?: SplitMode;
  customSplits?: Record<string, number>; // Integer paise per memberId
  occurredAtUtc: string;
  settled?: boolean;
  settledRef?: string;
}

export interface ExpenseCircle {
  id: string;
  ownerId: string;
  name: string;
  themeColor: string;
  currency: CurrencyCode;
  members: CircleMember[];
  expenses: CircleExpense[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  detail: string;
  occurredAtUtc: string;
}

export interface RoundUpConfig {
  enabled: boolean;
  targetVaultId: string;
  monthlySavedCents: number; // Integer paise
}

export interface RewardsState {
  coins: number;
  streakDays: number;
  unlockedItemIds: string[];
  equippedAccessoryId: string | null;
}

export type RunwayPace = 'ahead' | 'on_track' | 'caution' | 'over';

export interface AllowanceRunwaySummary {
  daysRemaining: number;
  cycleDays: number;
  cycleProgressRatio: number; // 0 to 1 elapsed
  liquidBalanceCents: number;
  upcomingBillsCents: number;
  spendableAfterBillsCents: number;
  dailySafeSpendCents: number;
  expectedDailyBudgetCents: number;
  pace: RunwayPace;
  spentThisCycleCents: number;
  incomeThisCycleCents: number;
  nextAllowanceLabel: string; // e.g. "1 Dec"
}

export interface BudgetStatus {
  budget: BudgetPlan;
  spentCents: number;
  remainingCents: number;
  utilizationRatio: number;
  status: 'healthy' | 'warning' | 'exceeded';
}

export interface CircleDebtTransfer {
  fromMemberId: string;
  fromName: string;
  fromUpiId?: string;
  fromPhone?: string;
  toMemberId: string;
  toName: string;
  toUpiId?: string;
  toPhone?: string;
  amountCents: number;
}

export interface MonthlyMoneyReport {
  monthKey: string;
  previousMonthKey: string;
  totalSpentCents: number;
  previousMonthSpentCents: number;
  deltaPercent: number;
  totalIncomeCents: number;
  savedCents: number;
  topCategory: BudgetCategory | null;
  topCategorySpentCents: number;
  bestDayLabel: string | null;
  bestDaySpentCents: number;
}

export interface ContextualNudge {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  kind: 'exam' | 'fest' | 'diwali' | 'fee' | 'month_end';
}

export interface MintlyWorkspaceState {
  profile: UserProfile;
  accounts: FinancialAccount[];
  transactions: Transaction[];
  budgets: BudgetPlan[];
  vaults: SavingsVault[];
  recurring: RecurringRule[];
  circles: ExpenseCircle[];
  auditLogs: AuditLogEntry[];
  roundUp?: RoundUpConfig;
  rewards?: RewardsState;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confirmedFacts?: string[];
  forecastNote?: string;
  suggestedAction?: {
    label: string;
    vaultId?: string;
    amountCents?: number;
  };
  createdAtUtc: string;
}
