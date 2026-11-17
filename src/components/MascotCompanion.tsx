import React, { useMemo, useState } from 'react';
import { Lottie } from 'lottie-react';
import { motion } from 'motion/react';
import type { MascotMood } from '../shared/types';
import { buildMochiLottieData } from '../shared/mascotLottie';

export type { MascotMood };

interface MascotCompanionProps {
  mood?: MascotMood;
  size?: number;
  message?: string;
  triggerLabel?: string;
  onTap?: () => void;
  className?: string;
}

const MOOD_ACCENT: Record<MascotMood, string> = {
  happy: 'border-[var(--sage-300)]/60',
  celebrate: 'border-[var(--amber)]/65',
  caution: 'border-[var(--coral)]/65',
  coach: 'border-[var(--teal-800)]/45',
};

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  mood = 'happy',
  size = 64,
  message,
  triggerLabel,
  onTap,
  className = '',
}) => {
  const [bounces, setBounces] = useState(0);

  const lottieData = useMemo(() => buildMochiLottieData(mood), [mood]);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const handlePress = () => {
    setBounces((b) => b + 1);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
    onTap?.();
  };

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <motion.button
        type="button"
        onClick={handlePress}
        data-testid="mochi-mascot"
        data-mascot-mood={mood}
        aria-label={`Interact with Mochi mascot (${mood})`}
        animate={{
          scale: bounces > 0 ? [1, 1.09, 0.95, 1] : 1,
          rotate: bounces > 0 ? [0, -5, 5, 0] : 0,
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ width: size, height: size }}
        className={`relative shrink-0 rounded-2xl overflow-hidden bg-white/80 dark:bg-[var(--teal-900)] border ${MOOD_ACCENT[mood]} focus-visible:outline-2 focus-visible:outline-[var(--teal-900)] cursor-pointer flex items-center justify-center shadow-sm`}
      >
        <Lottie
          key={mood}
          src={lottieData}
          loop={!prefersReduced}
          autoplay={!prefersReduced}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      </motion.button>

      {(message || triggerLabel) && (
        <div className="min-w-0">
          {message && <p className="text-sm text-[var(--ink)] leading-snug">{message}</p>}
          {triggerLabel && (
            <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5 truncate">
              {triggerLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
