import React from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../../shared/motion';

export type NavTabKey = 'home' | 'activity' | 'plans' | 'circles' | 'coach';

interface FloatingBottomNavProps {
  activeTab: NavTabKey;
  onSelectTab: (tab: NavTabKey) => void;
  labels: Record<NavTabKey, string>;
}

const NavLineIcon: React.FC<{ tab: NavTabKey; active: boolean }> = ({
  tab,
  active,
}) => {
  const strokeColor = active ? '#0E2B2B' : '#FFFFFF';
  const common = {
    stroke: strokeColor,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (tab) {
    case 'home':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 10.5L12 4.5L19.5 10.5V18.5C19.5 19.3 18.8 20 18 20H6C5.2 20 4.5 19.3 4.5 18.5V10.5Z"
            {...common}
          />
          <path d="M9.5 15.2H14.5" {...common} />
        </svg>
      );
    case 'activity':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="4.5" width="16" height="15" rx="4" {...common} />
          <path d="M7.5 13L10.3 10.2L13.1 13L16.5 9.4" {...common} />
        </svg>
      );
    case 'plans':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.8L19.2 8V16L12 20.2L4.8 16V8L12 3.8Z"
            {...common}
          />
          <circle cx="12" cy="12" r="2.7" {...common} />
        </svg>
      );
    case 'circles':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.5" y="6" width="17" height="12" rx="3" {...common} />
          <path d="M3.5 10.2H20.5" {...common} />
          <path d="M7.5 14.5H11" {...common} />
        </svg>
      );
    case 'coach':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6.5 18.5C5.1 17.1 4.2 15.1 4.2 12.8C4.2 8.2 7.7 4.8 12 4.8C16.3 4.8 19.8 8.2 19.8 12.8C19.8 17.4 16.3 20 12 20C10.5 20 9.1 19.6 7.9 19L5.2 19.7L6.5 18.5Z"
            {...common}
          />
          <path d="M9.5 11.2V11.3M14.5 11.2V11.3" strokeWidth="2.2" strokeLinecap="round" stroke={strokeColor} />
          <path d="M9.8 14.2C10.8 15.1 13.2 15.1 14.2 14.2" {...common} />
        </svg>
      );
  }
};

const TAB_ORDER: NavTabKey[] = ['home', 'activity', 'plans', 'circles', 'coach'];

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onSelectTab,
  labels,
}) => {
  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-auto flex items-center justify-evenly gap-1 w-full max-w-[390px] p-1.5 rounded-full bg-[#0E2B2B]/[0.18] backdrop-blur-2xl border border-white/45 shadow-[0_20px_44px_-14px_rgba(14,43,43,0.28),inset_0_1px_0_rgba(255,255,255,0.5)]"
    >
      {TAB_ORDER.map((tab) => {
        const active = activeTab === tab;
        const isCoach = tab === 'coach';
        const label = isCoach ? `Ask ${labels[tab]}` : labels[tab];

        return (
          <motion.button
            key={tab}
            type="button"
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => {
              triggerHaptic(8);
              onSelectTab(tab);
            }}
            aria-label={labels[tab]}
            aria-current={active ? 'page' : undefined}
            className={`relative min-h-[44px] min-w-[44px] h-11 px-1 rounded-full flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0B3B3A] transition-colors duration-150 ${
              active
                ? 'bg-white/38 border border-white/65 shadow-[0_8px_24px_-6px_rgba(255,255,255,0.65)]'
                : 'bg-white/15 hover:bg-white/28 border border-white/20'
            }`}
          >
            <motion.span
              aria-hidden={!active}
              initial={false}
              animate={{
                width: active ? 'auto' : 0,
                opacity: active ? 1 : 0,
              }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center overflow-hidden shrink-0"
            >
              <span
                className={`whitespace-nowrap font-medium text-[#0E2B2B] select-none ${
                  isCoach ? 'pl-2 pr-1.5 text-[12.5px]' : 'pl-2.5 pr-1.5 text-[13px]'
                }`}
              >
                {label}
              </span>
            </motion.span>

            <span
              className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-colors duration-150 ${
                active
                  ? 'bg-white shadow-[0_4px_16px_rgba(255,255,255,0.9),0_4px_12px_rgba(14,43,43,0.12)]'
                  : ''
              }`}
            >
              <NavLineIcon tab={tab} active={active} />
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
};
