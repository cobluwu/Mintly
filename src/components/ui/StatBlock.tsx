import React from 'react';
import type { CurrencyCode } from '../../shared/types';
import { EditorialAmount } from './EditorialAmount';

interface StatBlockProps {
  label: string;
  valueCents?: number;
  textValue?: string;
  currency?: CurrencyCode;
  signed?: boolean;
  showZeroPaise?: boolean;
  countUp?: boolean;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  caption?: string;
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'font-display text-lg font-medium tracking-[-0.02em]',
  md: 'font-display text-[28px] font-medium tracking-[-0.03em]',
  lg: 'font-display text-[38px] sm:text-[40px] font-medium tracking-[-0.03em]',
};

/**
 * StatBlock: editorial ₹ figure (small symbol, large whole, small paise) paired with muted caption.
 */
export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  valueCents,
  textValue,
  currency = 'INR',
  signed = false,
  showZeroPaise = false,
  countUp = true,
  tone = 'light',
  size = 'md',
  caption,
  className = '',
}) => {
  const isDark = tone === 'dark';
  const labelColor = isDark ? 'text-white/70' : 'text-[var(--muted)]';
  const valueColor = isDark ? 'text-white' : 'text-[var(--ink)]';

  return (
    <div className={`min-w-0 ${className}`}>
      <p className={`text-[11px] font-medium ${labelColor} truncate`} title={label}>
        {label}
      </p>
      <div className="mt-1">
        {valueCents !== undefined ? (
          <EditorialAmount
            valueCents={valueCents}
            currency={currency}
            signed={signed}
            showZeroPaise={showZeroPaise}
            countUp={countUp}
            className={`${SIZE_CLASSES[size]} ${valueColor}`}
          />
        ) : (
          <span className={`${SIZE_CLASSES[size]} ${valueColor} tabular-nums leading-none block`}>
            {textValue}
          </span>
        )}
      </div>
      {caption && (
        <p className={`text-xs ${labelColor} mt-1 leading-snug`}>{caption}</p>
      )}
    </div>
  );
};
