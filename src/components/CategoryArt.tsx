import React from 'react';
import type { SpendingCategory } from '../shared/types';
import { type MintlyIconName } from './brand/Icon';
import { IconBadge, type IconBadgeTone } from './ui/IconBadge';

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

const BG_TO_TONE: Record<string, IconBadgeTone> = {
  '#DDEFE3': 'sage',
  '#A9D6B8': 'sage',
  '#F3EFDC': 'cream',
  '#E8ECEA': 'neutral',
};

export const CategoryGlyph: React.FC<{
  category: SpendingCategory;
  size?: number;
}> = ({ category, size = 42 }) => {
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.dining;
  const tone: IconBadgeTone = BG_TO_TONE[style.bg] ?? 'cream';
  const badgeSize = size <= 34 ? 'sm' : size <= 42 ? 'md' : size <= 48 ? 'lg' : 'xl';

  return (
    <IconBadge
      name={style.icon}
      tone={tone}
      size={badgeSize}
      shape="circle"
    />
  );
};
