import React from 'react';

export type SkeletonVariant =
  | 'card'
  | 'white-card'
  | 'glass-card'
  | 'hero'
  | 'hero-teal'
  | 'row'
  | 'stat'
  | 'pill'
  | 'circle'
  | 'text';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

/**
 * Skeleton shimmer placeholder matching Mintly's card, hero, row, stat, circle, and pill geometry.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'card',
  className = '',
}) => {
  if (variant === 'hero' || variant === 'hero-teal') {
    return (
      <div
        aria-hidden="true"
        className={`rounded-[28px] bg-[var(--teal-900)]/12 p-5 space-y-4 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-full mintly-skeleton-shimmer" />
          <div className="h-9 w-9 rounded-full mintly-skeleton-shimmer" />
        </div>
        <div className="h-10 w-44 rounded-2xl mintly-skeleton-shimmer" />
        <div className="h-8 w-full rounded-xl mintly-skeleton-shimmer" />
      </div>
    );
  }

  if (variant === 'glass-card') {
    return (
      <div
        aria-hidden="true"
        className={`mintly-elevation-l1 rounded-[24px] p-5 space-y-3 ${className}`}
      >
        <div className="h-4 w-28 rounded-full mintly-skeleton-shimmer" />
        <div className="h-8 w-40 rounded-2xl mintly-skeleton-shimmer" />
        <div className="h-3 w-full rounded-full mintly-skeleton-shimmer" />
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center justify-between gap-3 py-3 px-4 ${className}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full mintly-skeleton-shimmer shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-32 rounded-full mintly-skeleton-shimmer" />
            <div className="h-2.5 w-44 rounded-full mintly-skeleton-shimmer" />
          </div>
        </div>
        <div className="h-4 w-16 rounded-full mintly-skeleton-shimmer shrink-0" />
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div aria-hidden="true" className={`space-y-2 ${className}`}>
        <div className="h-3 w-20 rounded-full mintly-skeleton-shimmer" />
        <div className="h-7 w-28 rounded-xl mintly-skeleton-shimmer" />
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        aria-hidden="true"
        className={`h-9 w-24 rounded-full mintly-skeleton-shimmer ${className}`}
      />
    );
  }

  if (variant === 'circle') {
    return (
      <div
        aria-hidden="true"
        className={`w-10 h-10 rounded-full mintly-skeleton-shimmer ${className}`}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div
        aria-hidden="true"
        className={`h-3.5 w-3/4 rounded-full mintly-skeleton-shimmer ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`mintly-elevation-l2 rounded-[24px] p-5 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded-full mintly-skeleton-shimmer" />
        <div className="h-8 w-8 rounded-full mintly-skeleton-shimmer" />
      </div>
      <div className="h-7 w-36 rounded-xl mintly-skeleton-shimmer" />
      <div className="h-2.5 w-full rounded-full mintly-skeleton-shimmer" />
    </div>
  );
};
