import React from 'react';
import { motion } from 'motion/react';
import { AudioLines, Image as ImageIcon, Paperclip, Send } from 'lucide-react';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';
import { MochiMascot, type MochiPoseMood } from '../brand/MochiMascot';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  credits?: number;
  mochiMood?: MochiPoseMood;
  placeholder?: string;
  onUpgradeClick?: () => void;
  onAttachClick?: () => void;
  onVoiceClick?: () => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  onChange,
  onSubmit,
  credits = 76,
  mochiMood = 'happy',
  placeholder = 'Ask me anything...',
  onUpgradeClick,
  onAttachClick,
  onVoiceClick,
  disabled = false,
}) => {
  const totalBars = 10;
  const filledBars = Math.max(1, Math.min(totalBars, Math.round((credits / 100) * totalBars)));

  return (
    <div className="rounded-[28px] bg-white/50 backdrop-blur-2xl border border-white/60 p-2 shadow-[var(--shadow-glass)] space-y-2">
      {/* Credits Meter Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-[#6B7F7C]">
          <div className="flex items-center gap-[2.5px]" aria-hidden="true">
            {Array.from({ length: totalBars }).map((_, idx) => (
              <span
                key={idx}
                className={`w-[2.5px] h-2.5 rounded-full ${
                  idx < filledBars ? 'bg-[#0E2B2B]' : 'bg-[#0E2B2B]/18'
                }`}
              />
            ))}
          </div>
          <span className="tabular-nums">
            <strong className="font-semibold text-[#0E2B2B]">{credits}</strong> remaining credits
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic(8);
            onUpgradeClick?.();
          }}
          className="text-xs font-medium text-[#0E2B2B] hover:underline cursor-pointer min-h-[28px] px-1"
        >
          Upgrade
        </button>
      </div>

      {/* White Rounded Inner Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim() || disabled) return;
          triggerHaptic(10);
          onSubmit();
        }}
        className="rounded-[22px] bg-white p-3.5 shadow-[0_8px_22px_-10px_rgba(14,43,43,0.1)] space-y-3"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DDEFE3] via-[#A9D6B8] to-[#F3EFDC] flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] overflow-hidden"
          >
            <MochiMascot mood={mochiMood} size={28} interactive={false} />
          </span>

          <label className="flex-1 min-w-0">
            <span className="sr-only">Ask Mochi Coach</span>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-[#0E2B2B] placeholder:text-[#6B7F7C] focus:outline-none"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                onAttachClick?.();
              }}
              aria-label="Attach receipt or statement"
              className="min-h-[38px] min-w-[38px] rounded-xl hover:bg-[#DDEFE3]/45 text-[#6B7F7C] hover:text-[#0E2B2B] flex items-center justify-center cursor-pointer transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                onAttachClick?.();
              }}
              aria-label="Attach image"
              className="min-h-[38px] min-w-[38px] rounded-xl hover:bg-[#DDEFE3]/45 text-[#6B7F7C] hover:text-[#0E2B2B] flex items-center justify-center cursor-pointer transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                onVoiceClick?.();
              }}
              aria-label="Voice prompt"
              className="min-h-[40px] min-w-[40px] rounded-xl hover:bg-[#DDEFE3]/45 text-[#0E2B2B] flex items-center justify-center cursor-pointer transition-colors"
            >
              <AudioLines className="w-4 h-4" />
            </button>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.94 }}
              transition={SPRING_BOUNCY}
              disabled={!value.trim() || disabled}
              aria-label="Send message"
              className="w-10 h-10 rounded-[14px] bg-[#0B3B3A] hover:bg-[#14504D] disabled:opacity-45 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
};
