import React from 'react';
import { motion } from 'motion/react';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  noPadding?: boolean;
  divideY?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  as?: 'div' | 'section' | 'article';
  ariaLabel?: string;
}

/**
 * L1 Elevation: Frosted Glass Surface
 * White at 55%, backdrop-blur-xl, 1px white/50 border, soft long shadow.
 */
export const GlassCard: React.FC<CardProps & { variant?: 'card' | 'shell' }> = ({
  children,
  className = '',
  padded = true,
  noPadding = false,
  as: Tag = 'section',
  variant = 'card',
  ariaLabel,
}) => {
  const radiusClass = variant === 'shell' ? 'rounded-[30px]' : 'rounded-[24px]';
  const shouldPad = padded && !noPadding;
  const padClass = shouldPad ? (variant === 'shell' ? 'p-2.5' : 'p-5') : '';
  return (
    <Tag
      aria-label={ariaLabel}
      className={`mintly-elevation-l1 ${radiusClass} ${padClass} ${className}`}
    >
      {children}
    </Tag>
  );
};

/**
 * L2 Elevation: Solid White Card
 * 24px radius, subtle top inner highlight, layered soft shadow.
 */
export const WhiteCard: React.FC<CardProps> = ({
  children,
  className = '',
  padded = true,
  noPadding = false,
  divideY = false,
  interactive = false,
  onClick,
  as: Tag = 'section',
  ariaLabel,
}) => {
  const shouldPad = padded && !noPadding;
  const divideClass = divideY ? 'divide-y divide-[var(--hairline-soft)] overflow-hidden' : '';
  const baseClass = `mintly-elevation-l2 rounded-[24px] ${shouldPad ? 'p-5' : ''} ${divideClass} ${
    interactive || onClick ? 'transition-shadow hover:shadow-[0_20px_42px_-18px_rgba(14,43,43,0.16)]' : ''
  } ${className}`;

  if (onClick) {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        transition={SPRING_BOUNCY}
        aria-label={ariaLabel}
        onClick={() => {
          triggerHaptic(8);
          onClick();
        }}
        className={`${baseClass} w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--teal-900)]`}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <Tag aria-label={ariaLabel} className={baseClass}>
      {children}
    </Tag>
  );
};

/**
 * L3 Elevation: Deep Teal Feature Card
 * 28px radius, pixel-grid texture overlay, subtle radial glow, inner highlight line, soft shadow.
 */
export const TealFeatureCard: React.FC<
  CardProps & { showDotGrid?: boolean }
> = ({
  children,
  className = '',
  padded = true,
  noPadding = false,
  as: Tag = 'article',
  showDotGrid = true,
  ariaLabel,
}) => {
  const shouldPad = padded && !noPadding;
  return (
    <Tag
      aria-label={ariaLabel}
      className={`mintly-elevation-l3 rounded-[28px] text-white relative overflow-hidden ${
        shouldPad ? 'p-5' : ''
      } ${className}`}
    >
      {showDotGrid && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32 mintly-card-dot-grid opacity-75 pointer-events-none [mask-image:linear-gradient(180deg,black_15%,transparent_100%)]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-20 w-56 h-56 rounded-full bg-[var(--sage-300)]/12 blur-3xl pointer-events-none"
      />
      <div className="relative z-10">{children}</div>
    </Tag>
  );
};

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Shared SectionHeader: muted label left, underlined link (or slot) right.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  rightSlot,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 px-1 ${className}`}>
      <h2 className="text-sm font-medium text-[var(--muted)]">{title}</h2>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-[var(--ink)] underline underline-offset-4 hover:text-[var(--teal-900)] cursor-pointer min-h-[36px] inline-flex items-center"
        >
          {actionLabel}
        </button>
      ) : (
        rightSlot || null
      )}
    </div>
  );
};
