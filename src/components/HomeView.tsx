import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowDownLeft,
  BarChart3,
  CalendarClock,
  ChevronRight,
  Coins,
  Laptop,
  PiggyBank,
  RotateCcw,
  Users,
} from 'lucide-react';
import type {
  AllowanceRunwaySummary,
  BudgetStatus,
  ContextualNudge,
  MintlyWorkspaceState,
  MonthlyMoneyReport,
  Transaction,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  computeTotalBalanceCents,
  computeVaultMetrics,
  computeWeeklySpendingSeries,
  fmtINR,
  formatActivityDayHeader,
  formatTimeIST12h,
  resolveMascotState,
} from '../shared/finance';
import {
  SPRING_BOUNCY,
  STAGGER_CONTAINER,
  STAGGER_ITEM,
  triggerHaptic,
} from '../shared/motion';
import {
  Chip,
  IconBadge,
  PageHeader,
  Pill,
  SectionHeader,
  WhiteCard,
} from './ui';
import { CardCarousel, type CardControlState } from './CardCarousel';
import { PromoProgressCard } from './ui/PromoProgressCard';
import { TealChallengeCard } from './ui/TealChallengeCard';
import { AllowanceRunway } from './AllowanceRunway';
import { SpendingPulseChart } from './SpendingPulseChart';
import { CategoryGlyph } from './CategoryArt';
import type { MochiPoseMood } from './brand/MochiMascot';

interface HomeViewProps {
  workspace: MintlyWorkspaceState;
  runway: AllowanceRunwaySummary;
  budgets: BudgetStatus[];
  monthlyReport: MonthlyMoneyReport;
  nudges: ContextualNudge[];
  cardControls: Record<string, CardControlState>;
  recentMilestoneTitle?: string | null;
  t: TranslationBundle;
  onQuickAction: (action: 'expense' | 'income' | 'split' | 'vault') => void;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onOpenRewards: () => void;
  onHandleNudge: (nudge: ContextualNudge) => void;
  onNavigateTab: (tab: 'activity' | 'plans' | 'circles' | 'coach') => void;
  onToggleCardFreeze: (accountId: string) => void;
  onChangeCardLimit: (accountId: string, nextLimitCents: number) => void;
  onReverseTransaction: (txId: string) => void;
}

const SwipeableActivityRow: React.FC<{
  tx: Transaction;
  categoryLabel: string;
  onReverse: (id: string) => void;
  onSplit: () => void;
}> = ({ tx, categoryLabel, onReverse, onSplit }) => {
  const [revealed, setRevealed] = useState(false);
  const canReverse = tx.status === 'posted';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={SPRING_BOUNCY}
      className="relative overflow-hidden"
    >
      {/* Revealed Swipe Action Tray */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3 bg-[var(--surface-tint)]">
        <Pill
          variant="sage-soft"
          size="sm"
          onClick={() => {
            setRevealed(false);
            onSplit();
          }}
        >
          Split
        </Pill>
        {canReverse && (
          <Pill
            variant="danger"
            size="sm"
            aria-label={`Reverse ${tx.merchant}`}
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

      {/* Foreground Draggable Row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: canReverse ? -128 : -68, right: 0 }}
        dragElastic={0.12}
        animate={{ x: revealed ? (canReverse ? -124 : -64) : 0 }}
        transition={SPRING_BOUNCY}
        onDragEnd={(_, info) => {
          if (info.offset.x < -44) {
            triggerHaptic(8);
            setRevealed(true);
          } else {
            setRevealed(false);
          }
        }}
        onClick={() => {
          if (revealed) setRevealed(false);
        }}
        className="relative z-10 flex items-center justify-between gap-3 py-3.5 px-4 bg-[var(--surface-l2)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <CategoryGlyph category={tx.category} size={40} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink)] truncate">{tx.merchant}</p>
            <p className="text-xs text-[var(--muted)] truncate">
              {categoryLabel}
              <span aria-hidden="true"> · </span>
              <span>{formatActivityDayHeader(tx.occurredAtUtc)}</span>
              <span aria-hidden="true"> · </span>
              <span>{formatTimeIST12h(tx.occurredAtUtc)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span
            className={`text-sm font-medium tabular-nums ${
              tx.status === 'reversed'
                ? 'text-[var(--muted)] line-through'
                : tx.type === 'income'
                  ? 'text-[var(--teal-900)]'
                  : 'text-[var(--ink)]'
            }`}
          >
            {tx.type === 'income' ? '+' : '-'}
            {fmtINR(tx.amountCents)}
          </span>
          {tx.roundUpPaise ? (
            <Chip variant="sage" className="font-mono text-[10px] tabular-nums px-2 py-0.5">
              +{fmtINR(tx.roundUpPaise)} saved
            </Chip>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
};

export const HomeView: React.FC<HomeViewProps> = ({
  workspace,
  runway,
  budgets,
  monthlyReport,
  nudges,
  cardControls,
  recentMilestoneTitle,
  t,
  onQuickAction,
  onOpenSettings,
  onOpenReport,
  onOpenRewards,
  onHandleNudge,
  onNavigateTab,
  onToggleCardFreeze,
  onChangeCardLimit,
  onReverseTransaction,
}) => {
  const [homeMode, setHomeMode] = useState<'overview' | 'budget'>('overview');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const mascotState = resolveMascotState({
    runway,
    budgets,
    vaults: workspace.vaults,
    recentMilestoneTitle,
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

  const nowIso = new Date().toISOString();
  const weeklySeries = computeWeeklySpendingSeries({
    transactions: workspace.transactions,
    nowUtcIso: nowIso,
  });

  const totalBalancePaise = computeTotalBalanceCents(workspace.accounts);
  const firstName = workspace.profile.displayName.split(' ')[0];
  const primaryVault = workspace.vaults[0];
  const primaryVaultMetrics = primaryVault ? computeVaultMetrics(primaryVault, nowIso) : null;
  const featuredBudget = budgets[0];
  const recentTx = workspace.transactions.slice(0, 4);

  const headerSubtitle =
    homeMode === 'overview'
      ? workspace.profile.language === 'hinglish'
        ? t.greeting.subtitleOnTrack
        : "Here's your account overview"
      : `${t.home.paceLabels[runway.pace]} · ${runway.daysRemaining} ${t.home.daysLeft} (${runway.nextAllowanceLabel})`;

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Top Bar + Editorial Hero Greeting via shared PageHeader primitive */}
      <PageHeader
        layoutId="home-mode-pill"
        title={`Welcome back, ${firstName}`}
        subtitle={headerSubtitle}
        value={homeMode}
        onChange={setHomeMode}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'budget', label: 'Budget' },
        ]}
        mochiMood={mochiPoseMood}
        mochiAccessory={workspace.rewards?.equippedAccessoryId}
        onAvatarClick={onOpenSettings}
      />

      <AnimatePresence mode="wait">
        {homeMode === 'overview' ? (
          <motion.div
            key="home-overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Signature Glass Account Shell Carousel */}
            <CardCarousel
              accounts={workspace.accounts}
              cardControls={cardControls}
              holderName={workspace.profile.displayName}
              totalBalancePaise={totalBalancePaise}
              totalLabel={t.home.totalBalance}
              primaryActionLabel={
                workspace.profile.language === 'en' ? 'Add Expense' : t.home.addExpense
              }
              onPrimaryAction={() => onQuickAction('expense')}
              onToggleFreeze={onToggleCardFreeze}
              onChangeDailyLimit={onChangeCardLimit}
            />

            {/* Calm Secondary Action Triggers (Income, Split, Save) */}
            <div
              aria-label={t.home.quickActions}
              className="grid grid-cols-3 gap-2.5"
            >
              {(
                [
                  {
                    key: 'income',
                    label: t.home.addIncome,
                    icon: <ArrowDownLeft className="w-4 h-4 text-[var(--teal-900)]" />,
                  },
                  {
                    key: 'split',
                    label: t.home.splitBill,
                    icon: <Users className="w-4 h-4 text-[var(--teal-900)]" />,
                  },
                  {
                    key: 'vault',
                    label: t.home.addVault,
                    icon: <PiggyBank className="w-4 h-4 text-[var(--teal-900)]" />,
                  },
                ] as const
              ).map((action) => (
                <Pill
                  key={action.key}
                  variant="ghost"
                  size="md"
                  icon={action.icon}
                  onClick={() => onQuickAction(action.key)}
                  className="bg-white/65 hover:bg-white/90 border-white/75 text-xs px-3 shadow-[0_8px_20px_-10px_rgba(14,43,43,0.14)]"
                >
                  {action.label}
                </Pill>
              ))}
            </div>

            {/* White Promo/Progress Card: Primary Goal Vault (Laptop Fund) */}
            {primaryVault && primaryVaultMetrics && (
              <PromoProgressCard
                icon={<Laptop className="w-4 h-4" />}
                title={primaryVault.title}
                description="Tuck away spare chai & tutoring cash to hit your B.Tech laptop goal."
                progressLeft={`${fmtINR(primaryVault.savedCents)} / ${fmtINR(primaryVault.targetCents)}`}
                progressRight={`${primaryVaultMetrics.percent}% · ${primaryVaultMetrics.projectedDateLabel || `${runway.daysRemaining}d left`}`}
                ratio={primaryVaultMetrics.percent / 100}
                actionLabel={`Boost ${primaryVault.title}`}
                onAction={() => onQuickAction('vault')}
              />
            )}

            {/* Allowance Runway White Card */}
            <AllowanceRunway
              runway={runway}
              currency="INR"
              recurring={workspace.recurring}
              t={t}
              onEditCycle={onOpenSettings}
            />

            {/* 7-Day Spending Pulse White Card */}
            <WhiteCard className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-[var(--ink)]">
                  {t.home.weeklyPulse}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    onNavigateTab('plans');
                  }}
                  className="text-xs font-medium text-[var(--ink)] underline underline-offset-4 hover:text-[var(--teal-900)] cursor-pointer min-h-[36px] px-1"
                >
                  {t.nav.plans}
                </button>
              </div>

              <SpendingPulseChart
                data={weeklySeries}
                currency="INR"
                dailyBudgetCents={runway.expectedDailyBudgetCents}
                selectedDayKey={selectedDayKey}
                onSelectDay={setSelectedDayKey}
              />

              <div className="pt-3 border-t border-[var(--hairline-soft)] space-y-2">
                {budgets.slice(0, 2).map((b) => {
                  const pct = Math.min(100, Math.round(b.utilizationRatio * 100));
                  return (
                    <div
                      key={b.budget.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-[var(--ink)] font-medium truncate">
                        {t.categories[b.budget.category]}
                      </span>
                      <span className="text-[var(--muted)] tabular-nums shrink-0">
                        {fmtINR(b.spentCents)} / {fmtINR(b.budget.limitCents)} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </WhiteCard>

            {/* Recent Activity Stream with Hairline Dividers & View All */}
            <section className="space-y-3">
              <SectionHeader
                title={t.nav.activity}
                actionLabel="View All"
                onAction={() => onNavigateTab('activity')}
              />

              <WhiteCard noPadding divideY>
                <AnimatePresence initial={false}>
                  {recentTx.map((tx) => (
                    <SwipeableActivityRow
                      key={tx.id}
                      tx={tx}
                      categoryLabel={t.categories[tx.category]}
                      onReverse={onReverseTransaction}
                      onSplit={() => onQuickAction('split')}
                    />
                  ))}
                </AnimatePresence>
              </WhiteCard>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="home-budget"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="space-y-5"
          >
            {featuredBudget && (
              <TealChallengeCard
                title={`${t.categories[featuredBudget.budget.category]} Challenge`}
                spentCents={featuredBudget.spentCents}
                limitCents={featuredBudget.budget.limitCents}
                currency="INR"
                streakTitle="Day 5 of 7"
                ctaLabel="View Plan Details"
                onCtaClick={() => onNavigateTab('plans')}
              />
            )}

            {/* Quick Budget Tools: Monthly Report + Mint Coins */}
            <div className="grid grid-cols-2 gap-2.5">
              <WhiteCard
                onClick={onOpenReport}
                className="p-3.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[var(--muted)] truncate">
                    {t.extras.moneyReport}
                  </p>
                  <p className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums mt-0.5">
                    {monthlyReport.deltaPercent > 0 ? '+' : ''}
                    {monthlyReport.deltaPercent}% MoM
                  </p>
                </div>
                <IconBadge
                  icon={<BarChart3 className="w-4 h-4" />}
                  tone="sage"
                  size="sm"
                  shape="circle"
                />
              </WhiteCard>

              <WhiteCard
                onClick={onOpenRewards}
                className="p-3.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[var(--muted)] truncate">
                    {t.extras.mintCoins}
                  </p>
                  <p className="font-mono text-sm font-semibold text-[var(--ink)] tabular-nums mt-0.5">
                    {workspace.rewards?.coins ?? 0} Coins
                  </p>
                </div>
                <IconBadge
                  icon={<Coins className="w-4 h-4" />}
                  tone="cream"
                  size="sm"
                  shape="circle"
                />
              </WhiteCard>
            </div>

            <AllowanceRunway
              runway={runway}
              currency="INR"
              recurring={workspace.recurring}
              t={t}
              onEditCycle={onOpenSettings}
            />

            {/* Contextual Indian Campus Calendar Nudges */}
            {nudges.length > 0 && (
              <WhiteCard className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[var(--teal-900)]" />
                    <h2 className="text-sm font-medium text-[var(--ink)]">
                      {t.extras.campusNudges}
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--muted)]">
                    {nudges.length} active
                  </span>
                </div>
                <div className="space-y-2.5">
                  {nudges.map((nudge) => (
                    <div
                      key={nudge.id}
                      className="rounded-2xl bg-[var(--surface-tint)] border border-[var(--hairline-soft)] p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--ink)]">{nudge.title}</p>
                        <p className="text-[11px] text-[var(--muted)] leading-relaxed">{nudge.body}</p>
                      </div>
                      <Pill
                        variant="ink"
                        size="sm"
                        onClick={() => onHandleNudge(nudge)}
                        className="min-h-[34px] px-3 text-[11px]"
                      >
                        <span>{nudge.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Pill>
                    </div>
                  ))}
                </div>
              </WhiteCard>
            )}

            <WhiteCard className="space-y-4">
              <SectionHeader
                title="Category Budgets"
                actionLabel="View All"
                onAction={() => onNavigateTab('plans')}
                className="px-0"
              />

              <div className="space-y-3.5">
                {budgets.map((b) => {
                  const pct = Math.min(100, Math.round(b.utilizationRatio * 100));
                  const barColor =
                    b.utilizationRatio >= 1
                      ? 'var(--coral)'
                      : b.utilizationRatio >= 0.75
                        ? 'var(--amber)'
                        : 'var(--teal-900)';
                  return (
                    <div key={b.budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--ink)]">
                          {t.categories[b.budget.category]}
                        </span>
                        <span className="text-[var(--muted)] tabular-nums">
                          {fmtINR(b.spentCents)} / {fmtINR(b.budget.limitCents)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--surface-track)] overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </WhiteCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
