import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Plus,
  Smartphone,
  Users,
} from 'lucide-react';
import type { CircleDebtTransfer, MintlyWorkspaceState, SplitMode } from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  buildWhatsAppRemindUrl,
  computeCircleSettlements,
  fmtINR,
  formatDateDDMMM,
} from '../shared/finance';
import { STAGGER_CONTAINER, STAGGER_ITEM, triggerHaptic } from '../shared/motion';
import {
  AvatarStack,
  Chip,
  EmptyState,
  IconBadge,
  IllustratedAvatar,
  PageHeader,
  Pill,
  SectionHeader,
  StatBlock,
  TealFeatureCard,
  WhiteCard,
} from './ui';
import type { MochiPoseMood } from './brand/MochiMascot';

interface CirclesViewProps {
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  onOpenAddSplit: (circleId: string) => void;
  onSettleTransfer: (circleId: string, transfer: CircleDebtTransfer) => void;
  onOpenSettings?: () => void;
}

const SPLIT_MODE_LABEL: Record<SplitMode, string> = {
  equal: 'Equal',
  exact: 'Exact ₹',
  percent: 'Percent %',
  shares: 'Shares',
};

export const CirclesView: React.FC<CirclesViewProps> = ({
  workspace,
  t,
  onOpenAddSplit,
  onSettleTransfer,
  onOpenSettings,
}) => {
  const [selectedCircleId, setSelectedCircleId] = useState<string>(
    workspace.circles[0]?.id || ''
  );

  const activeCircle =
    workspace.circles.find((c) => c.id === selectedCircleId) || workspace.circles[0];

  const circleOptions = useMemo(
    () =>
      workspace.circles.map((circle) => {
        const words = circle.name.trim().split(/\s+/);
        const shortLabel =
          circle.name.length <= 12
            ? circle.name
            : words.slice(0, 2).join(' ').slice(0, 12);
        return {
          value: circle.id,
          label: shortLabel,
        };
      }),
    [workspace.circles]
  );

  if (!activeCircle) {
    return (
      <div className="space-y-5">
        <EmptyState
          mood="chill"
          accessory={workspace.rewards?.equippedAccessoryId}
          title="No circles yet"
          description="Create a hostel, trip, or study-squad split circle to track shared chai, cabs, and mess bills."
        />
      </div>
    );
  }

  const settlement = computeCircleSettlements(activeCircle);
  const memberById = new Map(activeCircle.members.map((m) => [m.id, m]));
  const selfMember = activeCircle.members.find((m) => m.isSelf);
  const selfNetCents = selfMember ? (settlement.netBalances[selfMember.id] ?? 0) : 0;
  const primarySettleTransfer =
    settlement.transfers.find(
      (tr) => tr.fromMemberId === selfMember?.id || tr.toMemberId === selfMember?.id
    ) ?? settlement.transfers[0];

  const mochiMood: MochiPoseMood =
    settlement.transfers.length === 0
      ? 'celebrating'
      : selfNetCents < 0
        ? 'thinking'
        : 'happy';

  const heroCaption =
    selfNetCents > 0
      ? 'Net owed to you'
      : selfNetCents < 0
        ? 'Your net share owed'
        : 'Your circle balance';

  const heroStatusBadge =
    selfNetCents > 0
      ? 'Owed to you'
      : selfNetCents < 0
        ? 'You owe'
        : 'All settled';

  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Shared PageHeader matching Home */}
      <PageHeader
        layoutId="circles-group-toggle"
        title={t.circles.title}
        subtitle={`${activeCircle.members.length} members · Pool total ${fmtINR(settlement.totalSpendCents)}`}
        value={activeCircle.id}
        onChange={setSelectedCircleId}
        options={
          circleOptions.length > 0
            ? circleOptions
            : [{ value: activeCircle.id, label: activeCircle.name }]
        }
        mochiMood={mochiMood}
        mochiAccessory={workspace.rewards?.equippedAccessoryId}
        onAvatarClick={() => onOpenSettings?.()}
        titleRightAction={
          <Pill
            variant="ink"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => onOpenAddSplit(activeCircle.id)}
          >
            {t.circles.addSplit}
          </Pill>
        }
      />

      {/* L3 Deep Teal Feature Hero: Net Circle Position & Member Stack */}
      <motion.div variants={STAGGER_ITEM}>
        <TealFeatureCard ariaLabel={`${activeCircle.name} net summary`} className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] font-medium text-white/80">{heroCaption}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                    selfNetCents < 0
                      ? 'bg-[var(--coral)]/20 border-[var(--coral)]/40 text-[#FFD9D3]'
                      : 'bg-[var(--sage-300)]/20 border-[var(--sage-300)]/35 text-[var(--sage-100)]'
                  }`}
                >
                  {heroStatusBadge}
                </span>
              </div>

              <StatBlock
                label=""
                valueCents={Math.abs(selfNetCents)}
                tone="dark"
                size="lg"
                className="[&>p:first-child]:hidden"
              />
            </div>

            <div className="shrink-0 pt-0.5">
              <AvatarStack members={activeCircle.members} max={4} size={34} />
            </div>
          </div>

          <div className="pt-3 border-t border-white/12 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.06em] text-white/65">
                {activeCircle.name}
              </p>
              <p className="text-xs text-white/85 font-mono tabular-nums mt-0.5">
                Pool {fmtINR(settlement.totalSpendCents)} · {activeCircle.expenses.length} splits
              </p>
            </div>

            {primarySettleTransfer && (
              <Pill
                variant="sage"
                size="md"
                icon={<Smartphone className="w-4 h-4" />}
                onClick={() => {
                  triggerHaptic(8);
                  onSettleTransfer(activeCircle.id, primarySettleTransfer);
                }}
              >
                {t.circles.settleUp} UPI
              </Pill>
            )}
          </div>
        </TealFeatureCard>
      </motion.div>

      {/* Member Balances Card (L2 WhiteCard) */}
      <motion.div variants={STAGGER_ITEM}>
        <WhiteCard ariaLabel="Circle member balances" className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-[var(--ink)]">Squad Balances</h2>
            <span className="text-xs font-mono text-[var(--muted)] tabular-nums">
              {activeCircle.members.length} in circle
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {activeCircle.members.map((m, idx) => {
              const net = settlement.netBalances[m.id] ?? 0;
              const statusTone =
                net > 0
                  ? 'text-[#15694B]'
                  : net < 0
                    ? 'text-[var(--coral-ink)]'
                    : 'text-[var(--muted)]';
              const roleLabel =
                net > 0
                  ? m.isSelf
                    ? 'Owed to you'
                    : 'Gets back'
                  : net < 0
                    ? m.isSelf
                      ? 'You owe'
                      : 'Owes pool'
                    : 'Settled';

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-[var(--surface-subtle)] border border-[var(--ink)]/[0.04] min-w-0"
                >
                  <IllustratedAvatar member={m} index={idx} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--ink)] truncate">
                      {m.isSelf && !m.name.includes('(You)') ? `${m.name} (You)` : m.name}
                    </p>
                    <p className={`text-[11px] font-mono tabular-nums font-medium ${statusTone}`}>
                      {net === 0 ? 'Settled' : `${fmtINR(net, { sign: true })}`}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] truncate">{roleLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </WhiteCard>
      </motion.div>

      {/* Simplified Debt Transfers Card (L2 WhiteCard) */}
      <motion.div variants={STAGGER_ITEM} className="space-y-2.5">
        <SectionHeader
          title={t.circles.whoOwesWhom}
          rightSlot={
            <Chip
              variant={settlement.transfers.length === 0 ? 'sage' : 'amber'}
              label={
                settlement.transfers.length === 0
                  ? 'All settled'
                  : `${settlement.transfers.length} pending`
              }
            />
          }
        />

        <WhiteCard ariaLabel={t.circles.whoOwesWhom} className="space-y-3">
          {settlement.transfers.length === 0 ? (
            <div className="flex items-center gap-3 py-1">
              <IconBadge
                icon={<CheckCircle2 className="w-5 h-5" />}
                tone="sage"
                size="md"
                shape="circle"
              />
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">{t.circles.allSettled}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Every chai, cab, and group split is squared up.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {settlement.transfers.map((tr, idx) => {
                const fromMember = memberById.get(tr.fromMemberId);
                const toMember = memberById.get(tr.toMemberId);
                const fromInvolvesSelf = tr.fromMemberId === selfMember?.id;
                const toInvolvesSelf = tr.toMemberId === selfMember?.id;
                const whatsappHref = buildWhatsAppRemindUrl({
                  phone: tr.fromPhone,
                  fromName: tr.fromName,
                  toName: tr.toName,
                  circleName: activeCircle.name,
                  amountCents: tr.amountCents,
                  toUpiId: tr.toUpiId,
                });

                const directionTag = fromInvolvesSelf
                  ? 'You owe'
                  : toInvolvesSelf
                    ? 'Owes you'
                    : 'Transfer';

                return (
                  <div
                    key={`${tr.fromMemberId}-${tr.toMemberId}-${idx}`}
                    className="p-3.5 rounded-[18px] bg-[var(--surface-subtle)] border border-[var(--ink)]/[0.05] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="inline-flex items-center -space-x-2 shrink-0">
                          {fromMember && (
                            <IllustratedAvatar member={fromMember} index={idx} size={32} />
                          )}
                          {toMember && (
                            <IllustratedAvatar member={toMember} index={idx + 1} size={32} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)]">
                            <span className="truncate">{tr.fromName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                            <span className="truncate">{tr.toName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Chip
                              variant={
                                fromInvolvesSelf
                                  ? 'coral'
                                  : toInvolvesSelf
                                    ? 'sage'
                                    : 'neutral'
                              }
                              label={directionTag}
                            />
                            {tr.toUpiId && (
                              <span className="text-[11px] font-mono text-[var(--muted)] truncate">
                                {tr.toUpiId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`font-mono text-[15px] font-semibold tabular-nums shrink-0 ${
                          fromInvolvesSelf
                            ? 'text-[var(--coral-ink)]'
                            : toInvolvesSelf
                              ? 'text-[#15694B]'
                              : 'text-[var(--ink)]'
                        }`}
                      >
                        {fmtINR(tr.amountCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Remind ${tr.fromName} on WhatsApp for ${fmtINR(tr.amountCents)}`}
                        onClick={() => triggerHaptic(6)}
                        className="min-h-[44px] px-3.5 rounded-full bg-white border border-[var(--ink)]/14 hover:bg-[var(--sage-100)]/60 text-xs font-medium text-[var(--ink)] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#15694B]" />
                        <span>Remind</span>
                      </a>

                      <Pill
                        variant="ink"
                        size="md"
                        icon={<Smartphone className="w-3.5 h-3.5" />}
                        ariaLabel={`Settle ${tr.fromName} to ${tr.toName} ${fmtINR(tr.amountCents)} via UPI`}
                        onClick={() => {
                          triggerHaptic(8);
                          onSettleTransfer(activeCircle.id, tr);
                        }}
                      >
                        {t.circles.settleUp}
                      </Pill>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WhiteCard>
      </motion.div>

      {/* Shared Ledger Feed (L2 WhiteCard with hairline dividers) */}
      <motion.div variants={STAGGER_ITEM} className="space-y-2.5">
        <SectionHeader
          title="Shared Ledger"
          rightSlot={
            <span className="text-xs font-mono text-[var(--muted)] tabular-nums">
              {activeCircle.expenses.length} entries
            </span>
          }
        />

        {activeCircle.expenses.length === 0 ? (
          <EmptyState
            mood="happy"
            accessory={workspace.rewards?.equippedAccessoryId}
            title="No shared expenses yet"
            description="Add a group split to automatically simplify who owes whom."
            actionLabel={t.circles.addSplit}
            onAction={() => onOpenAddSplit(activeCircle.id)}
          />
        ) : (
          <WhiteCard noPadding divideY ariaLabel="Shared Ledger">
            {activeCircle.expenses.map((exp, idx) => {
              const payer = memberById.get(exp.paidByMemberId);
              const splitLabel = exp.settledRef
                ? 'UPI Paid'
                : SPLIT_MODE_LABEL[exp.splitMode || 'equal'];
              const selfShareCents =
                !exp.settledRef && selfMember && exp.splitBetweenIds.includes(selfMember.id)
                  ? exp.customSplits?.[selfMember.id] ??
                    Math.floor(exp.amountCents / Math.max(1, exp.splitBetweenIds.length))
                  : null;

              return (
                <div
                  key={exp.id}
                  className="px-4 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {exp.settledRef ? (
                      <IconBadge
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        tone="sage"
                        size="md"
                        shape="circle"
                      />
                    ) : payer ? (
                      <IllustratedAvatar member={payer} index={idx} size={38} />
                    ) : (
                      <IconBadge
                        icon={<Users className="w-4 h-4" />}
                        tone="neutral"
                        size="md"
                        shape="circle"
                      />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`text-[14px] font-medium truncate ${
                            exp.settled
                              ? 'line-through text-[var(--muted)]'
                              : 'text-[var(--ink)]'
                          }`}
                        >
                          {exp.title}
                        </p>
                        <Chip
                          variant={exp.settledRef ? 'sage' : 'neutral'}
                          label={splitLabel}
                        />
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
                        {exp.settledRef
                          ? `${payer?.name || 'Member'} -> ${memberById.get(exp.splitBetweenIds[0])?.name || 'Member'}`
                          : `Paid by ${payer?.name || 'Member'} · Split ${exp.splitBetweenIds.length} ways`}
                        <span aria-hidden="true"> · </span>
                        {formatDateDDMMM(exp.occurredAtUtc)}
                        {selfShareCents !== null ? ` · Your share ${fmtINR(selfShareCents)}` : ''}
                        {exp.settled ? ' · Settled' : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-sm font-semibold tabular-nums shrink-0 ${
                      exp.settledRef ? 'text-[#15694B]' : 'text-[var(--ink)]'
                    }`}
                  >
                    {fmtINR(exp.amountCents)}
                  </span>
                </div>
              );
            })}
          </WhiteCard>
        )}
      </motion.div>
    </motion.div>
  );
};
