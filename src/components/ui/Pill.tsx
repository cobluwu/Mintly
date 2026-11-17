import React from 'react';
import { motion } from 'motion/react';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';

export type PillVariant =
  | 'sage'
  | 'sage-soft'
  | 'sageTint'
  | 'ink'
  | 'ghost'
  | 'glass'
  | 'danger'
  | 'white';
export type PillSize = 'sm' | 'md';

export type ChipVariant = 'sage' | 'coral' | 'amber' | 'teal' | 'neutral' | 'glass';

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  size?: PillSize;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  ariaLabel?: string;
  title?: string;
  type?: 'button' | 'submit';
}

const PILL_VARIANTS: Record<PillVariant, string> = {
  sage: 'bg-[var(--sage-300)] hover:bg-[#99CCA9] text-[var(--ink)]',
  'sage-soft': 'bg-[var(--sage-100)] hover:bg-[#CEE6D6] text-[var(--teal-900)]',
  sageTint: 'bg-[var(--sage-100)] hover:bg-[#CEE6D6] text-[var(--teal-900)]',
  ink: 'bg-[var(--teal-900)] hover:bg-[var(--teal-800)] text-white shadow-[0_8px_20px_-8px_rgba(11,59,58,0.4)]',
  ghost:
    'bg-transparent border border-[var(--ink)]/14 hover:bg-[var(--sage-100)]/50 text-[var(--ink)]',
  glass:
    'bg-white/65 hover:bg-white/90 backdrop-blur-xl border border-white/75 text-[var(--ink)] shadow-[0_8px_20px_-10px_rgba(14,43,43,0.14)]',
  danger: 'bg-[var(--coral-tint)] hover:bg-[#F3D5CF] text-[var(--coral-ink)]',
  white:
    'bg-white hover:bg-[#F4F7F4] text-[var(--ink)] border border-[var(--ink)]/10 shadow-[0_6px_16px_-8px_rgba(14,43,43,0.12)]',
};

const PILL_SIZES: Record<PillSize, string> = {
  sm: 'min-h-[34px] px-3 text-xs font-medium',
  md: 'min-h-[44px] px-4 text-[13px] font-medium',
};

export const Pill: React.FC<PillProps> = ({
  children,
  variant = 'sageTint',
  size = 'md',
  icon,
  fullWidth = false,
  onClick,
  disabled = false,
  className = '',
  ariaLabel,
  'aria-label': ariaLabelAttr,
  title,
  type = 'button',
}) => {
  const resolvedAriaLabel = ariaLabel ?? ariaLabelAttr;
  const baseClass = `rounded-full inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
    fullWidth ? 'w-full' : ''
  } ${PILL_VARIANTS[variant]} ${PILL_SIZES[size]} ${className}`;

  if (onClick || type === 'submit') {
    return (
      <motion.button
        type={type}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={SPRING_BOUNCY}
        disabled={disabled}
        aria-label={resolvedAriaLabel}
        title={title}
        onClick={() => {
          if (disabled) return;
          triggerHaptic(8);
          onClick?.();
        }}
        className={`${baseClass} cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-900)]`}
      >
        {icon && <span className="inline-flex items-center shrink-0">{icon}</span>}
        <span className="inline-flex items-center gap-1">{children}</span>
      </motion.button>
    );
  }

  return (
    <span aria-label={resolvedAriaLabel} title={title} className={baseClass}>
      {icon && <span className="inline-flex items-center shrink-0">{icon}</span>}
      <span className="inline-flex items-center gap-1">{children}</span>
    </span>
  );
};

interface ChipProps {
  label?: string;
  children?: React.ReactNode;
  variant?: ChipVariant;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
}

const CHIP_VARIANTS: Record<ChipVariant, string> = {
  sage: 'bg-[var(--sage-100)] text-[var(--teal-900)] border border-[var(--sage-300)]/45',
  coral: 'bg-[var(--coral-tint)] text-[var(--coral-ink)] border border-[var(--coral)]/25',
  amber: 'bg-[var(--amber-tint)] text-[var(--amber-ink)] border border-[var(--amber)]/35',
  teal: 'bg-[var(--teal-900)] text-white border border-transparent',
  neutral: 'bg-white/85 text-[var(--ink)] border border-[var(--ink)]/10',
  glass:
    'bg-white/60 backdrop-blur-md text-[var(--ink)] border border-white/75 shadow-[0_4px_12px_-6px_rgba(14,43,43,0.12)]',
};

export const Chip: React.FC<ChipProps> = ({
  label,
  children,
  variant = 'neutral',
  active = false,
  icon,
  onClick,
  title,
  className = '',
}) => {
  const content = children ?? label;

  if (onClick) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={SPRING_BOUNCY}
        aria-pressed={active}
        title={title}
        onClick={() => {
          triggerHaptic(6);
          onClick();
        }}
        className={`min-h-[38px] px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--teal-900)] ${
          active
            ? 'bg-[var(--teal-900)] text-white shadow-sm'
            : 'bg-white/80 hover:bg-white border border-[var(--ink)]/10 text-[var(--ink)]'
        } ${className}`}
      >
        {icon}
        <span>{content}</span>
      </motion.button>
    );
  }

  return (
    <span
      title={title}
      className={`rounded-full text-[11px] font-medium px-2.5 py-1 inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${CHIP_VARIANTS[variant]} ${className}`}
    >
      {icon}
      <span>{content}</span>
    </span>
  );
};
