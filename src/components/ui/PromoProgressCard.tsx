import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { SPRING_BOUNCY, SPRING_GENTLE, triggerHaptic } from '../../shared/motion';
import { WhiteCard } from './Surfaces';
import { IconBadge } from './IconBadge';

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
    <WhiteCard interactive className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconBadge icon={icon} tone="sage" size="sm" shape="circle" />
          <h3 className="font-display text-lg font-medium tracking-[-0.02em] text-[var(--ink)] line-clamp-2">
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
          className="w-11 h-11 rounded-full border border-[var(--ink)]/12 hover:bg-[var(--sage-100)]/50 text-[var(--ink)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
        </motion.button>
      </div>

      <p className="text-[13px] leading-relaxed text-[var(--muted)]">{description}</p>

      <div className="space-y-2 pt-0.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-medium text-[var(--ink)] tabular-nums">{progressLeft}</span>
          <span className="text-[var(--muted)] tabular-nums">{progressRight}</span>
        </div>

        <div className="h-2 w-full rounded-full bg-[var(--surface-track)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(clamped * 100)}%` }}
            transition={SPRING_GENTLE}
            className="h-full rounded-full bg-gradient-to-r from-[var(--teal-900)] to-[#6B9F87]"
          />
        </div>
      </div>
    </WhiteCard>
  );
};
