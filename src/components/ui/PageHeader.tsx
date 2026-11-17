import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { SegmentedToggle, type SegmentedOption } from './SegmentedToggle';
import { MochiMascot, type MochiPoseMood } from '../brand/MochiMascot';
import { SPRING_BOUNCY, triggerHaptic } from '../../shared/motion';

interface PageHeaderProps<T extends string> {
  title: string;
  subtitle: string;
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  mochiMood?: MochiPoseMood;
  mochiAccessory?: string | null;
  onAvatarClick: () => void;
  avatarLabel?: string;
  rightAction?: React.ReactNode;
  titleRightAction?: React.ReactNode;
  enableStickyCollapse?: boolean;
  /** Optional scroll threshold (px) before compact sticky bar appears */
  collapseThreshold?: number;
}

/**
 * Shared PageHeader matching Home's exact header grammar:
 * 1) Top row: frosted SegmentedToggle left + optional rightAction + circular Mochi avatar right
 * 2) Editorial display heading (36-40px, weight 500, tracking -0.03em) + muted subtext
 * 3) On scroll past threshold, smoothly reveals a compact blurred sticky top bar.
 */
export function PageHeader<T extends string>({
  title,
  subtitle,
  options,
  value,
  onChange,
  layoutId,
  mochiMood = 'happy',
  mochiAccessory = null,
  onAvatarClick,
  avatarLabel = 'Open workspace settings',
  rightAction,
  titleRightAction,
  enableStickyCollapse = true,
  collapseThreshold = 96,
}: PageHeaderProps<T>) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enableStickyCollapse || typeof window === 'undefined') return;
    const onScroll = () => {
      const next = window.scrollY > collapseThreshold;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enableStickyCollapse, collapseThreshold]);

  return (
    <>
      {/* Compact Sticky Blurred Header Bar (compositor opacity/transform on scroll) */}
      {enableStickyCollapse && (
        <div
          aria-hidden={!scrolled}
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-32px)] max-w-[398px] transition-[opacity,transform] duration-200 ease-out ${
            scrolled
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-3 pointer-events-none'
          }`}
        >
          <div className="rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_14px_32px_-12px_rgba(14,43,43,0.18)] pl-4 pr-1.5 py-1.5 flex items-center justify-between gap-2">
            <span className="font-display text-sm font-medium tracking-[-0.02em] text-[var(--ink)] truncate">
              {title}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {rightAction}
              <button
                type="button"
                tabIndex={scrolled ? 0 : -1}
                onClick={() => {
                  triggerHaptic(8);
                  onAvatarClick();
                }}
                aria-label={avatarLabel}
                className="w-9 h-9 rounded-full bg-[var(--sage-100)] border border-white flex items-center justify-center overflow-hidden cursor-pointer"
              >
                <MochiMascot
                  mood={mochiMood}
                  accessory={mochiAccessory}
                  size={30}
                  interactive={false}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Row (identical to Home's TopScreenHeader) */}
      <header className="flex items-center justify-between gap-2 pt-1 pb-2">
        <div className="min-w-0 overflow-x-auto mintly-no-scrollbar">
          <SegmentedToggle
            options={options}
            value={value}
            onChange={onChange}
            layoutId={layoutId}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightAction}

          <motion.button
            type="button"
            whileTap={{ scale: 0.93 }}
            transition={SPRING_BOUNCY}
            onClick={() => {
              triggerHaptic(8);
              onAvatarClick();
            }}
            aria-label={avatarLabel}
            className="w-11 h-11 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_20px_-8px_rgba(14,43,43,0.22)] flex items-center justify-center overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--teal-900)]"
          >
            <MochiMascot
              mood={mochiMood}
              accessory={mochiAccessory}
              size={38}
              interactive={false}
            />
          </motion.button>
        </div>
      </header>

      {/* Large Editorial Display Heading + Optional Action + Muted 1-line Subtext */}
      <section className="space-y-1 pt-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[36px] sm:text-[40px] font-medium tracking-[-0.03em] leading-[1.08] text-[var(--ink)]">
            {title}
          </h1>
          {titleRightAction && <div className="shrink-0">{titleRightAction}</div>}
        </div>
        <p className="text-sm text-[var(--muted)]">{subtitle}</p>
      </section>
    </>
  );
}
