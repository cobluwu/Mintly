import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarClock, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import type { AllowanceRunwaySummary, CurrencyCode, RecurringRule, RunwayPace } from '../shared/types';
import { fmtINR, formatDateDDMMM } from '../shared/finance';
import { SPRING_BOUNCY, SPRING_GENTLE, triggerHaptic } from '../shared/motion';
import { EditorialAmount } from './ui/EditorialAmount';
import { WhiteCard } from './ui/Surfaces';
import type { TranslationBundle } from '../shared/i18n';

interface AllowanceRunwayProps {
  runway: AllowanceRunwaySummary;
  currency: CurrencyCode;
  recurring: RecurringRule[];
  t: TranslationBundle;
  onEditCycle: () => void;
}

const PACE_COLORS: Record<RunwayPace, { stroke: string; track: string; badgeBg: string; text: string }> = {
  ahead: {
    stroke: '#0B3B3A',
    track: '#DDEFE3',
    badgeBg: '#DDEFE3',
    text: '#0B3B3A',
  },
  on_track: {
    stroke: '#14504D',
    track: '#DDEFE3',
    badgeBg: '#DDEFE3',
    text: '#0E2B2B',
  },
  caution: {
    stroke: '#E8B64C',
    track: '#F3EFDC',
    badgeBg: '#F3EFDC',
    text: '#7A5912',
  },
  over: {
    stroke: '#E26D5C',
    track: '#F8E3DF',
    badgeBg: '#F8E3DF',
    text: '#9B2F21',
  },
};

export const AllowanceRunway: React.FC<AllowanceRunwayProps> = ({
  runway,
  currency,
  recurring,
  t,
  onEditCycle,
}) => {
  const [showBills, setShowBills] = useState(false);
  const paceColor = PACE_COLORS[runway.pace];

  const radius = 98;
  const circumference = Math.PI * radius;
  const remainingRatio = Math.max(0.06, Math.min(1, 1 - runway.cycleProgressRatio));
  const strokeOffset = circumference * (1 - remainingRatio);

  const upcomingExpenses = recurring.filter((r) => r.active && r.type === 'expense');

  return (
    <WhiteCard
      ariaLabel={t.home.runwayTitle}
      className="flex flex-col justify-between space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-[var(--ink)]">
            {t.home.runwayTitle}
          </h2>
          <p className="text-xs text-[#6B7F7C] mt-0.5 truncate">
            <span style={{ color: paceColor.text }} className="font-medium">
              {t.home.paceLabels[runway.pace]}
            </span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              Pocket money in {runway.daysRemaining}d ({runway.nextAllowanceLabel})
            </span>
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          transition={SPRING_BOUNCY}
          onClick={() => {
            triggerHaptic(8);
            onEditCycle();
          }}
          className="min-h-[40px] px-3.5 rounded-full border border-[#0E2B2B]/12 hover:bg-[#DDEFE3]/50 text-xs font-medium text-[#0E2B2B] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <CalendarClock className="w-3.5 h-3.5 text-[#0B3B3A]" />
          <span>1st cycle</span>
        </motion.button>
      </div>

      {/* Semi-circle Arc Gauge in Sage & Teal */}
      <div className="flex flex-col items-center pt-1 pb-2">
        <div className="relative w-[244px] h-[132px] flex items-end justify-center">
          <svg
            width="244"
            height="130"
            viewBox="0 0 244 130"
            className="overflow-visible"
            aria-hidden="true"
          >
            <path
              d="M 24 118 A 98 98 0 0 1 220 118"
              fill="none"
              stroke={paceColor.track}
              strokeWidth="14"
              strokeLinecap="round"
            />
            <motion.path
              d="M 24 118 A 98 98 0 0 1 220 118"
              fill="none"
              stroke={paceColor.stroke}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={SPRING_GENTLE}
            />
          </svg>

          <div className="absolute bottom-0 px-3 flex flex-col items-center text-center">
            <span className="text-[11px] text-[#6B7F7C] whitespace-nowrap">
              {t.home.dailySafe}
            </span>
            <EditorialAmount
              valueCents={runway.dailySafeSpendCents}
              currency={currency}
              countUp
              className="font-display text-[36px] font-medium tracking-[-0.03em] text-[#0E2B2B] mt-1"
            />
            <span className="text-[11px] text-[#6B7F7C] mt-1">/ day</span>
          </div>
        </div>
      </div>

      {/* Clean 3-metric strip separated by hairline */}
      <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-[#0E2B2B]/[0.06]">
        <div>
          <p className="text-[11px] text-[#6B7F7C] truncate">{t.home.liquidCash}</p>
          <p className="text-sm font-medium text-[#0E2B2B] tabular-nums mt-0.5">
            {fmtINR(runway.liquidBalanceCents)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#6B7F7C] truncate">{t.home.upcomingBills}</p>
          <p className="text-sm font-medium text-[#0B3B3A] tabular-nums mt-0.5">
            {fmtINR(runway.upcomingBillsCents)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#6B7F7C] truncate">{t.home.spentCycle}</p>
          <p className="text-sm font-medium text-[#0E2B2B] tabular-nums mt-0.5">
            {fmtINR(runway.spentThisCycleCents)}
          </p>
        </div>
      </div>

      {/* Expandable upcoming recurring bills drawer */}
      {upcomingExpenses.length > 0 && (
        <div className="pt-2.5 border-t border-[#0E2B2B]/[0.06]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setShowBills((v) => !v);
            }}
            aria-expanded={showBills}
            className="w-full min-h-[40px] flex items-center justify-between text-xs font-medium text-[#0E2B2B] hover:text-[#0B3B3A] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0B3B3A]" />
              <span>{upcomingExpenses.length} fixed bills protected</span>
            </span>
            {showBills ? <ChevronUp className="w-4 h-4 text-[#6B7F7C]" /> : <ChevronDown className="w-4 h-4 text-[#6B7F7C]" />}
          </button>

          <AnimatePresence initial={false}>
            {showBills && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING_GENTLE}
                className="overflow-hidden space-y-1.5 pt-2"
              >
                {upcomingExpenses.map((bill) => (
                  <li
                    key={bill.id}
                    className="flex items-center justify-between text-xs py-2.5 px-3 rounded-2xl bg-[#F4F7F4]"
                  >
                    <div>
                      <span className="text-[#0E2B2B] font-medium">{bill.title}</span>
                      <span className="text-[#6B7F7C] ml-2 font-mono text-[11px]">
                        Due {formatDateDDMMM(bill.nextDueIso)}
                      </span>
                    </div>
                    <span className="font-medium text-[#0B3B3A] tabular-nums">
                      {fmtINR(bill.amountCents)}
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </WhiteCard>
  );
};
