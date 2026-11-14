import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { SPRING_BOUNCY, triggerHaptic } from '../shared/motion';

export interface SuccessCelebrationData {
  id: string;
  headline: string;
  subline: string;
  accentColor?: string;
}

interface SuccessCelebrationProps {
  data: SuccessCelebrationData | null;
  onDismiss: () => void;
}

const BURST_PARTICLES = [
  { angle: 0, color: '#0B3B3A', dist: 62 },
  { angle: 45, color: '#A9D6B8', dist: 68 },
  { angle: 90, color: '#E8B64C', dist: 58 },
  { angle: 135, color: '#6B7F7C', dist: 66 },
  { angle: 180, color: '#E26D5C', dist: 60 },
  { angle: 225, color: '#A9D6B8', dist: 68 },
  { angle: 270, color: '#0B3B3A', dist: 58 },
  { angle: 315, color: '#E8B64C', dist: 64 },
];

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  data,
  onDismiss,
}) => {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!data) return;
    triggerHaptic([14, 30, 16]);
    if (!prefersReduced) {
      try {
        confetti({
          particleCount: 45,
          spread: 68,
          origin: { y: 0.55 },
          colors: ['#0B3B3A', '#A9D6B8', '#E8B64C', '#DDEFE3', '#E26D5C'],
        });
      } catch {
        // Ignore headless canvas errors
      }
    }
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [data, onDismiss, prefersReduced]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key={data.id}
          data-testid="success-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[70] bg-[#0E2B2B]/35 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ scale: 0.86, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={SPRING_BOUNCY}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-[30px] bg-white p-7 text-center flex flex-col items-center gap-4 shadow-[0_24px_60px_-18px_rgba(14,43,43,0.3)] overflow-hidden"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              {!prefersReduced &&
                BURST_PARTICLES.map((p, idx) => {
                  const rad = (p.angle * Math.PI) / 180;
                  const tx = Math.cos(rad) * p.dist;
                  const ty = Math.sin(rad) * p.dist;
                  return (
                    <motion.span
                      key={idx}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{ x: tx, y: ty, scale: [0, 1.2, 0], opacity: [1, 1, 0] }}
                      transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                      style={{ backgroundColor: p.color }}
                      className="absolute w-2.5 h-2.5 rounded-full"
                      aria-hidden="true"
                    />
                  );
                })}

              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: [0.5, 1.1, 1] }}
                transition={SPRING_BOUNCY}
                className="w-18 h-18 rounded-full bg-[#0B3B3A] flex items-center justify-center shadow-[0_14px_28px_-8px_rgba(11,59,58,0.45)]"
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M8 18.5L15 25.5L28 11.5"
                    stroke="#A9D6B8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
              </motion.div>
            </div>

            <div className="space-y-1">
              <h2 className="font-display text-2xl font-medium tracking-[-0.02em] text-[#0E2B2B]">
                {data.headline}
              </h2>
              <p className="text-sm text-[#6B7F7C]">{data.subline}</p>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              transition={SPRING_BOUNCY}
              onClick={onDismiss}
              className="min-h-[44px] px-6 rounded-full bg-[#DDEFE3] hover:bg-[#CBE5D4] text-xs font-medium text-[#0E2B2B] cursor-pointer"
            >
              Done
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
