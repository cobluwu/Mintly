import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { SPRING_BOUNCY, triggerHaptic } from '../shared/motion';

interface SlideToConfirmProps {
  label: string;
  disabled?: boolean;
  accentColor?: string;
  onConfirm: () => void;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  disabled = false,
  accentColor = '#0B3B3A',
  onConfirm,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const x = useMotionValue(0);

  const labelOpacity = useTransform(x, [0, 140], [1, 0.15]);

  const getMaxTravel = () => {
    const width = trackRef.current?.getBoundingClientRect().width ?? 300;
    return Math.max(120, width - 60);
  };

  const completeSlide = () => {
    if (disabled || confirmed) return;
    setConfirmed(true);
    triggerHaptic([12, 24, 18]);
    onConfirm();
    setTimeout(() => {
      x.set(0);
      setConfirmed(false);
    }, 350);
  };

  return (
    <div
      ref={trackRef}
      data-testid="slide-to-confirm"
      className={`relative h-[58px] w-full rounded-full p-1.5 flex items-center select-none overflow-hidden transition-opacity bg-[#DDEFE3]/75 border border-[#0E2B2B]/10 ${
        disabled ? 'opacity-45 cursor-not-allowed' : ''
      }`}
    >
      <motion.span
        style={{ opacity: labelOpacity }}
        className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[#0E2B2B] pointer-events-none pl-8"
      >
        {label}
      </motion.span>

      <motion.button
        type="button"
        disabled={disabled}
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: getMaxTravel() }}
        dragElastic={0.05}
        dragSnapToOrigin={!confirmed}
        style={{ x, backgroundColor: accentColor }}
        whileTap={disabled ? undefined : { scale: 0.94 }}
        transition={SPRING_BOUNCY}
        onDragEnd={(_, info) => {
          const threshold = getMaxTravel() * 0.72;
          if (info.offset.x >= threshold) {
            completeSlide();
          } else {
            x.set(0);
          }
        }}
        onClick={completeSlide}
        aria-label={label}
        className="relative z-10 h-11 w-11 rounded-full text-white flex items-center justify-center shadow-[0_8px_18px_-4px_rgba(11,59,58,0.45)] cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[#0B3B3A]"
      >
        {confirmed ? (
          <Check className="w-5 h-5 stroke-[2.5]" />
        ) : (
          <ArrowRight className="w-5 h-5 stroke-[2.25]" />
        )}
      </motion.button>
    </div>
  );
};
