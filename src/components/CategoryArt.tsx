import React from 'react';
import type { SpendingCategory } from '../shared/types';
import { Icon, type MintlyIconName } from './brand/Icon';

export const CATEGORY_STYLE: Record<
  SpendingCategory,
  { color: string; bg: string; icon: MintlyIconName; labelShort: string }
> = {
  dining: {
    color: '#0E2B2B',
    bg: '#F3EFDC',
    icon: 'dining',
    labelShort: 'Dining',
  },
  groceries: {
    color: '#0B3B3A',
    bg: '#DDEFE3',
    icon: 'groceries',
    labelShort: 'Groceries',
  },
  transport: {
    color: '#0E2B2B',
    bg: '#F3EFDC',
    icon: 'transport',
    labelShort: 'Transit',
  },
  textbooks: {
    color: '#0B3B3A',
    bg: '#DDEFE3',
    icon: 'books',
    labelShort: 'Books',
  },
  subscriptions: {
    color: '#0E2B2B',
    bg: '#E8ECEA',
    icon: 'subscriptions',
    labelShort: 'Subs',
  },
  fun: {
    color: '#0E2B2B',
    bg: '#F3EFDC',
    icon: 'fun',
    labelShort: 'Fun',
  },
  rent: {
    color: '#0E2B2B',
    bg: '#E8ECEA',
    icon: 'rent',
    labelShort: 'Hostel',
  },
  health: {
    color: '#0B3B3A',
    bg: '#DDEFE3',
    icon: 'health',
    labelShort: 'Health',
  },
  laundry: {
    color: '#0E2B2B',
    bg: '#E8ECEA',
    icon: 'rent',
    labelShort: 'Laundry',
  },
  festivals: {
    color: '#0E2B2B',
    bg: '#F3EFDC',
    icon: 'gift',
    labelShort: 'Festivals',
  },
  trips: {
    color: '#0B3B3A',
    bg: '#DDEFE3',
    icon: 'trip',
    labelShort: 'Trips',
  },
  income: {
    color: '#0B3B3A',
    bg: '#A9D6B8',
    icon: 'income',
    labelShort: 'Income',
  },
  savings: {
    color: '#0B3B3A',
    bg: '#DDEFE3',
    icon: 'vault',
    labelShort: 'Vault',
  },
};

export const CategoryGlyph: React.FC<{
  category: SpendingCategory;
  size?: number;
}> = ({ category, size = 42 }) => {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.dining;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: style.bg,
        color: style.color,
      }}
      className="rounded-full flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <Icon
        name={style.icon}
        size={Math.round(size * 0.48)}
        color={style.color}
        accentColor="#0B3B3A"
      />
    </div>
  );
};
