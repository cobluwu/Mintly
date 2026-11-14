import React from 'react';
import { motion } from 'motion/react';
import { SegmentedToggle, type SegmentedOption } from './SegmentedToggle';
import { MochiMascot, type MochiPoseMood } from '../brand/MochiMascot';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';

interface TopScreenHeaderProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  mochiMood?: MochiPoseMood;
  mochiAccessory?: string | null;
  onAvatarClick: () => void;
  avatarLabel?: string;
  limitRing?: {
    label: string;
    ratio: number;
    onClick: () => void;
  };
}

export function TopScreenHeader<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  mochiMood = 'happy',
  mochiAccessory = null,
  onAvatarClick,
  avatarLabel = 'Open workspace settings',
  limitRing,
}: TopScreenHeaderProps<T>) {
  const ringR = 11;
  const ringCirc = 2 * Math.PI * ringR;
  const ringRatio = Math.max(0.05, Math.min(1, limitRing?.ratio ?? 0.65));

  return (
    <header className="flex items-center justify-between gap-3 pt-1 pb-2">
      <SegmentedToggle
        options={options}
        value={value}
        onChange={onChange}
        layoutId={layoutId}
      />

      <div className="flex items-center gap-2 shrink-0">
        {limitRing && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={SPRING_BOUNCY}
            onClick={() => {
              triggerHaptic(8);
              limitRing.onClick();
            }}
            className="min-h-[44px] pl-3.5 pr-2.5 rounded-full bg-[#0E2B2B]/[0.1] backdrop-blur-xl border border-white/50 text-xs font-medium text-[#0E2B2B] inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{limitRing.label}</span>
            <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
              <circle
                cx="14"
                cy="14"
                r={ringR}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="3.2"
              />
              <circle
                cx="14"
                cy="14"
                r={ringR}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc * (1 - ringRatio)}
                transform="rotate(-90 14 14)"
              />
            </svg>
          </motion.button>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.93 }}
          transition={SPRING_BOUNCY}
          onClick={() => {
            triggerHaptic(8);
            onAvatarClick();
          }}
          aria-label={avatarLabel}
          className="w-11 h-11 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_20px_-8px_rgba(14,43,43,0.22)] flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0B3B3A]"
        >
          <MochiMascot mood={mochiMood} accessory={mochiAccessory} size={38} interactive={false} />
        </motion.button>
      </div>
    </header>
  );
}
