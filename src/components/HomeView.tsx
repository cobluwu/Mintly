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
import { TopScreenHeader } from './ui/TopScreenHeader';
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
      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3 bg-[#F4F7F4]">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            setRevealed(false);
            onSplit();
          }}
          className="min-h-[36px] px-3 rounded-full bg-[#DDEFE3] text-[#0E2B2B] text-xs font-medium cursor-pointer"
        >
          Split
        </button>
        {canReverse && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(14);
              setRevealed(false);
              onReverse(tx.id);
            }}
            aria-label={`Reverse ${tx.merchant}`}
            className="min-h-[36px] px-3 rounded-full bg-[#E26D5C] text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
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
        className="relative z-10 flex items-center justify-between gap-3 py-3.5 px-4 bg-white"
      >
        <div className="flex items-center gap-3 min-w-0">
          <CategoryGlyph category={tx.category} size={40} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0E2B2B] truncate">{tx.merchant}</p>
            <p className="text-xs text-[#6B7F7C] truncate">
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
                ? 'text-[#6B7F7C] line-through'
                : tx.type === 'income'
                  ? 'text-[#0B3B3A]'
                  : 'text-[#0E2B2B]'
            }`}
          >
            {tx.type === 'income' ? '+' : '-'}
            {fmtINR(tx.amountCents)}
          </span>
          {tx.roundUpPaise ? (
            <span className="px-2 py-0.5 rounded-full bg-[#DDEFE3] text-[#0B3B3A] font-mono text-[10px] font-medium tabular-nums">
              +{fmtINR(tx.roundUpPaise)} saved
            </span>
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

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Top Bar: Segmented Pill Toggle (Overview | Budget) + Circular Mochi Avatar */}
      <TopScreenHeader
        layoutId="home-mode-pill"
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

      {/* Editorial Hero Greeting */}
      <motion.section variants={STAGGER_ITEM} className="space-y-1 pt-1">
        <h1 className="font-display text-[36px] sm:text-[40px] font-medium tracking-[-0.03em] leading-[1.08] text-[#0E2B2B]">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-[#6B7F7C]">
          {homeMode === 'overview'
            ? workspace.profile.language === 'hinglish'
              ? t.greeting.subtitleOnTrack
              : "Here's your account overview"
            : `${t.home.paceLabels[runway.pace]} · ${runway.daysRemaining} ${t.home.daysLeft} (${runway.nextAllowanceLabel})`}
        </p>
      </motion.section>

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
                    icon: <ArrowDownLeft className="w-4 h-4 text-[#0B3B3A]" />,
                  },
                  {
                    key: 'split',
                    label: t.home.splitBill,
                    icon: <Users className="w-4 h-4 text-[#0B3B3A]" />,
                  },
                  {
                    key: 'vault',
                    label: t.home.addVault,
                    icon: <PiggyBank className="w-4 h-4 text-[#0B3B3A]" />,
                  },
                ] as const
              ).map((action) => (
                <motion.button
                  key={action.key}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_BOUNCY}
                  onClick={() => {
                    triggerHaptic(8);
                    onQuickAction(action.key);
                  }}
                  className="min-h-[44px] px-3 rounded-full bg-white/65 hover:bg-white/90 backdrop-blur-xl border border-white/75 text-xs font-medium text-[#0E2B2B] shadow-[0_8px_20px_-10px_rgba(14,43,43,0.14)] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </motion.button>
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
            <section className="mintly-white-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-[#0E2B2B]">
                  {t.home.weeklyPulse}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    onNavigateTab('plans');
                  }}
                  className="text-xs font-medium text-[#0E2B2B] underline underline-offset-4 hover:text-[#0B3B3A] cursor-pointer min-h-[36px] px-1"
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

              <div className="pt-3 border-t border-[#0E2B2B]/[0.06] space-y-2">
                {budgets.slice(0, 2).map((b) => {
                  const pct = Math.min(100, Math.round(b.utilizationRatio * 100));
                  return (
                    <div
                      key={b.budget.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-[#0E2B2B] font-medium truncate">
                        {t.categories[b.budget.category]}
                      </span>
                      <span className="text-[#6B7F7C] tabular-nums shrink-0">
                        {fmtINR(b.spentCents)} / {fmtINR(b.budget.limitCents)} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Activity Stream with Hairline Dividers & View All */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-medium text-[#6B7F7C]">{t.nav.activity}</h2>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    onNavigateTab('activity');
                  }}
                  className="text-sm font-medium text-[#0E2B2B] underline underline-offset-4 hover:text-[#0B3B3A] cursor-pointer min-h-[36px]"
                >
                  View All
                </button>
              </div>

              <div className="mintly-white-card overflow-hidden divide-y divide-[#0E2B2B]/[0.06]">
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
              </div>
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
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onOpenReport();
                }}
                className="mintly-white-card p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-white transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#6B7F7C] truncate">
                    {t.extras.moneyReport}
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#0E2B2B] tabular-nums mt-0.5">
                    {monthlyReport.deltaPercent > 0 ? '+' : ''}
                    {monthlyReport.deltaPercent}% MoM
                  </p>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#DDEFE3] text-[#0B3B3A] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onOpenRewards();
                }}
                className="mintly-white-card p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-white transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#6B7F7C] truncate">
                    {t.extras.mintCoins}
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#0E2B2B] tabular-nums mt-0.5">
                    {workspace.rewards?.coins ?? 0} Coins
                  </p>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#F3EFDC] text-[#0B3B3A] flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </span>
              </button>
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
              <section className="mintly-white-card p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[#0B3B3A]" />
                    <h2 className="text-sm font-medium text-[#0E2B2B]">
                      {t.extras.campusNudges}
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7F7C]">
                    {nudges.length} active
                  </span>
                </div>
                <div className="space-y-2.5">
                  {nudges.map((nudge) => (
                    <div
                      key={nudge.id}
                      className="rounded-2xl bg-[#F4F7F4] border border-[#0E2B2B]/[0.06] p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0E2B2B]">{nudge.title}</p>
                        <p className="text-[11px] text-[#6B7F7C] leading-relaxed">{nudge.body}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(8);
                          onHandleNudge(nudge);
                        }}
                        className="min-h-[34px] px-3 rounded-full bg-[#0B3B3A] text-white text-[11px] font-medium inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <span>{nudge.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mintly-white-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#6B7F7C]">Category Budgets</h2>
                <button
                  type="button"
                  onClick={() => onNavigateTab('plans')}
                  className="text-xs font-medium text-[#0E2B2B] underline underline-offset-4 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3.5">
                {budgets.map((b) => {
                  const pct = Math.min(100, Math.round(b.utilizationRatio * 100));
                  const barColor =
                    b.utilizationRatio >= 1
                      ? '#E26D5C'
                      : b.utilizationRatio >= 0.75
                        ? '#E8B64C'
                        : '#0B3B3A';
                  return (
                    <div key={b.budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#0E2B2B]">
                          {t.categories[b.budget.category]}
                        </span>
                        <span className="text-[#6B7F7C] tabular-nums">
                          {fmtINR(b.spentCents)} / {fmtINR(b.budget.limitCents)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#ECEFED] overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
