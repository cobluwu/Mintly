import React from 'react';

export type MintlyIconName =
  | 'dining'
  | 'groceries'
  | 'fun'
  | 'transport'
  | 'subscriptions'
  | 'income'
  | 'split'
  | 'save'
  | 'expense'
  | 'bills'
  | 'vault'
  | 'macbook'
  | 'trip'
  | 'rent'
  | 'books'
  | 'gaming'
  | 'gym'
  | 'gift'
  | 'health'
  | 'coffee'
  | 'snacks'
  | 'nav-home'
  | 'nav-activity'
  | 'nav-plans'
  | 'nav-circles'
  | 'nav-coach';

export const ALL_MINTLY_ICONS: Array<{
  name: MintlyIconName;
  label: string;
  color: string;
}> = [
  { name: 'dining', label: 'Dining & Boba', color: 'var(--mintly-coral, #FF6B6B)' },
  { name: 'groceries', label: 'Groceries', color: 'var(--mintly-mint, #34D399)' },
  { name: 'fun', label: 'Campus Fun', color: '#FB923C' },
  { name: 'transport', label: 'Transit', color: 'var(--mintly-amber, #FFD166)' },
  { name: 'subscriptions', label: 'Subscriptions', color: 'var(--mintly-lilac, #A78BFA)' },
  { name: 'income', label: 'Income', color: 'var(--teal-900, #0B3B3A)' },
  { name: 'split', label: 'Split', color: 'var(--mintly-lilac, #8EA8B8)' },
  { name: 'save', label: 'Save', color: 'var(--mintly-amber, #E8B64C)' },
  { name: 'expense', label: 'Expense', color: 'var(--teal-900, #0B3B3A)' },
  { name: 'bills', label: 'Bills', color: 'var(--mintly-amber, #E8B64C)' },
  { name: 'vault', label: 'Vault', color: 'var(--mintly-mint, #6DC397)' },
  { name: 'macbook', label: 'MacBook Goal', color: 'var(--mintly-sky, #6BB4B2)' },
  { name: 'trip', label: 'Trip', color: 'var(--mintly-sky, #6BB4B2)' },
  { name: 'rent', label: 'Rent', color: 'var(--muted, #6B7F7C)' },
  { name: 'books', label: 'Books', color: 'var(--mintly-sky, #6BB4B2)' },
  { name: 'gaming', label: 'Gaming', color: 'var(--mintly-lilac, #8EA8B8)' },
  { name: 'gym', label: 'Gym', color: 'var(--mintly-mint, #6DC397)' },
  { name: 'gift', label: 'Gift', color: 'var(--mintly-coral, #E26D5C)' },
  { name: 'health', label: 'Health', color: 'var(--mintly-coral, #E26D5C)' },
  { name: 'coffee', label: 'Coffee', color: 'var(--mintly-amber, #E8B64C)' },
  { name: 'snacks', label: 'Snacks', color: 'var(--amber, #E8B64C)' },
  { name: 'nav-home', label: 'Nav Home', color: 'var(--teal-900, #0B3B3A)' },
  { name: 'nav-activity', label: 'Nav Activity', color: 'var(--mintly-sky, #6BB4B2)' },
  { name: 'nav-plans', label: 'Nav Plans', color: 'var(--mintly-amber, #E8B64C)' },
  { name: 'nav-circles', label: 'Nav Circles', color: 'var(--mintly-lilac, #8EA8B8)' },
  { name: 'nav-coach', label: 'Nav Coach', color: 'var(--mintly-mint, #6DC397)' },
];

interface IconProps {
  name: MintlyIconName;
  size?: number;
  color?: string;
  accentColor?: string;
  label?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  accentColor = 'var(--sage-300, #A9D6B8)',
  label,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 ${className}`}
    >
      {/* Dining & Coffee: Boba cup */}
      {name === 'dining' && (
        <>
          <path d="M7.5 8.5H16.5L15.2 20C15.1 20.6 14.6 21 14 21H10C9.4 21 8.9 20.6 8.8 20L7.5 8.5Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M6.5 8.5H17.5" />
          <path d="M12 8.5L14 3.5H16.5" />
          <circle cx="10.5" cy="17.5" r="0.9" fill={color} stroke="none" />
          <circle cx="13.5" cy="17.5" r="0.9" fill={color} stroke="none" />
          <circle cx="12" cy="15.2" r="0.9" fill={color} stroke="none" />
        </>
      )}

      {/* Groceries: Avocado */}
      {name === 'groceries' && (
        <>
          <path d="M12 3.5C9.2 3.5 6.5 9.2 6.5 14C6.5 17.8 9 20.5 12 20.5C15 20.5 17.5 17.8 17.5 14C17.5 9.2 14.8 3.5 12 3.5Z" fill={accentColor} fillOpacity="0.22" />
          <circle cx="12" cy="14.8" r="2.8" fill={color} fillOpacity="0.85" />
        </>
      )}

      {/* Campus Fun: Ticket */}
      {name === 'fun' && (
        <>
          <path d="M4 9C4 7.9 4.9 7 6 7H18C19.1 7 20 7.9 20 9V10.5C18.9 10.5 18 11.4 18 12.5C18 13.6 18.9 14.5 20 14.5V16C20 17.1 19.1 18 18 18H6C4.9 18 4 17.1 4 16V14.5C5.1 14.5 6 13.6 6 12.5C6 11.4 5.1 10.5 4 10.5V9Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M13 7.5V17.5" strokeDasharray="2 2.5" />
        </>
      )}

      {/* Transit: Tram */}
      {name === 'transport' && (
        <>
          <rect x="6" y="4.5" width="12" height="13.5" rx="3.5" fill={accentColor} fillOpacity="0.18" />
          <path d="M6 12H18" />
          <path d="M10 4.5H14" />
          <circle cx="9.2" cy="15" r="1" fill={color} stroke="none" />
          <circle cx="14.8" cy="15" r="1" fill={color} stroke="none" />
          <path d="M8.5 18L7 20.5M15.5 18L17 20.5" />
        </>
      )}

      {/* Subscriptions: Headphones */}
      {name === 'subscriptions' && (
        <>
          <path d="M4.5 14V12C4.5 7.8 7.9 4.5 12 4.5C16.1 4.5 19.5 7.8 19.5 12V14" />
          <rect x="4" y="13" width="3.8" height="6.5" rx="1.8" fill={accentColor} fillOpacity="0.28" />
          <rect x="16.2" y="13" width="3.8" height="6.5" rx="1.8" fill={accentColor} fillOpacity="0.28" />
        </>
      )}

      {/* Income: Coin arrow up-in */}
      {name === 'income' && (
        <>
          <circle cx="12" cy="12" r="8.5" fill={accentColor} fillOpacity="0.22" />
          <path d="M12 15.5V8.5M8.8 11.5L12 8.3L15.2 11.5" />
        </>
      )}

      {/* Split: Overlapping circle members */}
      {name === 'split' && (
        <>
          <circle cx="9.5" cy="10" r="3.2" fill={accentColor} fillOpacity="0.25" />
          <circle cx="15" cy="11" r="2.8" />
          <path d="M4.5 19C4.5 16.5 6.8 15 9.5 15C12.2 15 14.5 16.5 14.5 19" />
          <path d="M16 15.5C18 15.8 19.5 17 19.5 19" />
        </>
      )}

      {/* Save: Piggy coin drop */}
      {name === 'save' && (
        <>
          <rect x="5" y="9" width="14" height="11" rx="5" fill={accentColor} fillOpacity="0.22" />
          <path d="M12 3.5V7" />
          <circle cx="12" cy="5" r="2" fill={accentColor} stroke={color} />
          <path d="M9.5 12.5H14.5" />
        </>
      )}

      {/* Expense: Arrow out of rounded card */}
      {name === 'expense' && (
        <>
          <rect x="4" y="6.5" width="16" height="12.5" rx="3.2" fill={accentColor} fillOpacity="0.18" />
          <path d="M9 14L15 9M15 9H11M15 9V13" />
        </>
      )}

      {/* Bills: Receipt with notch */}
      {name === 'bills' && (
        <>
          <path d="M6.5 4H17.5V20L15 18.2L12 20L9 18.2L6.5 20V4Z" fill={accentColor} fillOpacity="0.18" />
          <path d="M9.5 9H14.5M9.5 13H13" />
        </>
      )}

      {/* Vault: Safe door */}
      {name === 'vault' && (
        <>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" fill={accentColor} fillOpacity="0.2" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 8.8V12L14 13.5" />
        </>
      )}

      {/* MacBook goal */}
      {name === 'macbook' && (
        <>
          <rect x="5" y="5.5" width="14" height="9.5" rx="2" fill={accentColor} fillOpacity="0.22" />
          <path d="M3.5 18H20.5" />
        </>
      )}

      {/* Trip: Paper plane / flight */}
      {name === 'trip' && (
        <>
          <path d="M20 4.5L3.8 11.2L10.3 13.8L12.8 20.2L20 4.5Z" fill={accentColor} fillOpacity="0.22" />
          <path d="M10.3 13.8L15 9" />
        </>
      )}

      {/* Rent: Cozy house */}
      {name === 'rent' && (
        <>
          <path d="M4.5 11L12 4.5L19.5 11V19C19.5 19.6 19 20 18.5 20H5.5C5 20 4.5 19.6 4.5 19V11Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M9.5 20V14.5H14.5V20" />
        </>
      )}

      {/* Books: Open textbook */}
      {name === 'books' && (
        <>
          <path d="M4 6.5C6.5 5.5 9.5 5.8 12 7.5V19C9.5 17.5 6.5 17.2 4 18V6.5Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M20 6.5C17.5 5.5 14.5 5.8 12 7.5V19C14.5 17.5 17.5 17.2 20 18V6.5Z" />
        </>
      )}

      {/* Gaming: Rounded controller */}
      {name === 'gaming' && (
        <>
          <path d="M6.5 8.5H17.5C19.2 8.5 20.5 10.2 20.2 12.2L19.3 16.8C19 18 17.6 18.6 16.6 17.8L14.5 16H9.5L7.4 17.8C6.4 18.6 5 18 4.7 16.8L3.8 12.2C3.5 10.2 4.8 8.5 6.5 8.5Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M8.5 11.5V14M7.2 12.8H9.8" />
          <circle cx="15.5" cy="12" r="0.8" fill={color} stroke="none" />
          <circle cx="17" cy="13.5" r="0.8" fill={color} stroke="none" />
        </>
      )}

      {/* Gym: Dumbbell */}
      {name === 'gym' && (
        <>
          <path d="M6.5 9.5V14.5M17.5 9.5V14.5" />
          <rect x="4" y="10" width="2.5" height="4" rx="1" fill={accentColor} />
          <rect x="17.5" y="10" width="2.5" height="4" rx="1" fill={accentColor} />
          <path d="M6.5 12H17.5" />
        </>
      )}

      {/* Gift */}
      {name === 'gift' && (
        <>
          <rect x="4.5" y="9" width="15" height="10.5" rx="2.5" fill={accentColor} fillOpacity="0.2" />
          <path d="M4.5 12.5H19.5M12 9V19.5" />
          <path d="M12 9C10 9 8 7.6 8.5 6C9 4.5 11.5 6 12 9ZM12 9C14 9 16 7.6 15.5 6C15 4.5 12.5 6 12 9Z" />
        </>
      )}

      {/* Health: Heart + pulse */}
      {name === 'health' && (
        <>
          <path d="M12 19.5C12 19.5 4.5 14.8 4.5 9.5C4.5 6.8 6.6 4.8 9 4.8C10.5 4.8 11.5 5.6 12 6.6C12.5 5.6 13.5 4.8 15 4.8C17.4 4.8 19.5 6.8 19.5 9.5C19.5 14.8 12 19.5 12 19.5Z" fill={accentColor} fillOpacity="0.22" />
          <path d="M12 9.5V14M9.8 11.8H14.2" />
        </>
      )}

      {/* Coffee: Steaming mug */}
      {name === 'coffee' && (
        <>
          <path d="M5 10H15.5V15.5C15.5 17.7 13.7 19.5 11.5 19.5H9C6.8 19.5 5 17.7 5 15.5V10Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M15.5 11.2H17.5C18.6 11.2 19.5 12.1 19.5 13.2C19.5 14.3 18.6 15.2 17.5 15.2H15.5" />
          <path d="M8.5 5.5C8.5 6.5 9.2 7 9.2 7.8M12 5.5C12 6.5 12.7 7 12.7 7.8" />
        </>
      )}

      {/* Snacks: Chunky Cookie */}
      {name === 'snacks' && (
        <>
          <path d="M12 4C7.6 4 4 7.6 4 12C4 16.4 7.6 20 12 20C16.4 20 20 16.4 20 12C17.5 12 16 10.5 16 8C14 8 12 6.5 12 4Z" fill={accentColor} fillOpacity="0.22" />
          <circle cx="9" cy="11" r="1" fill={color} stroke="none" />
          <circle cx="13.5" cy="14.5" r="1" fill={color} stroke="none" />
          <circle cx="9.5" cy="15.5" r="0.9" fill={color} stroke="none" />
        </>
      )}

      {/* Nav Home */}
      {name === 'nav-home' && (
        <>
          <path d="M4.5 10.5L12 4.5L19.5 10.5V18.5C19.5 19.3 18.8 20 18 20H6C5.2 20 4.5 19.3 4.5 18.5V10.5Z" fill={accentColor} fillOpacity="0.2" />
          <path d="M9.5 15.5C10.5 16.5 13.5 16.5 14.5 15.5" />
        </>
      )}

      {/* Nav Activity */}
      {name === 'nav-activity' && (
        <>
          <rect x="4" y="4.5" width="16" height="15" rx="4" fill={accentColor} fillOpacity="0.16" />
          <path d="M7 12.5H9.5L11.2 9L13.2 15.5L14.8 12.5H17" />
        </>
      )}

      {/* Nav Plans */}
      {name === 'nav-plans' && (
        <>
          <circle cx="12" cy="12" r="8" fill={accentColor} fillOpacity="0.18" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.3" fill={color} stroke="none" />
        </>
      )}

      {/* Nav Circles */}
      {name === 'nav-circles' && (
        <>
          <circle cx="9" cy="9.5" r="3" fill={accentColor} fillOpacity="0.22" />
          <circle cx="15.5" cy="10.5" r="2.5" />
          <path d="M4 19C4.4 16.2 6.6 15 9 15C11.4 15 13.6 16.2 14 19" />
          <path d="M15.5 15.2C17.8 15.4 19.5 16.8 20 19" />
        </>
      )}

      {/* Nav Coach */}
      {name === 'nav-coach' && (
        <>
          <path d="M5 18.5L6.2 15.2C5.4 14 5 12.6 5 11.2C5 7.4 8.1 4.5 12 4.5C15.9 4.5 19 7.4 19 11.2C19 15 15.9 18 12 18C10.5 18 9.2 17.6 8.1 16.9L5 18.5Z" fill={accentColor} fillOpacity="0.22" />
          <circle cx="9.8" cy="11.2" r="1" fill={color} stroke="none" />
          <circle cx="14.2" cy="11.2" r="1" fill={color} stroke="none" />
        </>
      )}
    </svg>
  );
};

export const CategoryBadgeIcon: React.FC<{
  name: MintlyIconName;
  color?: string;
  size?: number;
  label?: string;
}> = ({
  name,
  color = 'var(--teal-900, #0B3B3A)',
  size = 44,
  label,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
        color,
        boxShadow: `0 10px 22px -10px ${color}, inset 0 1px 0 rgba(255,255,255,0.18)`,
      }}
      className="rounded-2xl flex items-center justify-center shrink-0"
      aria-hidden={label ? undefined : true}
    >
      <Icon
        name={name}
        size={Math.round(size * 0.54)}
        color={color}
        accentColor={color}
        label={label}
      />
    </div>
  );
};
