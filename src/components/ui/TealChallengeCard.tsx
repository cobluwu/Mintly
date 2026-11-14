import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { CurrencyCode } from '../../shared/types';
import { fmtINR } from '../../shared/finance';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';
import { EditorialAmount } from './EditorialAmount';

interface StreakDay {
  label: string;
  completed: boolean;
}

interface TealChallengeCardProps {
  title: string;
  spentCents: number;
  limitCents: number;
  currency: CurrencyCode;
  streakTitle?: string;
  days?: StreakDay[];
  ctaLabel?: string;
  onCtaClick: () => void;
  topIcon?: React.ReactNode;
  onTopIconClick?: () => void;
  topIconLabel?: string;
}

const DEFAULT_DAYS: StreakDay[] = [
  { label: 'M', completed: true },
  { label: 'T', completed: true },
  { label: 'W', completed: true },
  { label: 'T', completed: true },
  { label: 'F', completed: true },
  { label: 'S', completed: false },
  { label: 'S', completed: false },
];

export const TealChallengeCard: React.FC<TealChallengeCardProps> = ({
  title,
  spentCents,
  limitCents,
  currency,
  streakTitle = 'Day 5 of 7',
  days = DEFAULT_DAYS,
  ctaLabel = 'View Plan Details',
  onCtaClick,
  topIcon,
  onTopIconClick,
  topIconLabel = 'Open challenge details',
}) => {
  const safeLimit = Math.max(100, limitCents);
  const ratio = Math.max(0, Math.min(1, spentCents / safeLimit));
  const remainingCents = Math.max(0, safeLimit - spentCents);
  const segmentCount = 8;
  const pinLeftPercent = Math.max(8, Math.min(94, Math.round(ratio * 100)));

  return (
    <article className="mintly-teal-card p-5 text-white space-y-5 relative overflow-hidden">
      {/* Subtle deep-teal atmospheric highlight */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-20 w-56 h-56 rounded-full bg-[#A9D6B8]/10 blur-3xl pointer-events-none"
      />

      {/* Top Row: Title + Circular Outlined Button */}
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-white/80">{title}</p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={SPRING_BOUNCY}
          onClick={() => {
            triggerHaptic(8);
            (onTopIconClick || onCtaClick)();
          }}
          aria-label={topIconLabel}
          className="w-11 h-11 rounded-full border border-white/18 bg-white/[0.04] hover:bg-white/[0.1] text-white/90 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          {topIcon || (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3.8L19.2 8V16L12 20.2L4.8 16V8L12 3.8Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Hero Spent Readout */}
      <div className="relative space-y-1">
        <EditorialAmount
          valueCents={spentCents}
          currency={currency}
          className="font-display text-[40px] font-medium tracking-[-0.03em] text-white"
        />
        <p className="text-[13px] text-white/70">
          Spent of{' '}
          <span className="font-semibold text-white tabular-nums">
            {fmtINR(safeLimit)}
          </span>{' '}
          spend limit
        </p>
      </div>

      {/* Segmented Block Bar with Marker Pin */}
      <div className="relative pt-4 pb-1 space-y-2.5">
        <div className="relative">
          {/* Position Pin */}
          <motion.div
            initial={{ left: '8%' }}
            animate={{ left: `${pinLeftPercent}%` }}
            transition={SPRING_BOUNCY}
            aria-hidden="true"
            className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
            <span className="w-[2px] h-11 bg-white rounded-full" />
          </motion.div>

          {/* Continuous Track + Glowing Gradient Ending at Pin + Segment Dividers */}
          <div className="relative h-8 rounded-lg overflow-hidden bg-white/[0.08]">
            <motion.div
              initial={{ width: '8%' }}
              animate={{ width: `${pinLeftPercent}%` }}
              transition={SPRING_BOUNCY}
              style={{
                background:
                  'linear-gradient(90deg, rgba(29,84,81,0.55) 0%, rgba(169,214,184,0.65) 70%, rgba(255,255,255,0.92) 100%)',
              }}
              className="absolute inset-y-0 left-0 shadow-[0_0_16px_rgba(255,255,255,0.35)]"
            />
            <div
              aria-hidden="true"
              className="relative z-10 grid grid-cols-8 h-full pointer-events-none"
            >
              {Array.from({ length: segmentCount }).map((_, idx) => (
                <div
                  key={idx}
                  className={idx < segmentCount - 1 ? 'border-r-[3px] border-[#0B3B3A]/85' : ''}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-white/75 tabular-nums">
          <span className="font-semibold text-white">
            {fmtINR(remainingCents)}
          </span>{' '}
          remaining
        </p>
      </div>

      {/* Nested White Streak Mini Card */}
      <div className="bg-white rounded-[20px] p-4 text-[#0E2B2B] space-y-3 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)]">
        <p className="text-center text-[13px] font-medium text-[#0E2B2B]">
          {streakTitle}
        </p>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {days.map((d, i) => (
            <div key={`${d.label}-${i}`} className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#6B7F7C]">{d.label}</span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  d.completed
                    ? 'bg-[#A9D6B8] text-[#0E2B2B]'
                    : 'bg-[#E8ECE9] text-transparent'
                }`}
              >
                {d.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full-width Sage Pill CTA */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={SPRING_BOUNCY}
        onClick={() => {
          triggerHaptic(10);
          onCtaClick();
        }}
        className="w-full min-h-[48px] rounded-full bg-[#A9D6B8] hover:bg-[#99CCA9] text-[#0E2B2B] text-sm font-medium cursor-pointer transition-colors"
      >
        {ctaLabel}
      </motion.button>
    </article>
  );
};
