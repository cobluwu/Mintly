import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, ChevronRight, Coins, Plus, Sparkles } from 'lucide-react';
import type {
  BudgetStatus,
  ContextualNudge,
  MintlyWorkspaceState,
  VaultThemeKey,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import { computeVaultMetrics, fmtINR, formatDateDDMMM } from '../shared/finance';
import { triggerHaptic } from '../shared/motion';
import { CATEGORY_STYLE, CategoryGlyph } from './CategoryArt';
import { MascotCompanion } from './MascotCompanion';

interface PlansViewProps {
  workspace: MintlyWorkspaceState;
  budgets: BudgetStatus[];
  nudges?: ContextualNudge[];
  t: TranslationBundle;
  onContributeVault: (vaultId: string) => void;
  onToggleRoundUps: (enabled: boolean, targetVaultId?: string) => void;
  onHandleNudge?: (nudge: ContextualNudge) => void;
}

const VAULT_ART: Record<'laptop' | 'trip' | 'emergency', string> = {
  laptop: '/src/assets/images/vault_laptop_art_1794665749801.jpg',
  trip: '/src/assets/images/vault_trip_art_1794665750954.jpg',
  emergency: '/src/assets/images/mintly_mascot_celebrate_1794665748967.jpg',
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
  budgets,
  nudges = [],
  t,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
          {t.plans.title}
        </h1>

        <div
          role="tablist"
          aria-label="Plans and Vaults"
          className="flex items-center gap-1 p-1 rounded-xl bg-[#13161C] border border-white/[0.08]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'budgets'}
            onClick={() => setTab('budgets')}
            className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              tab === 'budgets'
                ? 'bg-[#B9FF4B] text-[#0B0D10]'
                : 'bg-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            {t.plans.monthlyPlans}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'vaults'}
            onClick={() => setTab('vaults')}
            className={`min-h-[38px] px-4 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
              tab === 'vaults'
                ? 'bg-[#B9FF4B] text-[#0B0D10]'
                : 'bg-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            {t.plans.vaults}
          </button>
        </div>
      </div>

      {tab === 'budgets' ? (
        <div className="space-y-4">
          {nudges.length > 0 && (
            <section
              aria-label={t.extras.campusNudges}
              className="rounded-3xl bg-[#13161C] border border-[#A9D6B8]/25 p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-[#A9D6B8]">
                <CalendarClock className="w-4 h-4" />
                <span>{t.extras.campusNudges}</span>
              </div>
              <div className="space-y-2">
                {nudges.map((nudge) => (
                  <div
                    key={nudge.id}
                    className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-3 flex items-start justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">{nudge.title}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                        {nudge.body}
                      </p>
                    </div>
                    {onHandleNudge && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(8);
                          onHandleNudge(nudge);
                        }}
                        className="min-h-[32px] px-2.5 rounded-full bg-[#B9FF4B] text-[#0B0D10] text-[11px] font-bold inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
                      >
                        <span>{nudge.actionLabel}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="grid grid-cols-1 gap-4">
          {budgets.map((item) => {
            const catStyle = CATEGORY_STYLE[item.budget.category];
            const pct = Math.min(100, Math.round(item.utilizationRatio * 100));
            const radius = 34;
            const circ = 2 * Math.PI * radius;
            const dashOffset = circ * (1 - pct / 100);

            return (
              <motion.article
                key={item.budget.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <CategoryGlyph category={item.budget.category} size={36} />
                    <h2 className="font-display text-base font-bold text-white truncate">
                      {t.categories[item.budget.category]}
                    </h2>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-mono text-lg font-bold text-white tabular-nums">
                      {fmtINR(item.spentCents)}
                    </p>
                    <p className="text-xs text-[#94A3B8] font-mono tabular-nums">
                      {t.plans.ofTarget} {fmtINR(item.budget.limitCents)}
                    </p>
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      item.status === 'exceeded'
                        ? 'text-[#FF6B6B]'
                        : item.status === 'warning'
                          ? 'text-[#FFD166]'
                          : 'text-[#34D399]'
                    }`}
                  >
                    {item.remainingCents >= 0
                      ? `${fmtINR(item.remainingCents)} left`
                      : `${fmtINR(Math.abs(item.remainingCents))} over plan`}
                  </p>
                </div>

                {/* Radial Progress Ring */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r={radius}
                      fill="none"
                      stroke={item.status === 'exceeded' ? '#FF6B6B' : catStyle.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-bold text-white tabular-nums">
                    {pct}%
                  </span>
                </div>
              </motion.article>
            );
          })}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Jar-style ₹10 Auto Round-Ups Control Card */}
          <section
            aria-label="₹10 Auto Round-Ups"
            className="rounded-3xl bg-[#13161C] border border-[#B9FF4B]/25 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#B9FF4B]/15 text-[#B9FF4B] flex items-center justify-center shrink-0 mt-0.5">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-sm font-bold text-white">
                      ₹10 Auto Round-Ups
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#B9FF4B]/15 text-[#B9FF4B] font-mono text-[11px] font-semibold tabular-nums">
                      +{fmtINR(roundUp.monthlySavedCents)} saved this month
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Rounds every expense to the next ₹10 (e.g. ₹243 Swiggy adds +₹7) into{' '}
                    <span className="text-white font-medium">
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
                  roundUp.enabled ? 'bg-[#B9FF4B]' : 'bg-white/15'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-[#0B0D10] shadow-sm transition-transform ${
                    roundUp.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.07]">
              <label className="flex items-center justify-between gap-2 w-full text-xs text-[#94A3B8]">
                <span className="shrink-0">Save spare change to:</span>
                <select
                  aria-label="Round-up destination vault"
                  value={roundUp.targetVaultId}
                  onChange={(e) => {
                    triggerHaptic(6);
                    onToggleRoundUps(roundUp.enabled, e.target.value);
                  }}
                  className="min-h-[36px] px-3 rounded-xl bg-[#191D25] border border-white/[0.1] text-white text-xs font-medium focus:outline-none focus:border-[#B9FF4B]"
                >
                  {workspace.vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5">
            {workspace.vaults.map((vault) => {
              const metrics = computeVaultMetrics(vault, nowIso);
              const isDone = metrics.percent >= 100;
              const isRoundUpTarget = roundUp.enabled && roundUp.targetVaultId === vault.id;
              const themeBadge = vault.goalTheme ? GOAL_THEME_LABEL[vault.goalTheme] : 'Goal';

              return (
                <article
                  key={vault.id}
                  className="rounded-3xl bg-[#13161C] border border-white/[0.08] overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 bg-[#0B0D10] overflow-hidden">
                    <img
                      src={VAULT_ART[vault.artworkKey] || VAULT_ART.emergency}
                      alt={vault.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13161C] via-[#13161C]/20 to-transparent" />
                    <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#0B0D10]/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white">
                        {themeBadge}
                      </span>
                      {isRoundUpTarget && (
                        <span className="px-2.5 py-1 rounded-full bg-[#B9FF4B] text-[#0B0D10] text-[10px] font-bold">
                          ₹10 Round-Ups Active
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between gap-2">
                      <div>
                        <h2 className="font-display text-xl font-extrabold text-white">
                          {vault.title}
                        </h2>
                        <p className="text-xs font-mono text-[#CBD5E1] tabular-nums">
                          {isDone
                            ? t.plans.completed
                            : metrics.projectedDateLabel
                              ? `Est. ${metrics.projectedDateLabel} (~${metrics.estimatedWeeks}w)`
                              : vault.targetDateIso
                                ? `Target ${formatDateDDMMM(vault.targetDateIso)}`
                                : 'Flexible pace'}
                        </p>
                      </div>
                      <span className="font-mono text-lg font-extrabold text-[#B9FF4B] tabular-nums">
                        {metrics.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-2xl font-bold text-white tabular-nums">
                          {fmtINR(vault.savedCents)}
                        </span>
                        <span className="font-mono text-xs text-[#94A3B8] tabular-nums">
                          {t.plans.ofTarget} {fmtINR(vault.targetCents)}
                        </span>
                      </div>

                      {/* Segmented milestone bar (25 / 50 / 75 / 100) */}
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
                              className="h-2 rounded-full bg-white/[0.08] overflow-hidden"
                            >
                              <div
                                style={{ width: `${Math.round(fillRatio * 100)}%` }}
                                className="h-full bg-[#B9FF4B] transition-all duration-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.07]">
                      <div className="text-xs text-[#94A3B8]">
                        {vault.contributions.length}{' '}
                        {vault.contributions.length === 1 ? 'deposit' : 'deposits'} · auto{' '}
                        <span className="font-mono text-white">
                          {fmtINR(vault.weeklyAutoCents)}/wk
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onContributeVault(vault.id)}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#B9FF4B] hover:bg-[#c8ff70] text-[#0B0D10] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isDone ? <Sparkles className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{t.plans.contribute}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-5">
            <MascotCompanion
              mood="celebrate"
              size={58}
              message="Milestone tip: Dropping ₹500 after tutoring payouts shaves a full week off your Laptop Fund."
            />
          </div>
        </div>
      )}
    </div>
  );
};
