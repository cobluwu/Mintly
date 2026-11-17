import React from 'react';
import { Icon, type MintlyIconName } from '../brand/Icon';

export type IconBadgeTone =
  | 'sage'
  | 'cream'
  | 'teal'
  | 'coral'
  | 'amber'
  | 'neutral'
  | 'glass';

export type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

interface IconBadgeProps {
  name?: MintlyIconName;
  icon?: MintlyIconName | React.ReactNode;
  customIcon?: React.ReactNode;
  tone?: IconBadgeTone;
  shape?: 'circle' | 'rounded';
  size?: IconBadgeSize;
  className?: string;
}

const TONE_MAP: Record<
  IconBadgeTone,
  { bg: string; fg: string; accent: string; border?: string }
> = {
  sage: { bg: 'var(--sage-100)', fg: 'var(--teal-900)', accent: 'var(--teal-800)' },
  cream: { bg: 'var(--cream)', fg: 'var(--ink)', accent: 'var(--teal-900)' },
  teal: { bg: 'var(--teal-900)', fg: '#FFFFFF', accent: 'var(--sage-300)' },
  coral: { bg: 'var(--coral-tint)', fg: 'var(--coral-ink)', accent: 'var(--coral)' },
  amber: { bg: 'var(--amber-tint)', fg: 'var(--amber-ink)', accent: 'var(--amber)' },
  neutral: { bg: 'var(--surface-subtle)', fg: 'var(--ink)', accent: 'var(--teal-900)' },
  glass: {
    bg: 'rgba(255,255,255,0.68)',
    fg: 'var(--ink)',
    accent: 'var(--teal-900)',
    border: '1px solid rgba(255,255,255,0.75)',
  },
};

const SIZE_MAP: Record<IconBadgeSize, { box: number; icon: number }> = {
  sm: { box: 34, icon: 16 },
  md: { box: 40, icon: 19 },
  lg: { box: 46, icon: 22 },
  xl: { box: 52, icon: 24 },
};

/**
 * IconBadge: Tinted circular or 16px-rounded badge wrapping Mintly custom icons or Lucide nodes.
 */
export const IconBadge: React.FC<IconBadgeProps> = ({
  name,
  icon = 'save',
  customIcon,
  tone = 'sage',
  shape = 'rounded',
  size = 'md',
  className = '',
}) => {
  const palette = TONE_MAP[tone];
  const dims = SIZE_MAP[size];

  const iconName: MintlyIconName | null = name
    ? name
    : typeof icon === 'string'
      ? (icon as MintlyIconName)
      : null;

  const renderedCustom =
    customIcon || (icon && typeof icon !== 'string' ? icon : null);

  return (
    <span
      aria-hidden="true"
      style={{
        width: dims.box,
        height: dims.box,
        backgroundColor: palette.bg,
        color: palette.fg,
        border: palette.border,
      }}
      className={`inline-flex items-center justify-center shrink-0 ${
        shape === 'circle' ? 'rounded-full' : 'rounded-[16px]'
      } ${className}`}
    >
      {renderedCustom || (
        <Icon
          name={iconName ?? 'save'}
          size={dims.icon}
          color={palette.fg}
          accentColor={palette.accent}
        />
      )}
    </span>
  );
};
