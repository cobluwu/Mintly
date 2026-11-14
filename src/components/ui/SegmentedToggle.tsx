import React from 'react';
import { motion } from 'motion/react';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  ariaLabel?: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  ariaLabel = 'View switcher',
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center p-1 rounded-full bg-[#0E2B2B]/[0.08] backdrop-blur-xl border border-white/55 shadow-[inset_0_1px_2px_rgba(14,43,43,0.06)]"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            whileTap={{ scale: 0.96 }}
            transition={SPRING_BOUNCY}
            onClick={() => {
              if (!active) {
                triggerHaptic(8);
                onChange(opt.value);
              }
            }}
            className={`relative min-h-[36px] px-4 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0B3B3A] ${
              active
                ? 'text-[#0E2B2B]'
                : 'text-[#6B7F7C] hover:text-[#0E2B2B]'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_BOUNCY}
                className="absolute inset-0 rounded-full bg-white shadow-[0_6px_16px_-6px_rgba(14,43,43,0.22)]"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
