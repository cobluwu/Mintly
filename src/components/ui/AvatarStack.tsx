import React from 'react';

export interface StackMember {
  id: string;
  name: string;
  initials: string;
  color?: string;
}

export type AvatarMember = StackMember;

const DEFAULT_COLORS = [
  'var(--sage-300)',
  'var(--cream)',
  'var(--sage-100)',
  'var(--teal-800)',
  'var(--amber)',
];

function isDarkSwatch(bg: string): boolean {
  return (
    bg === '#0B3B3A' ||
    bg === '#14504D' ||
    bg === '#0E2B2B' ||
    bg === 'var(--teal-800)' ||
    bg === 'var(--teal-900)'
  );
}

interface IllustratedAvatarProps {
  member: StackMember;
  index?: number;
  size?: number;
  className?: string;
}

export const IllustratedAvatar: React.FC<IllustratedAvatarProps> = ({
  member,
  index = 0,
  size = 34,
  className = '',
}) => {
  const bg = member.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const darkBg = isDarkSwatch(bg);

  return (
    <span
      title={member.name}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: darkBg ? '#FFFFFF' : 'var(--ink)',
      }}
      className={`rounded-full border-2 border-white shadow-[0_2px_8px_rgba(14,43,43,0.12)] inline-flex items-center justify-center text-[11px] font-semibold tracking-tight select-none shrink-0 ${className}`}
    >
      {member.initials}
    </span>
  );
};

interface AvatarStackProps {
  members: StackMember[];
  max?: number;
  size?: number;
  className?: string;
}

/**
 * AvatarStack: Overlapping illustrated member badges for student circles & shared splits.
 */
export const AvatarStack: React.FC<AvatarStackProps> = ({
  members,
  max = 4,
  size = 34,
  className = '',
}) => {
  const visible = members.slice(0, max);
  const overflow = Math.max(0, members.length - visible.length);

  return (
    <div
      className={`inline-flex items-center -space-x-2.5 ${className}`}
      aria-label={`${members.length} members: ${members.map((m) => m.name).join(', ')}`}
    >
      {visible.map((m, idx) => (
        <IllustratedAvatar key={m.id} member={m} index={idx} size={size} />
      ))}

      {overflow > 0 && (
        <span
          style={{ width: size, height: size }}
          className="rounded-full border-2 border-white bg-[var(--sage-100)] text-[var(--teal-900)] shadow-[0_2px_8px_rgba(14,43,43,0.1)] inline-flex items-center justify-center text-[11px] font-mono font-semibold shrink-0"
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};
