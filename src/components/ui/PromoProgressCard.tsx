import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { SPRING_BOUNCY, SPRING_GENTLE, triggerHaptic } from '../../shared/motion';

interface PromoProgressCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  progressLeft: string;
  progressRight: string;
  ratio: number;
  onAction: () => void;
  actionLabel?: string;
}

export const PromoProgressCard: React.FC<PromoProgressCardProps> = ({
  icon,
  title,
  description,
  progressLeft,
  progressRight,
  ratio,
  onAction,
  actionLabel = 'Open details',
}) => {
  const clamped = Math.max(0.04, Math.min(1, ratio));

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={SPRING_BOUNCY}
      className="mintly-white-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-full bg-[#DDEFE3] text-[#0E2B2B] flex items-center justify-center shrink-0"
          >
            {icon}
          </span>
          <h3 className="font-display text-lg font-medium tracking-[-0.02em] text-[#0E2B2B] truncate">
            {title}
          </h3>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={SPRING_BOUNCY}
          onClick={() => {
            triggerHaptic(8);
            onAction();
          }}
          aria-label={actionLabel}
          className="w-11 h-11 rounded-full border border-[#0E2B2B]/12 hover:bg-[#DDEFE3]/50 text-[#0E2B2B] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
        </motion.button>
      </div>

      <p className="text-[13px] leading-relaxed text-[#6B7F7C]">{description}</p>

      <div className="space-y-2 pt-0.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-medium text-[#0E2B2B] tabular-nums">{progressLeft}</span>
          <span className="text-[#6B7F7C] tabular-nums">{progressRight}</span>
        </div>

        <div className="h-2 w-full rounded-full bg-[#ECEFED] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(clamped * 100)}%` }}
            transition={SPRING_GENTLE}
            className="h-full rounded-full bg-gradient-to-r from-[#0B3B3A] to-[#6B9F87]"
          />
        </div>
      </div>
    </motion.article>
  );
};
