import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SPRING_BOUNCY } from '../../shared/motion';

export type LogoConcept = 'A' | 'B' | 'C';

/**
 * Swap this single constant to change the app-wide Mintly logo concept ('A' | 'B' | 'C').
 */
export const DEFAULT_LOGO_CONCEPT: LogoConcept = 'A';

export const LOGO_CONCEPT_META: Record<
  LogoConcept,
  { title: string; subtitle: string }
> = {
  A: {
    title: 'Concept A · Leaf-Coin',
    subtitle: 'Playful mint leaf cradling a sage-cream coin',
  },
  B: {
    title: 'Concept B · Monogram M',
    subtitle: 'Chunky rounded M sculpted from twin sprout strokes',
  },
  C: {
    title: 'Concept C · Mint Swirl',
    subtitle: 'Abstract dual-ribbon swirl balancing leaf and coin',
  },
};

interface LogomarkProps {
  concept?: LogoConcept;
  size?: number;
  animateOnLoad?: boolean;
  className?: string;
}

export const MintlyLogomark: React.FC<LogomarkProps> = ({
  concept = DEFAULT_LOGO_CONCEPT,
  size = 32,
  animateOnLoad = true,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      role="img"
      aria-label={`Mintly logo mark (${LOGO_CONCEPT_META[concept].title})`}
      className={`shrink-0 overflow-visible ${className}`}
    >
      {concept === 'A' && (
        <>
          {/* Fresh mint leaf cradling the coin */}
          <motion.path
            d="M7 26C6.5 14.5 13.5 6.5 28.5 6C29.5 19.5 22.5 28.5 9.5 29C8.2 29 7.1 27.6 7 26Z"
            fill="var(--mintly-mint, #34D399)"
            style={{ transformOrigin: '9px 27px' }}
            initial={animateOnLoad ? { scale: 0.7, rotate: -14, opacity: 0.4 } : false}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={SPRING_BOUNCY}
          />
          {/* Leaf inner vein */}
          <path
            d="M10.5 26C14 21 19 15.5 25 11.5"
            stroke="#09291E"
            strokeOpacity="0.32"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Glossy sage coin nested on leaf */}
          <motion.circle
            cx="21.5"
            cy="21.5"
            r="9.5"
            fill="var(--sage-300, #A9D6B8)"
            stroke="#090B0E"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            initial={animateOnLoad ? { scale: 0.6, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_BOUNCY, delay: 0.08 }}
          />
          {/* Inner stamped coin rim + specular coin shine */}
          <motion.circle
            cx="21.5"
            cy="21.5"
            r="6"
            stroke="#090B0E"
            strokeOpacity="0.24"
            strokeWidth="1.6"
            strokeDasharray="24 8"
            initial={animateOnLoad ? { rotate: -40, opacity: 0 } : false}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            style={{ transformOrigin: '21.5px 21.5px' }}
          />
          <motion.path
            d="M19 21.5L21.5 18.8L24 21.5L21.5 24.2Z"
            fill="#090B0E"
            fillOpacity="0.82"
            initial={animateOnLoad ? { scale: 0.4, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_BOUNCY, delay: 0.16 }}
            style={{ transformOrigin: '21.5px 21.5px' }}
          />
        </>
      )}

      {concept === 'B' && (
        <>
          <motion.rect
            x="3"
            y="3"
            width="30"
            height="30"
            rx="11"
            fill="var(--sage-300, #A9D6B8)"
            initial={animateOnLoad ? { scale: 0.78, rotate: -8 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING_BOUNCY}
          />
          {/* Chunky rounded M monogram */}
          <motion.path
            d="M10 25V13.5C10 11.8 12.1 11.1 13.2 12.4L18 18.2L22.8 12.4C23.9 11.1 26 11.8 26 13.5V25"
            stroke="#090B0E"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animateOnLoad ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.42, delay: 0.08 }}
          />
          {/* Mint dot accent */}
          <circle cx="18" cy="10.2" r="2.2" fill="var(--mintly-mint, #34D399)" />
        </>
      )}

      {concept === 'C' && (
        <>
          {/* Outer mint swirl crescent */}
          <motion.path
            d="M18 4C10.3 4 4 10.3 4 18C4 25.7 10.3 32 18 32C22.4 32 26.3 30 28.9 26.8C24.5 27.6 19.6 25.2 17.5 20.7C15.2 15.8 17.5 9.8 22.8 7.5C24.9 6.6 27.1 6.5 29.1 7.1C26.3 5.1 22.3 4 18 4Z"
            fill="var(--mintly-mint, #34D399)"
            style={{ transformOrigin: '18px 18px' }}
            initial={animateOnLoad ? { rotate: -35, scale: 0.75 } : false}
            animate={{ rotate: 0, scale: 1 }}
            transition={SPRING_BOUNCY}
          />
          {/* Inner sage orbital coin */}
          <motion.circle
            cx="23.5"
            cy="16.5"
            r="7.2"
            fill="var(--sage-300, #A9D6B8)"
            initial={animateOnLoad ? { scale: 0.4, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRING_BOUNCY, delay: 0.1 }}
          />
          <circle cx="25.5" cy="14.5" r="1.8" fill="#FFFFFF" fillOpacity="0.6" />
        </>
      )}
    </svg>
  );
};

export const MintlyWordmark: React.FC<{
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}> = ({ tone = 'dark', size = 'md' }) => {
  const sizeClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
        ? 'text-3xl sm:text-4xl'
        : 'text-xl';

  return (
    <span
      className={`font-display font-extrabold tracking-tight leading-none whitespace-nowrap ${sizeClass} ${
        tone === 'light' ? 'text-[#090B0E]' : 'text-[#F8FAFC]'
      }`}
    >
      Mintly
    </span>
  );
};

export const MintlyLogoLockup: React.FC<{
  concept?: LogoConcept;
  tone?: 'dark' | 'light';
  compact?: boolean;
  onTap?: () => void;
}> = ({
  concept = DEFAULT_LOGO_CONCEPT,
  tone = 'dark',
  compact = false,
  onTap,
}) => {
  const [tapCount, setTapCount] = useState(0);

  return (
    <motion.button
      type="button"
      onClick={() => {
        setTapCount((c) => c + 1);
        onTap?.();
      }}
      whileTap={{ scale: 0.92 }}
      animate={tapCount > 0 ? { scale: [1, 1.08, 0.97, 1] } : undefined}
      transition={SPRING_BOUNCY}
      className="inline-flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--teal-900)] rounded-full px-1 py-0.5"
    >
      <MintlyLogomark concept={concept} size={compact ? 26 : 32} />
      <MintlyWordmark tone={tone} size={compact ? 'sm' : 'md'} />
    </motion.button>
  );
};

export const MintlyAppIcon: React.FC<{
  concept?: LogoConcept;
  size?: number;
  tone?: 'dark' | 'light';
}> = ({ concept = DEFAULT_LOGO_CONCEPT, size = 72, tone = 'dark' }) => {
  const bg =
    tone === 'light'
      ? 'linear-gradient(145deg, #FFFFFF 0%, #ECFEFF 100%)'
      : 'linear-gradient(145deg, #1A2230 0%, #090B0E 100%)';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: bg,
        boxShadow:
          tone === 'light'
            ? '0 14px 28px -12px rgba(15, 23, 42, 0.22), inset 0 1px 0 rgba(255,255,255,0.9)'
            : '0 16px 32px -12px rgba(0, 0, 0, 0.78), inset 0 1.5px 0 rgba(255, 255, 255, 0.14)',
      }}
      className="flex items-center justify-center relative overflow-hidden shrink-0"
      role="img"
      aria-label={`Mintly app icon (${LOGO_CONCEPT_META[concept].title})`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 75% 20%, rgba(169, 214, 184, 0.34), transparent 62%)',
        }}
      />
      <MintlyLogomark concept={concept} size={Math.round(size * 0.58)} animateOnLoad={false} />
    </div>
  );
};

export const MintlySplashMark: React.FC<{
  concept?: LogoConcept;
  tone?: 'dark' | 'light';
}> = ({ concept = DEFAULT_LOGO_CONCEPT, tone = 'dark' }) => {
  const isLight = tone === 'light';
  return (
    <div
      className={`rounded-[28px] p-6 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden ${
        isLight
          ? 'bg-gradient-to-b from-[#F1F5F9] to-[#E2E8F0] text-[#090B0E]'
          : 'bg-gradient-to-b from-[#171C28] to-[#090B0E] text-white'
      }`}
      style={{
        boxShadow: isLight
          ? '0 14px 30px -16px rgba(15,23,42,0.2)'
          : '0 20px 40px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute -top-12 w-36 h-36 rounded-full blur-2xl pointer-events-none"
        style={{ background: 'rgba(169, 214, 184, 0.28)' }}
      />
      <MintlyAppIcon concept={concept} size={64} tone={tone} />
      <div>
        <MintlyWordmark tone={tone} size="lg" />
        <p
          className={`text-xs font-medium mt-1 ${
            isLight ? 'text-slate-600' : 'text-[#A1B0C4]'
          }`}
        >
          Your runway, sorted.
        </p>
      </div>
    </div>
  );
};
