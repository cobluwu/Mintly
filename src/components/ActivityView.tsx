import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  ChevronDown,
  MessageSquarePlus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Upload,
  Users,
  X,
} from 'lucide-react';
import type {
  AllowanceRunwaySummary,
  BudgetStatus,
  MintlyWorkspaceState,
  MonthlyMoneyReport,
  SpendingCategory,
  Transaction,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  convertMinorUnits,
  fmtINR,
  formatActivityDayHeader,
  formatTimeIST12h,
  resolveMascotState,
  toIstDateKey,
} from '../shared/finance';
import {
  SPRING_BOUNCY,
  SPRING_GENTLE,
  STAGGER_CONTAINER,
  STAGGER_ITEM,
  triggerHaptic,
} from '../shared/motion';
import { CategoryGlyph } from './CategoryArt';
import type { MochiPoseMood } from './brand/MochiMascot';
import {
  Chip,
  EmptyState,
  GlassCard,
  PageHeader,
  Pill,
  Skeleton,
  StatBlock,
  TealFeatureCard,
  WhiteCard,
} from './ui';
import {
  ActivityFilterSheet,
  DEFAULT_ACTIVITY_FILTERS,
  countActiveActivityFilters,
  resolveTransactionTrustStatus,
  type ActivityFilters,
} from './ActivityFilterSheet';

interface ActivityViewProps {
  workspace: MintlyWorkspaceState;
  runway: AllowanceRunwaySummary;
  budgets: BudgetStatus[];
  monthlyReport: MonthlyMoneyReport;
  isImporting?: boolean;
  t: TranslationBundle;
  onOpenImport: () => void;
  onOpenReport: () => void;
  onOpenSettings: () => void;
  onReverseTransaction: (txId: string) => void;
  onChangeCategory: (txId: string, category: SpendingCategory) => void;
  onUpdateNote: (txId: string, note: string) => void;
  onSplitTransaction: (tx: Transaction) => void;
}

const EXPENSE_CATEGORY_OPTIONS: SpendingCategory[] = [
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
];

const MODE_LABEL: Record<string, string> = {
  upi: 'UPI',
  upi_lite: 'UPI Lite',
  cash: 'Cash',
  card: 'Mess Card',
  bank: 'Bank Transfer',
};

const SEGMENT_PALETTE = [
  '#A9D6B8',
  '#6DC397',
  '#F3EFDC',
  '#E8B64C',
  'rgba(255, 255, 255, 0.45)',
];

const TRUST_LABEL = {
  verified: 'Verified',
  self_reported: 'Self-reported',
  pending: 'Pending',
} as const;

interface ActivityRowProps {
  tx: Transaction;
  categoryLabel: string;
  accountName: string;
  isOpen: boolean;
  onToggleExpand: () => void;
  onReverse: (txId: string) => void;
  onChangeCategory: (txId: string, category: SpendingCategory) => void;
  onUpdateNote: (txId: string, note: string) => void;
  onSplit: (tx: Transaction) => void;
  t: TranslationBundle;
}

const SwipeableActivityRow: React.FC<ActivityRowProps> = ({
  tx,
  categoryLabel,
  accountName,
  isOpen,
  onToggleExpand,
  onReverse,
  onChangeCategory,
  onUpdateNote,
  onSplit,
  t,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(tx.note || '');

  const modeStr = tx.paymentMode ? MODE_LABEL[tx.paymentMode] || tx.paymentMode : 'UPI';
  const trustStatus = resolveTransactionTrustStatus(tx);
  const canReverse = tx.status === 'posted';
  const canSplit = tx.type === 'expense' && tx.status === 'posted';
  const trayWidth = canReverse && canSplit ? 128 : canReverse || canSplit ? 70 : 0;
  const timeStr = formatTimeIST12h(tx.occurredAtUtc);
  const captionText = `${categoryLabel} · ${modeStr} · ${accountName} · ${timeStr}`;

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNote(tx.id, noteDraft);
    setEditingNote(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={SPRING_BOUNCY}
      className="relative overflow-hidden bg-white"
    >
      {/* Swipe Left Quick Action Tray */}
      {trayWidth > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3 bg-[var(--surface-tint)]">
          {canSplit && (
            <Pill
              variant="sage-soft"
              size="sm"
              onClick={() => {
                setRevealed(false);
                onSplit(tx);
              }}
            >
              Split
            </Pill>
          )}
          {canReverse && (
            <Pill
              variant="danger"
              size="sm"
              ariaLabel={`Reverse ${tx.merchant}`}
              icon={<RotateCcw className="w-3 h-3" />}
              onClick={() => {
                triggerHaptic(14);
                setRevealed(false);
                onReverse(tx.id);
              }}
            >
              Undo
            </Pill>
          )}
        </div>
      )}

      {/* Draggable Foreground Row */}
      <motion.div
        drag={trayWidth > 0 ? 'x' : false}
        dragConstraints={{ left: -trayWidth, right: 0 }}
        dragElastic={0.12}
        animate={{ x: revealed ? -trayWidth : 0 }}
        transition={SPRING_BOUNCY}
        onDragEnd={(_, info) => {
          if (trayWidth === 0) return;
          if (info.offset.x < -42) {
            triggerHaptic(8);
            setRevealed(true);
          } else {
            setRevealed(false);
          }
        }}
        className="relative z-10 bg-white"
      >
        <button
          type="button"
          onClick={() => {
            if (revealed) {
              setRevealed(false);
              return;
            }
            triggerHaptic(6);
            onToggleExpand();
          }}
          aria-expanded={isOpen}
          className="w-full min-h-[64px] py-3.5 px-4 flex items-start justify-between gap-3 text-left cursor-pointer hover:bg-[var(--surface-subtle)]/60 transition-colors"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="pt-0.5 shrink-0">
              <CategoryGlyph category={tx.category} size={40} />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <p
                title={tx.merchant}
                className={`text-sm font-medium leading-snug line-clamp-2 ${
                  tx.status === 'reversed'
                    ? 'line-through text-[var(--muted)]'
                    : 'text-[var(--ink)]'
                }`}
              >
                {tx.merchant}
              </p>

              <p
                title={captionText}
                className="text-xs text-[var(--muted)] leading-snug line-clamp-2"
              >
                {captionText}
              </p>

              {/* Show Pending and Self-reported inline trust badges cleanly */}
              {(trustStatus === 'pending' || trustStatus === 'self_reported') && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  {trustStatus === 'pending' ? (
                    <Chip variant="amber" className="text-[10px] px-2 py-0.5">
                      Pending
                    </Chip>
                  ) : (
                    <Chip variant="neutral" className="text-[10px] px-2 py-0.5">
                      Self-reported
                    </Chip>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-1.5 shrink-0 pt-0.5">
            <div className="flex flex-col items-end gap-1">
              {tx.type === 'income' && tx.status !== 'reversed' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--sage-100)] text-[var(--teal-900)] font-mono text-[13px] font-semibold tabular-nums">
                  +{fmtINR(tx.amountCents)}
                </span>
              ) : (
                <span
                  className={`font-mono text-sm font-medium tabular-nums ${
                    tx.status === 'reversed'
                      ? 'text-[var(--muted)] line-through'
                      : 'text-[var(--ink)]'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {fmtINR(tx.amountCents)}
                </span>
              )}

              {tx.roundUpPaise ? (
                <Chip variant="sage" className="font-mono text-[10px] tabular-nums px-2 py-0.5">
                  +{fmtINR(tx.roundUpPaise)} saved
                </Chip>
              ) : null}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-[var(--muted)] mt-1 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[var(--teal-900)]' : ''
              }`}
            />
          </div>
        </button>

        {/* Spring Expandable Detail & Actions Drawer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_GENTLE}
              className="overflow-hidden"
            >
              <div className="pb-4 pt-1 pl-[64px] pr-4 space-y-3 text-xs text-[var(--muted)]">
                {/* Note display */}
                {tx.note && !editingNote && (
                  <p className="text-[var(--ink)] bg-[var(--sage-100)]/45 border border-[var(--sage-300)]/35 rounded-[12px] px-3 py-2 leading-relaxed">
                    {tx.note}
                  </p>
                )}

                {/* Transaction Metadata Card */}
                <div className="rounded-[16px] bg-[var(--surface-subtle)] border border-[var(--hairline-soft)] p-3 space-y-1.5 text-[11px] font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 break-words">
                      {tx.type === 'income' ? 'From' : 'Paid to'}:{' '}
                      <span className="text-[var(--ink)] font-medium">
                        {tx.merchant}
                        {tx.paidToUpiId ? ` (${tx.paidToUpiId})` : ''}
                      </span>
                    </span>
                    <span>
                      Mode: <span className="text-[var(--ink)] font-medium">{modeStr}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Account: <span className="text-[var(--ink)] font-medium">{accountName}</span>
                    </span>
                    <span>
                      {formatActivityDayHeader(tx.occurredAtUtc)} · {timeStr} IST
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <span>
                      Trust:{' '}
                      <span className="text-[var(--ink)] font-medium">
                        {tx.status === 'reversed' ? 'Reversed' : TRUST_LABEL[trustStatus]}
                      </span>
                    </span>
                    {tx.upiRef && (
                      <span>
                        UPI Ref: <span className="text-[var(--ink)] font-medium">{tx.upiRef}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Note Editor */}
                {editingNote ? (
                  <form onSubmit={handleSaveNote} className="space-y-2">
                    <label className="block">
                      <span className="sr-only">Transaction note</span>
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a note (e.g., Mess extra thali with Aarav)..."
                        autoFocus
                        maxLength={120}
                        className="w-full min-h-[40px] px-3 rounded-[14px] bg-white border border-[var(--teal-900)]/30 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--teal-900)]"
                      />
                    </label>
                    <div className="flex items-center justify-end gap-2">
                      <Pill
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNoteDraft(tx.note || '');
                          setEditingNote(false);
                        }}
                      >
                        Cancel
                      </Pill>
                      <Pill type="submit" variant="ink" size="sm">
                        Save note
                      </Pill>
                    </div>
                  </form>
                ) : null}

                {/* Row Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {tx.type === 'expense' && (
                      <label className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-[var(--muted)]">Category:</span>
                        <select
                          aria-label={`Change category for ${tx.merchant}`}
                          value={tx.category}
                          onChange={(e) =>
                            onChangeCategory(tx.id, e.target.value as SpendingCategory)
                          }
                          className="min-h-[34px] px-2.5 rounded-full bg-white border border-[var(--ink)]/14 text-[var(--ink)] text-[11px] font-medium focus:outline-none focus:border-[var(--teal-900)] cursor-pointer"
                        >
                          {EXPENSE_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat} value={cat}>
                              {t.categories[cat]}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {!editingNote && (
                      <Pill
                        variant="ghost"
                        size="sm"
                        icon={<MessageSquarePlus className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setNoteDraft(tx.note || '');
                          setEditingNote(true);
                        }}
                      >
                        {tx.note ? 'Edit note' : 'Add note'}
                      </Pill>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {canSplit && (
                      <Pill
                        variant="sage-soft"
                        size="sm"
                        icon={<Users className="w-3.5 h-3.5" />}
                        onClick={() => onSplit(tx)}
                      >
                        Split this
                      </Pill>
                    )}
                    {canReverse && (
                      <Pill
                        variant="danger"
                        size="sm"
                        icon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => onReverse(tx.id)}
                      >
                        Reverse
                      </Pill>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export const ActivityView: React.FC<ActivityViewProps> = ({
  workspace,
  runway,
  budgets,
  monthlyReport,
  isImporting = false,
  t,
  onOpenImport,
  onOpenReport,
  onOpenSettings,
  onReverseTransaction,
  onChangeCategory,
  onUpdateNote,
  onSplitTransaction,
}) => {
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_ACTIVITY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accountMap = useMemo(
    () => new Map(workspace.accounts.map((a) => [a.id, a.name])),
    [workspace.accounts]
  );

  const mascotState = resolveMascotState({
    runway,
    budgets,
    vaults: workspace.vaults,
  });

  const mochiPoseMood: MochiPoseMood =
    mascotState.mood === 'celebrate'
      ? 'celebrating'
      : mascotState.mood === 'caution'
        ? 'worried'
        : mascotState.mood === 'coach'
          ? 'thinking'
          : runway.pace === 'ahead'
            ? 'chill'
            : 'happy';

  // Monthly category shares + Today day-of-month marker for TealFeatureCard Hero
  const heroAnalytics = useMemo(() => {
    const nowIso = new Date().toISOString();
    const todayIst = toIstDateKey(nowIso);
    const currentMonthKey = monthlyReport.monthKey;
    const [yr, mo, dy] = todayIst.split('-').map(Number);
    const daysInMonth = yr && mo ? new Date(Date.UTC(yr, mo, 0)).getUTCDate() : 30;
    const todayPercent = Math.max(8, Math.min(94, Math.round(((dy || 15) / daysInMonth) * 100)));

    const totals = new Map<SpendingCategory, number>();
    for (const tx of workspace.transactions) {
      if (tx.status !== 'posted' || tx.type !== 'expense') continue;
      if (toIstDateKey(tx.occurredAtUtc).slice(0, 7) !== currentMonthKey) continue;
      const amt = convertMinorUnits(tx.amountCents);
      totals.set(tx.category, (totals.get(tx.category) ?? 0) + amt);
    }

    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((acc, [, v]) => acc + v, 0);

    const topFour = sorted.slice(0, 4).map(([cat, amountCents], idx) => ({
      key: cat,
      label: t.categories[cat],
      amountCents,
      percent: total > 0 ? Math.max(4, Math.round((amountCents / total) * 100)) : 25,
      color: SEGMENT_PALETTE[idx],
    }));

    const otherAmount = sorted.slice(4).reduce((acc, [, v]) => acc + v, 0);
    if (otherAmount > 0) {
      topFour.push({
        key: 'savings',
        label: 'Other',
        amountCents: otherAmount,
        percent: total > 0 ? Math.max(4, Math.round((otherAmount / total) * 100)) : 10,
        color: SEGMENT_PALETTE[4],
      });
    }

    const deltaCents =
      monthlyReport.previousMonthSpentCents > 0
        ? monthlyReport.totalSpentCents - monthlyReport.previousMonthSpentCents
        : 0;

    return {
      todayPercent,
      segments: topFour,
      deltaCents,
      hasPrevMonth: monthlyReport.previousMonthSpentCents > 0,
    };
  }, [workspace.transactions, monthlyReport, t.categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const todayKey = toIstDateKey(now.toISOString());
    const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const currentMonthKey = todayKey.slice(0, 7);

    return workspace.transactions.filter((tx) => {
      if (filter !== 'all' && tx.type !== filter) return false;
      if (filters.category !== 'all' && tx.category !== filters.category) return false;
      if (filters.accountId !== 'all' && tx.accountId !== filters.accountId) return false;
      if (filters.paymentMode !== 'all' && (tx.paymentMode || 'upi') !== filters.paymentMode) {
        return false;
      }
      if (filters.trustStatus !== 'all') {
        const trust = resolveTransactionTrustStatus(tx);
        if (trust !== filters.trustStatus) return false;
      }
      if (filters.dateRange === '7d') {
        if (new Date(tx.occurredAtUtc).getTime() < sevenDaysAgoMs) return false;
      } else if (filters.dateRange === 'month') {
        if (toIstDateKey(tx.occurredAtUtc).slice(0, 7) !== currentMonthKey) return false;
      }

      if (!q) return true;
      return (
        tx.merchant.toLowerCase().includes(q) ||
        (tx.note || '').toLowerCase().includes(q) ||
        (tx.upiRef || '').toLowerCase().includes(q) ||
        (tx.paidToUpiId || '').toLowerCase().includes(q) ||
        t.categories[tx.category].toLowerCase().includes(q)
      );
    });
  }, [workspace.transactions, filter, query, filters, t.categories]);

  // Group chronologically by IST calendar date ("Today", "Yesterday", "12 Nov") with day total
  const grouped = useMemo(() => {
    const nowIso = new Date().toISOString();
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime()
    );
    const byDate = new Map<
      string,
      { label: string; items: Transaction[]; netCents: number; spentCents: number }
    >();

    for (const tx of sorted) {
      const dateKey = toIstDateKey(tx.occurredAtUtc);
      const amt = tx.status === 'reversed' ? 0 : convertMinorUnits(tx.amountCents);
      const signed = tx.type === 'income' ? amt : tx.type === 'expense' ? -amt : 0;
      const bucket = byDate.get(dateKey);
      if (bucket) {
        bucket.items.push(tx);
        bucket.netCents += signed;
        if (tx.type === 'expense') bucket.spentCents += amt;
      } else {
        byDate.set(dateKey, {
          label: formatActivityDayHeader(tx.occurredAtUtc, nowIso),
          items: [tx],
          netCents: signed,
          spentCents: tx.type === 'expense' ? amt : 0,
        });
      }
    }

    return Array.from(byDate.entries()).map(([dateKey, group]) => ({
      dateKey,
      ...group,
    }));
  }, [filtered]);

  const activeFilterCount = countActiveActivityFilters(filters);

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Shared PageHeader: Segmented Toggle (All | Expenses | Income), Ghost Import Pill + Mochi Avatar */}
      <PageHeader
        layoutId="activity-mode-toggle"
        title={t.activity.title}
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'} across ${workspace.accounts.length} accounts`}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t.activity.all },
          { value: 'expense', label: t.activity.expenses },
          { value: 'income', label: t.activity.income },
        ]}
        mochiMood={mochiPoseMood}
        mochiAccessory={workspace.rewards?.equippedAccessoryId}
        onAvatarClick={onOpenSettings}
        titleRightAction={
          <Pill
            variant="ghost"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5 text-[var(--teal-900)]" />}
            onClick={onOpenImport}
            className="bg-white/55 hover:bg-white/85 border-[var(--ink)]/12"
          >
            {t.activity.importCsv}
          </Pill>
        }
      />

      {/* HERO (L3): "This month so far" Deep Teal Feature Card */}
      <motion.div variants={STAGGER_ITEM}>
        <TealFeatureCard className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-[13px] font-medium text-white/80">This month so far</p>
              <StatBlock
                label=""
                valueCents={monthlyReport.totalSpentCents}
                tone="dark"
                size="lg"
                className="[&>p:first-child]:hidden"
              />
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={SPRING_BOUNCY}
              onClick={() => {
                triggerHaptic(8);
                onOpenReport();
              }}
              aria-label={t.extras.moneyReport}
              title={t.extras.moneyReport}
              className="w-11 h-11 rounded-full border border-white/18 bg-white/[0.06] hover:bg-white/[0.12] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Delta Chip vs Last Month */}
          <div className="flex flex-wrap items-center gap-2">
            {heroAnalytics.hasPrevMonth ? (
              <span
                className={`rounded-full text-[11px] font-medium px-2.5 py-1 inline-flex items-center gap-1 tabular-nums ${
                  heroAnalytics.deltaCents <= 0
                    ? 'bg-[var(--sage-300)]/20 text-[var(--sage-100)] border border-[var(--sage-300)]/30'
                    : 'bg-[var(--coral)]/22 text-[#FFDAD4] border border-[var(--coral)]/35'
                }`}
              >
                {heroAnalytics.deltaCents <= 0 ? '↓' : '↑'}{' '}
                {fmtINR(Math.abs(heroAnalytics.deltaCents))} vs last month
              </span>
            ) : (
              <span className="rounded-full text-[11px] font-medium px-2.5 py-1 bg-[var(--sage-300)]/20 text-[var(--sage-100)] border border-[var(--sage-300)]/30">
                Active monthly cycle
              </span>
            )}
            {monthlyReport.topCategory && (
              <span className="text-[11px] text-white/70">
                Top: {t.categories[monthlyReport.topCategory]}
              </span>
            )}
          </div>

          {/* Segmented Category Share Bar + Today Pin Marker */}
          <div className="pt-3 pb-1 space-y-2.5">
            <div className="relative">
              {/* Today pin marker */}
              <div
                aria-hidden="true"
                style={{ left: `${heroAnalytics.todayPercent}%` }}
                className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
              >
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                <span className="w-[2px] h-11 bg-white rounded-full" />
              </div>

              <div
                aria-label="Category spending breakdown"
                className="relative h-8 rounded-lg overflow-hidden bg-white/[0.08] flex gap-[3px] p-[2px]"
              >
                {heroAnalytics.segments.length > 0 ? (
                  heroAnalytics.segments.map((seg) => (
                    <div
                      key={seg.key}
                      title={`${seg.label}: ${fmtINR(seg.amountCents)}`}
                      style={{
                        width: `${seg.percent}%`,
                        backgroundColor: seg.color,
                      }}
                      className="h-full rounded-[5px] transition-all"
                    />
                  ))
                ) : (
                  <div className="h-full w-full rounded-[5px] bg-white/10" />
                )}
              </div>
            </div>

            {heroAnalytics.segments.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-white/80">
                {heroAnalytics.segments.map((seg) => (
                  <span key={seg.key} className="inline-flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: seg.color }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span>{seg.label}</span>
                    <span className="font-mono text-white/65 tabular-nums">
                      {fmtINR(seg.amountCents)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </TealFeatureCard>
      </motion.div>

      {/* Separate L2 WhiteCard 3-Stat Summary Strip directly beneath Hero */}
      <motion.div variants={STAGGER_ITEM}>
        <WhiteCard className="grid grid-cols-3 gap-2 py-4 px-4 divide-x divide-[var(--hairline-soft)]">
          <div className="min-w-0 pr-1">
            <p className="text-[11px] text-[var(--muted)]">Money in</p>
            <p className="font-mono text-sm font-semibold text-[var(--teal-900)] tabular-nums mt-0.5">
              +{fmtINR(monthlyReport.totalIncomeCents)}
            </p>
          </div>
          <div className="min-w-0 px-2.5">
            <p className="text-[11px] text-[var(--muted)]">Money out</p>
            <p className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums mt-0.5">
              -{fmtINR(monthlyReport.totalSpentCents)}
            </p>
          </div>
          <div className="min-w-0 pl-2.5">
            <p className="text-[11px] text-[var(--muted)]">Saved</p>
            <p className="font-mono text-sm font-semibold text-[var(--teal-800)] tabular-nums mt-0.5">
              {fmtINR(monthlyReport.savedCents)}
            </p>
          </div>
        </WhiteCard>
      </motion.div>

      {/* Sticky Glass Search Field + Filter Bottom Sheet Trigger */}
      <motion.div variants={STAGGER_ITEM} className="sticky top-[68px] z-20 space-y-2">
        <GlassCard variant="shell" padded={false} className="p-1.5 flex items-center gap-2">
          <label className="relative flex-1 min-w-0 flex items-center">
            <span className="sr-only">{t.activity.searchPlaceholder}</span>
            <Search className="w-4 h-4 text-[var(--muted)] ml-3 shrink-0 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.activity.searchPlaceholder}
              className="w-full min-w-0 min-h-[42px] pl-2.5 pr-2 bg-transparent text-[13px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="w-8 h-8 rounded-full hover:bg-[var(--ink)]/10 text-[var(--muted)] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </label>

          <Pill
            variant={activeFilterCount > 0 ? 'ink' : 'white'}
            size="sm"
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            onClick={() => setFilterSheetOpen(true)}
            className="min-h-[40px] px-3.5"
          >
            {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
          </Pill>
        </GlassCard>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            {filters.category !== 'all' && (
              <Chip
                variant="teal"
                label={`${t.categories[filters.category]} ×`}
                onClick={() => setFilters({ ...filters, category: 'all' })}
              />
            )}
            {filters.accountId !== 'all' && (
              <Chip
                variant="teal"
                label={`${accountMap.get(filters.accountId) || 'Account'} ×`}
                onClick={() => setFilters({ ...filters, accountId: 'all' })}
              />
            )}
            {filters.paymentMode !== 'all' && (
              <Chip
                variant="teal"
                label={`${MODE_LABEL[filters.paymentMode] || filters.paymentMode} ×`}
                onClick={() => setFilters({ ...filters, paymentMode: 'all' })}
              />
            )}
            {filters.dateRange !== 'all' && (
              <Chip
                variant="teal"
                label={`${filters.dateRange === '7d' ? 'Last 7 days' : 'This month'} ×`}
                onClick={() => setFilters({ ...filters, dateRange: 'all' })}
              />
            )}
            {filters.trustStatus !== 'all' && (
              <Chip
                variant="teal"
                label={`${TRUST_LABEL[filters.trustStatus]} ×`}
                onClick={() => setFilters({ ...filters, trustStatus: 'all' })}
              />
            )}
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_ACTIVITY_FILTERS)}
              className="text-[11px] font-medium text-[var(--teal-900)] underline underline-offset-2 px-1.5 py-1 cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </motion.div>

      {/* Importing Skeleton Shimmer */}
      {isImporting && (
        <div className="space-y-3" aria-label="Importing transactions">
          <WhiteCard noPadding divideY>
            <Skeleton variant="row" />
            <Skeleton variant="row" />
            <Skeleton variant="row" />
          </WhiteCard>
        </div>
      )}

      {/* Day-Grouped Activity Stream */}
      {grouped.length === 0 ? (
        <motion.div variants={STAGGER_ITEM}>
          <EmptyState
            mood="thinking"
            accessory={workspace.rewards?.equippedAccessoryId}
            title={t.activity.empty}
            description="Try clearing your search or adjusting filters to see your full UPI & campus cashflow."
            actionLabel={query || activeFilterCount > 0 || filter !== 'all' ? 'Reset Filters' : undefined}
            onAction={
              query || activeFilterCount > 0 || filter !== 'all'
                ? () => {
                    setFilter('all');
                    setQuery('');
                    setFilters(DEFAULT_ACTIVITY_FILTERS);
                  }
                : undefined
            }
          />
        </motion.div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => {
            const totalText =
              group.netCents > 0
                ? `+${fmtINR(group.netCents)}`
                : group.spentCents > 0
                  ? `-${fmtINR(group.spentCents)}`
                  : fmtINR(0);

            return (
              <motion.section
                key={group.dateKey}
                variants={STAGGER_ITEM}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-2 px-1">
                  <h2 className="text-xs font-medium text-[var(--muted)]">{group.label}</h2>
                  <span
                    className={`font-mono text-xs font-medium tabular-nums ${
                      group.netCents > 0 ? 'text-[var(--teal-900)]' : 'text-[var(--ink)]'
                    }`}
                  >
                    {totalText}
                  </span>
                </div>

                <WhiteCard noPadding divideY>
                  <AnimatePresence initial={false}>
                    {group.items.map((tx) => (
                      <SwipeableActivityRow
                        key={tx.id}
                        tx={tx}
                        categoryLabel={t.categories[tx.category]}
                        accountName={accountMap.get(tx.accountId) || 'Student Savings'}
                        isOpen={expandedId === tx.id}
                        onToggleExpand={() =>
                          setExpandedId((curr) => (curr === tx.id ? null : tx.id))
                        }
                        onReverse={onReverseTransaction}
                        onChangeCategory={onChangeCategory}
                        onUpdateNote={onUpdateNote}
                        onSplit={onSplitTransaction}
                        t={t}
                      />
                    ))}
                  </AnimatePresence>
                </WhiteCard>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* Multi-Facet Filter Bottom Sheet */}
      <ActivityFilterSheet
        open={filterSheetOpen}
        filters={filters}
        accounts={workspace.accounts}
        t={t}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_ACTIVITY_FILTERS)}
        onClose={() => setFilterSheetOpen(false)}
      />
    </motion.div>
  );
};
