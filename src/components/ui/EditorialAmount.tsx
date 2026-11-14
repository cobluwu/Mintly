import React, { useEffect, useRef, useState } from 'react';
import type { CurrencyCode } from '../../shared/types';
import { fmtINR, splitINRParts } from '../../shared/finance';

interface EditorialAmountProps {
  valueCents: number;
  currency?: CurrencyCode;
  sourceCurrency?: CurrencyCode;
  signed?: boolean;
  countUp?: boolean;
  showZeroPaise?: boolean;
  className?: string;
  symbolClassName?: string;
  centsClassName?: string;
}

export const EditorialAmount: React.FC<EditorialAmountProps> = ({
  valueCents,
  signed = false,
  countUp = true,
  showZeroPaise = false,
  className = 'text-4xl font-medium tracking-[-0.03em] text-white',
  symbolClassName = 'text-[0.44em] font-normal opacity-80 mr-0.5',
  centsClassName = 'text-[0.4em] font-normal opacity-80 ml-0.5',
}) => {
  const targetCents = Math.round(valueCents);
  const [displayCents, setDisplayCents] = useState(targetCents);
  const prevRef = useRef(targetCents);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const start = prevRef.current;
    const end = targetCents;
    if (start === end || prefersReduced || !countUp) {
      prevRef.current = end;
      setDisplayCents(end);
      return;
    }

    const duration = 560;
    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCents(Math.round(start + (end - start) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCents, countUp, prefersReduced]);

  const parts = splitINRParts(displayCents, { showZeroPaise });
  const signPrefix =
    signed && displayCents > 0 ? '+' : displayCents < 0 ? '-' : '';

  return (
    <span
      aria-label={fmtINR(displayCents, { sign: signed, showPaise: showZeroPaise })}
      className={`inline-flex items-baseline tabular-nums leading-none ${className}`}
    >
      {signPrefix && <span className={symbolClassName}>{signPrefix}</span>}
      <span className={symbolClassName}>{parts.symbol}</span>
      <span>{parts.whole}</span>
      {parts.paiseSuffix && (
        <span className={centsClassName}>{parts.paiseSuffix}</span>
      )}
    </span>
  );
};
