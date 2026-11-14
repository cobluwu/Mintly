import type { Transition, Variants } from 'motion/react';

export const SPRING_BOUNCY: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 26,
  mass: 0.85,
};

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.8,
};

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
  mass: 1,
};

export const SPRING_CARD_FLIP: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 22,
  mass: 0.95,
};

export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_BOUNCY,
  },
};

export function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore blocked vibration contexts
    }
  }
}
