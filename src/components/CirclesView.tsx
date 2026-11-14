import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, MessageCircle, Plus, Smartphone } from 'lucide-react';
import type { CircleDebtTransfer, MintlyWorkspaceState, SplitMode } from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  buildWhatsAppRemindUrl,
  computeCircleSettlements,
  fmtINR,
  formatDateDDMMM,
} from '../shared/finance';
import { triggerHaptic } from '../shared/motion';

interface CirclesViewProps {
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  onOpenAddSplit: (circleId: string) => void;
  onSettleTransfer: (circleId: string, transfer: CircleDebtTransfer) => void;
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
}) => {
  const [selectedCircleId, setSelectedCircleId] = useState<string>(
    workspace.circles[0]?.id || ''
  );

  const activeCircle =
    workspace.circles.find((c) => c.id === selectedCircleId) || workspace.circles[0];

  if (!activeCircle) {
    return (
      <div className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-8 text-center text-sm text-[#94A3B8]">
        No circles yet.
      </div>
    );
  }

  const settlement = computeCircleSettlements(activeCircle);
  const memberById = new Map(activeCircle.members.map((m) => [m.id, m]));
  const selfMember = activeCircle.members.find((m) => m.isSelf);
  const primarySettleTransfer =
    settlement.transfers.find(
      (tr) => tr.fromMemberId === selfMember?.id || tr.toMemberId === selfMember?.id
    ) ?? settlement.transfers[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
          {t.circles.title}
        </h1>
        <button
          type="button"
          onClick={() => onOpenAddSplit(activeCircle.id)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#B9FF4B] hover:bg-[#c8ff70] text-[#0B0D10] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.circles.addSplit}</span>
        </button>
      </div>

      {/* Group selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {workspace.circles.map((circle) => {
          const active = circle.id === activeCircle.id;
          return (
            <button
              key={circle.id}
              type="button"
              onClick={() => setSelectedCircleId(circle.id)}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                active
                  ? 'bg-[#1F242E] text-white border-[#B9FF4B]/60'
                  : 'bg-[#13161C] text-[#94A3B8] border-white/[0.07] hover:text-white'
              }`}
            >
              {circle.name} · {circle.members.length}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Members & Who Owes Whom */}
        <section className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                {t.circles.whoOwesWhom}
              </h2>
              <p className="text-xs text-[#94A3B8] font-mono tabular-nums mt-0.5">
                Pool total: {fmtINR(settlement.totalSpendCents)}
              </p>
            </div>

            {primarySettleTransfer && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onSettleTransfer(activeCircle.id, primarySettleTransfer);
                }}
                className="min-h-[40px] px-3.5 rounded-xl bg-white/[0.06] hover:bg-[#B9FF4B]/20 text-xs font-semibold text-[#B9FF4B] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{t.circles.settleUp} UPI</span>
              </button>
            )}
          </div>

          {/* Member Avatar Strip */}
          <div className="flex flex-wrap gap-3">
            {activeCircle.members.map((m) => {
              const net = settlement.netBalances[m.id] ?? 0;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 pr-3 py-1.5 rounded-2xl bg-white/[0.03]"
                >
                  <div
                    style={{ backgroundColor: m.color }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-[#0B0D10]"
                  >
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{m.name}</p>
                    <p
                      className={`text-[11px] font-mono tabular-nums ${
                        net > 0
                          ? 'text-[#B9FF4B]'
                          : net < 0
                            ? 'text-[#FF6B6B]'
                            : 'text-[#94A3B8]'
                      }`}
                    >
                      {net === 0 ? 'Settled' : fmtINR(net, { sign: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simplified Debt Transfers with UPI Settle + WhatsApp Remind */}
          <div className="pt-3 border-t border-white/[0.07] space-y-2.5">
            {settlement.transfers.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-[#34D399] py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.circles.allSettled}</span>
              </div>
            ) : (
              settlement.transfers.map((tr, idx) => {
                const whatsappHref = buildWhatsAppRemindUrl({
                  phone: tr.fromPhone,
                  fromName: tr.fromName,
                  toName: tr.toName,
                  circleName: activeCircle.name,
                  amountCents: tr.amountCents,
                  toUpiId: tr.toUpiId,
                });

                return (
                  <div
                    key={`${tr.fromMemberId}-${tr.toMemberId}-${idx}`}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-[#E2E8F0]">
                          <span className="font-semibold text-white truncate">{tr.fromName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="font-semibold text-white truncate">{tr.toName}</span>
                        </div>
                        {tr.toUpiId && (
                          <p className="text-[10px] font-mono text-[#94A3B8] truncate mt-0.5">
                            UPI: {tr.toUpiId}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-sm font-bold text-[#FFD166] tabular-nums shrink-0">
                        {fmtINR(tr.amountCents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Remind ${tr.fromName} on WhatsApp for ${fmtINR(tr.amountCents)}`}
                        className="min-h-[34px] px-3 rounded-full bg-white/[0.06] hover:bg-[#25D366]/20 text-[11px] font-semibold text-[#CBD5E1] hover:text-[#6EE7B7] inline-flex items-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Remind</span>
                      </a>

                      <button
                        type="button"
                        aria-label={`Settle ${tr.fromName} to ${tr.toName} ${fmtINR(tr.amountCents)} via UPI`}
                        onClick={() => {
                          triggerHaptic(8);
                          onSettleTransfer(activeCircle.id, tr);
                        }}
                        className="min-h-[34px] px-3.5 rounded-full bg-[#B9FF4B] hover:bg-[#c8ff70] text-[11px] font-bold text-[#0B0D10] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>{t.circles.settleUp}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Group Expense Feed */}
        <section className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-white">Shared Ledger</h2>
          <div className="divide-y divide-white/[0.06]">
            {activeCircle.expenses.map((exp) => {
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
                <div key={exp.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold truncate ${
                          exp.settled ? 'line-through text-[#64748B]' : 'text-white'
                        }`}
                      >
                        {exp.title}
                      </p>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-[10px] font-medium text-[#CBD5E1] shrink-0">
                        {splitLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {exp.settledRef
                        ? `${payer?.name || 'Member'} -> ${memberById.get(exp.splitBetweenIds[0])?.name || 'Member'}`
                        : `Paid by ${payer?.name || 'Member'} · Split ${exp.splitBetweenIds.length} ways`}
                      <span aria-hidden="true"> · </span>
                      {formatDateDDMMM(exp.occurredAtUtc)}
                      {selfShareCents !== null ? ` · Your share ${fmtINR(selfShareCents)}` : ''}
                      {exp.settled ? ' · Settled' : ''}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold tabular-nums shrink-0 ${
                      exp.settledRef ? 'text-[#34D399]' : 'text-white'
                    }`}
                  >
                    {fmtINR(exp.amountCents)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
