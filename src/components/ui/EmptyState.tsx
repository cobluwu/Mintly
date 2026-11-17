import React from 'react';
import { MochiMascot, type MochiPoseMood } from '../brand/MochiMascot';
import { WhiteCard } from './Surfaces';
import { Pill } from './Pill';

interface EmptyStateProps {
  title: string;
  description: string;
  mood?: MochiPoseMood;
  accessory?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  mood = 'sleeping',
  accessory = null,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <WhiteCard
      className={`flex flex-col items-center text-center py-8 px-6 gap-3 ${className}`}
    >
      <div className="w-20 h-20 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center">
        <MochiMascot
          mood={mood}
          accessory={accessory}
          size={66}
          interactive={false}
        />
      </div>
      <div className="space-y-1 max-w-[260px]">
        <h3 className="font-display text-base font-medium text-[var(--ink)]">
          {title}
        </h3>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Pill variant="ink" size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Pill>
      )}
    </WhiteCard>
  );
};
