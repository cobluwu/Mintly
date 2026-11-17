import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, ChevronRight, Coins, Plus, Sparkles, Target } from 'lucide-react';
import type {
  AllowanceRunwaySummary,
  BudgetStatus,
  ContextualNudge,
  MintlyWorkspaceState,
  VaultThemeKey,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  computeVaultMetrics,
  fmtINR,
  formatDateDDMMM,
  resolveMascotState,
} from '../shared/finance';
import {
  SPRING_BOUNCY,
  SPRING_GENTLE,
  STAGGER_CONTAINER,
  STAGGER_ITEM,
  triggerHaptic,
} from '../shared/motion';
import { CategoryGlyph } from './CategoryArt';
import { MascotCompanion } from './MascotCompanion';
import type { MochiPoseMood } from './brand/MochiMascot';
import {
  Chip,
  EmptyState,
  IconBadge,
  PageHeader,
  Pill,
  SectionHeader,
  StatBlock,
  TealFeatureCard,
  WhiteCard,
} from './ui';
import vaultLaptopArt from '../assets/images/vault_laptop_art_1794665749801.jpg';
import vaultTripArt from '../assets/images/vault_trip_art_1794665750954.jpg';
import vaultEmergencyArt from '../assets/images/mintly_mascot_celebrate_1794665748967.jpg';

interface PlansViewProps {
  workspace: MintlyWorkspaceState;
  runway: AllowanceRunwaySummary;
  budgets: BudgetStatus[];
  nudges?: ContextualNudge[];
  t: TranslationBundle;
  onOpenSettings: () => void;
  onContributeVault: (vaultId: string) => void;
  onToggleRoundUps: (enabled: boolean, targetVaultId?: string) => void;
  onHandleNudge?: (nudge: ContextualNudge) => void;
}

const VAULT_ART: Record<'laptop' | 'trip' | 'emergency', string> = {
  laptop: vaultLaptopArt,
  trip: vaultTripArt,
  emergency: vaultEmergencyArt,
};

const GOAL_THEME_LABEL: Record<VaultThemeKey, string> = {
  laptop: 'Tech Goal',
  trip: 'Squad Trip',
  emergency: 'Safety Net',
  festivals: 'Festive Goal',
  placement: 'Career Prep',
};

export const PlansView: React.FC<PlansViewProps> = ({
  workspace,
  runway,
  budgets,
  nudges = [],
  t,
  onOpenSettings,
  onContributeVault,
  onToggleRoundUps,
  onHandleNudge,
}) => {
  const [tab, setTab] = useState<'budgets' | 'vaults'>('budgets');
  const nowIso = new Date().toISOString();

  const roundUp = workspace.roundUp ?? {
    enabled: false,
    targetVaultId: workspace.vaults[0]?.id ?? 'vault_goa',
    monthlySavedCents: 0,
  };
  const roundUpTargetVault =
    workspace.vaults.find((v) => v.id === roundUp.targetVaultId) ?? workspace.vaults[0];

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

  const summary = useMemo(() => {
    const totalBudgetSpent = budgets.reduce((s, b) => s + b.spentCents, 0);
    const totalBudgetLimit = budgets.reduce((s, b) => s + b.budget.limitCents, 0);
    const healthyBudgets = budgets.filter((b) => b.status === 'healthy').length;
    const budgetRatio = totalBudgetLimit > 0 ? totalBudgetSpent / totalBudgetLimit : 0;

    const totalVaultSaved = workspace.vaults.reduce((s, v) => s + v.savedCents, 0);
    const totalVaultTarget = workspace.vaults.reduce((s, v) => s + v.targetCents, 0);
    const totalWeeklyAuto = workspace.vaults.reduce((s, v) => s + v.weeklyAutoCents, 0);
    const vaultPercent =
      totalVaultTarget > 0 ? Math.min(100, Math.round((totalVaultSaved / totalVaultTarget) * 100)) : 0;

    return {
      totalBudgetSpent,
      totalBudgetLimit,
      budgetRemaining: Math.max(0, totalBudgetLimit - totalBudgetSpent),
      budgetPct: Math.min(100, Math.round(budgetRatio * 100)),
      healthyBudgets,
      totalVaultSaved,
      totalVaultTarget,
      totalWeeklyAuto,
      vaultPercent,
    };
  }, [budgets, workspace.vaults]);

  const subtitle =
    tab === 'budgets'
      ? `${budgets.length} monthly plans · ${summary.healthyBudgets} healthy`
      : `${workspace.vaults.length} goal vaults · ${summary.vaultPercent}% funded`;

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Shared PageHeader matching Home */}
      <PageHeader
        layoutId="plans-mode-toggle"
        title={t.plans.title}
        subtitle={subtitle}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'budgets', label: 'Plans' },
          { value: 'vaults', label: 'Vaults' },
        ]}
        mochiMood={mochiPoseMood}
        mochiAccessory={workspace.rewards?.equippedAccessoryId}
        onAvatarClick={onOpenSettings}
      />

      {tab === 'budgets' ? (
        <div className="space-y-5">
          {/* L3 Deep Teal Feature Hero: Total Monthly Plan Progress */}
          <motion.div variants={STAGGER_ITEM}>
            <TealFeatureCard className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-[13px] font-medium text-white/80">
                    Monthly plan spend
                  </p>
                  <StatBlock
                    label=""
                    valueCents={summary.totalBudgetSpent}
                    tone="dark"
                    size="lg"
                    className="[&>p:first-child]:hidden"
                  />
                  <p className="text-[13px] text-white/75 tabular-nums">
                    of{' '}
                    <span className="font-semibold text-white">
                      {fmtINR(summary.totalBudgetLimit)}
                    </span>{' '}
                    total limit
                  </p>
                </div>

                <span className="rounded-full px-3 py-1 bg-[var(--sage-300)]/20 border border-[var(--sage-300)]/35 text-[var(--sage-100)] text-xs font-medium shrink-0">
                  {summary.healthyBudgets}/{budgets.length} on track
                </span>
              </div>

              {/* Segmented utilization bar + pin marker */}
              <div className="pt-2 space-y-2">
                <div className="relative">
                  <motion.div
                    initial={{ left: '8%' }}
                    animate={{ left: `${Math.max(8, Math.min(94, summary.budgetPct))}%` }}
                    transition={SPRING_BOUNCY}
                    aria-hidden="true"
                    className="absolute -top-3 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
                  >
                    <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                    <span className="w-[2px] h-10 bg-white rounded-full" />
                  </motion.div>

                  <div className="relative h-7 rounded-lg overflow-hidden bg-white/[0.08]">
                    <motion.div
                      initial={{ width: '8%' }}
                      animate={{ width: `${Math.max(8, summary.budgetPct)}%` }}
                      transition={SPRING_GENTLE}
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(29,84,81,0.55) 0%, rgba(169,214,184,0.7) 75%, rgba(255,255,255,0.9) 100%)',
                      }}
                      className="h-full"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 grid grid-cols-8 pointer-events-none"
                    >
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={idx < 7 ? 'border-r-[3px] border-[#0B3B3A]/85' : ''}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/75 tabular-nums">
                  <span>
                    <span className="font-semibold text-white">
                      {fmtINR(summary.budgetRemaining)}
                    </span>{' '}
                    headroom left
                  </span>
                  <span className="font-mono">{summary.budgetPct}% used</span>
                </div>
              </div>
            </TealFeatureCard>
          </motion.div>

          {/* Contextual Campus Nudges */}
          {nudges.length > 0 && (
            <motion.div variants={STAGGER_ITEM}>
              <WhiteCard ariaLabel={t.extras.campusNudges} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <IconBadge
                      icon={<CalendarClock className="w-4 h-4" />}
                      tone="sage"
                      size="sm"
                      shape="circle"
                    />
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
                      className="rounded-[16px] bg-[var(--surface-tint)] border border-[var(--hairline-soft)] p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-[var(--ink)]">
                          {nudge.title}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                          {nudge.body}
                        </p>
                      </div>
                      {onHandleNudge && (
                        <Pill
                          variant="ink"
                          size="sm"
                          onClick={() => onHandleNudge(nudge)}
                          className="min-h-[34px] px-3 text-[11px]"
                        >
                          <span>{nudge.actionLabel}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Pill>
                      )}
                    </div>
                  ))}
                </div>
              </WhiteCard>
            </motion.div>
          )}

          {/* Category Budget Cards */}
          <div className="space-y-3">
            <SectionHeader title={t.plans.monthlyPlans} />
            {budgets.length === 0 ? (
              <EmptyState
                title="No spending plans yet"
                description="Your category budgets will appear here once configured."
                mood="thinking"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {budgets.map((item) => {
                  const pct = Math.min(100, Math.round(item.utilizationRatio * 100));
                  const radius = 32;
                  const circ = 2 * Math.PI * radius;
                  const dashOffset = circ * (1 - pct / 100);
                  const strokeColor =
                    item.status === 'exceeded'
                      ? 'var(--coral)'
                      : item.status === 'warning'
                        ? 'var(--amber)'
                        : 'var(--teal-900)';

                  return (
                    <motion.div key={item.budget.id} variants={STAGGER_ITEM}>
                      <WhiteCard className="flex items-center justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CategoryGlyph category={item.budget.category} size={38} />
                            <h3
                              title={t.categories[item.budget.category]}
                              className="font-display text-base font-medium tracking-[-0.01em] text-[var(--ink)] line-clamp-2"
                            >
                              {t.categories[item.budget.category]}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="font-mono text-lg font-semibold text-[var(--ink)] tabular-nums">
                              {fmtINR(item.spentCents)}
                            </span>
                            <span className="text-xs text-[var(--muted)] font-mono tabular-nums">
                              {t.plans.ofTarget} {fmtINR(item.budget.limitCents)}
                            </span>
                          </div>

                          <div>
                            <Chip
                              variant={
                                item.status === 'exceeded'
                                  ? 'coral'
                                  : item.status === 'warning'
                                    ? 'amber'
                                    : 'sage'
                              }
                            >
                              {item.remainingCents >= 0
                                ? `${fmtINR(item.remainingCents)} left`
                                : `${fmtINR(Math.abs(item.remainingCents))} over plan`}
                            </Chip>
                          </div>
                        </div>

                        {/* Calm Light-Mode Radial Progress Ring */}
                        <div className="relative w-[76px] h-[76px] shrink-0 flex items-center justify-center">
                          <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
                            <circle
                              cx="38"
                              cy="38"
                              r={radius}
                              fill="none"
                              stroke="var(--surface-track)"
                              strokeWidth="7.5"
                            />
                            <motion.circle
                              cx="38"
                              cy="38"
                              r={radius}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="7.5"
                              strokeLinecap="round"
                              strokeDasharray={circ}
                              initial={{ strokeDashoffset: circ }}
                              animate={{ strokeDashoffset: dashOffset }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </svg>
                          <span className="absolute font-mono text-xs font-semibold text-[var(--ink)] tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      </WhiteCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* L3 Deep Teal Feature Hero: Total Saved Across Vaults */}
          <motion.div variants={STAGGER_ITEM}>
            <TealFeatureCard className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-[13px] font-medium text-white/80">
                    Saved across goals
                  </p>
                  <StatBlock
                    label=""
                    valueCents={summary.totalVaultSaved}
                    tone="dark"
                    size="lg"
                    className="[&>p:first-child]:hidden"
                  />
                  <p className="text-[13px] text-white/75 tabular-nums">
                    of{' '}
                    <span className="font-semibold text-white">
                      {fmtINR(summary.totalVaultTarget)}
                    </span>{' '}
                    combined targets
                  </p>
                </div>

                <span className="rounded-full px-3 py-1 bg-[var(--sage-300)]/20 border border-[var(--sage-300)]/35 text-[var(--sage-100)] text-xs font-mono font-medium shrink-0 tabular-nums">
                  {summary.vaultPercent}% funded
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-white/12 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, summary.vaultPercent)}%` }}
                  transition={SPRING_GENTLE}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--sage-300)] to-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[var(--sage-300)]" />
                  <span>{workspace.vaults.length} active vaults</span>
                </span>
                <span className="font-mono text-white/90 tabular-nums">
                  +{fmtINR(summary.totalWeeklyAuto)}/wk auto-pace
                </span>
              </div>
            </TealFeatureCard>
          </motion.div>

          {/* Jar-style ₹10 Auto Round-Ups WhiteCard */}
          <motion.div variants={STAGGER_ITEM}>
            <WhiteCard ariaLabel="₹10 Auto Round-Ups" className="space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <IconBadge
                    icon={<Coins className="w-4 h-4" />}
                    tone="sage"
                    size="md"
                    shape="circle"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-sm font-medium text-[var(--ink)]">
                        ₹10 Auto Round-Ups
                      </h2>
                      <Chip variant="sage" className="font-mono tabular-nums">
                        +{fmtINR(roundUp.monthlySavedCents)} saved
                      </Chip>
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Rounds every UPI spend to the next ₹10 into{' '}
                      <span className="font-medium text-[var(--ink)]">
                        {roundUpTargetVault?.title || 'your goal'}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={roundUp.enabled}
                  aria-label="Toggle ₹10 Auto Round-Ups"
                  onClick={() => {
                    triggerHaptic(10);
                    onToggleRoundUps(!roundUp.enabled, roundUp.targetVaultId);
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer flex items-center px-1 ${
                    roundUp.enabled ? 'bg-[var(--teal-900)]' : 'bg-[var(--surface-track)]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      roundUp.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-[var(--hairline-soft)]">
                <label className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                  <span className="shrink-0">Save spare change to:</span>
                  <select
                    aria-label="Round-up destination vault"
                    value={roundUp.targetVaultId}
                    onChange={(e) => {
                      triggerHaptic(6);
                      onToggleRoundUps(roundUp.enabled, e.target.value);
                    }}
                    className="min-h-[38px] px-3 rounded-full bg-[var(--surface-subtle)] border border-[var(--ink)]/12 text-[var(--ink)] text-xs font-medium focus:outline-none focus:border-[var(--teal-900)] cursor-pointer"
                  >
                    {workspace.vaults.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </WhiteCard>
          </motion.div>

          {/* Savings Vault Cards */}
          <div className="space-y-3">
            <SectionHeader title={t.plans.vaults} />
            <div className="grid grid-cols-1 gap-4">
              {workspace.vaults.map((vault) => {
                const metrics = computeVaultMetrics(vault, nowIso);
                const isDone = metrics.percent >= 100;
                const isRoundUpTarget = roundUp.enabled && roundUp.targetVaultId === vault.id;
                const themeBadge = vault.goalTheme ? GOAL_THEME_LABEL[vault.goalTheme] : 'Goal';

                return (
                  <motion.div key={vault.id} variants={STAGGER_ITEM}>
                    <WhiteCard noPadding className="overflow-hidden flex flex-col">
                      <div className="relative h-40 bg-[var(--teal-900)] overflow-hidden">
                        <img
                          src={VAULT_ART[vault.artworkKey] || VAULT_ART.emergency}
                          alt={vault.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B3B3A]/92 via-[#0B3B3A]/28 to-transparent" />
                        <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-[10px] font-semibold text-[var(--ink)] shadow-sm">
                            {themeBadge}
                          </span>
                          {isRoundUpTarget && (
                            <span className="px-2.5 py-1 rounded-full bg-[var(--sage-300)] text-[var(--ink)] text-[10px] font-semibold shadow-sm">
                              ₹10 Round-Ups ON
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white line-clamp-2">
                              {vault.title}
                            </h3>
                            <p className="text-xs font-mono text-white/80 tabular-nums">
                              {isDone
                                ? t.plans.completed
                                : metrics.projectedDateLabel
                                  ? `Est. ${metrics.projectedDateLabel} (~${metrics.estimatedWeeks}w)`
                                  : vault.targetDateIso
                                    ? `Target ${formatDateDDMMM(vault.targetDateIso)}`
                                    : 'Flexible pace'}
                            </p>
                          </div>
                          <span className="font-mono text-lg font-semibold text-[var(--sage-300)] tabular-nums shrink-0">
                            {metrics.percent}%
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono text-2xl font-semibold text-[var(--ink)] tabular-nums">
                              {fmtINR(vault.savedCents)}
                            </span>
                            <span className="font-mono text-xs text-[var(--muted)] tabular-nums">
                              {t.plans.ofTarget} {fmtINR(vault.targetCents)}
                            </span>
                          </div>

                          {/* 4-segment milestone bar (25 / 50 / 75 / 100) */}
                          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                            {[25, 50, 75, 100].map((step) => {
                              const prevStep = step - 25;
                              const fillRatio = Math.max(
                                0,
                                Math.min(1, (metrics.percent - prevStep) / 25)
                              );
                              return (
                                <div
                                  key={step}
                                  className="h-2 rounded-full bg-[var(--surface-track)] overflow-hidden"
                                >
                                  <div
                                    style={{ width: `${Math.round(fillRatio * 100)}%` }}
                                    className="h-full bg-gradient-to-r from-[var(--teal-900)] to-[var(--sage-300)] transition-all duration-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--hairline-soft)]">
                          <div className="text-xs text-[var(--muted)]">
                            {vault.contributions.length}{' '}
                            {vault.contributions.length === 1 ? 'deposit' : 'deposits'} · auto{' '}
                            <span className="font-mono font-medium text-[var(--ink)]">
                              {fmtINR(vault.weeklyAutoCents)}/wk
                            </span>
                          </div>

                          <Pill
                            variant="ink"
                            size="md"
                            icon={
                              isDone ? (
                                <Sparkles className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )
                            }
                            onClick={() => onContributeVault(vault.id)}
                          >
                            {t.plans.contribute}
                          </Pill>
                        </div>
                      </div>
                    </WhiteCard>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div variants={STAGGER_ITEM}>
            <WhiteCard>
              <MascotCompanion
                mood="celebrate"
                size={56}
                message="Milestone tip: Dropping ₹500 after tutoring payouts shaves a full week off your Laptop Fund."
              />
            </WhiteCard>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
