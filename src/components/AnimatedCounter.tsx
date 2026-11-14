import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import type { CurrencyCode } from '../shared/types';
import { formatMinorUnits } from '../shared/finance';
import { SPRING_BOUNCY } from '../shared/motion';

interface AnimatedCounterProps {
  valueCents: number;
  currency: CurrencyCode;
  className?: string;
  compact?: boolean;
  signed?: boolean;
  /** Roll odometer digits vertically on mount/scroll into view and value change */
  odometer?: boolean;
  countFromZeroOnView?: boolean;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const OdometerDigit: React.FC<{ char: string }> = ({ char }) => {
  const digitIndex = Number(char);
  if (Number.isNaN(digitIndex)) {
    return <span className="inline-block">{char}</span>;
  }

  return (
    <span className="inline-block relative h-[1.15em] overflow-hidden align-bottom">
      <motion.span
        initial={false}
        animate={{ y: `${-digitIndex * 10}%` }}
        transition={SPRING_BOUNCY}
        className="flex flex-col leading-[1.15em]"
        aria-hidden="true"
      >
        {DIGITS.map((d) => (
          <span key={d} className="h-[1.15em] flex items-center justify-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  valueCents,
  currency,
  className = '',
  compact = false,
  signed = false,
  odometer = true,
  countFromZeroOnView = false,
}) => {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  const [displayCents, setDisplayCents] = useState(
    countFromZeroOnView ? 0 : valueCents
  );
  const prevRef = useRef(countFromZeroOnView ? 0 : valueCents);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (countFromZeroOnView && !isInView) return;

    const start = prevRef.current;
    const end = valueCents;
    if (start === end) {
      setDisplayCents(end);
      return;
    }

    if (prefersReduced || (odometer && !countFromZeroOnView)) {
      prevRef.current = end;
      setDisplayCents(end);
      return;
    }

    const duration = countFromZeroOnView ? 620 : 420;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayCents(current);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [valueCents, countFromZeroOnView, isInView, prefersReduced, odometer]);

  const formatted = useMemo(
    () => formatMinorUnits(displayCents, currency, { compact, signed }),
    [displayCents, currency, compact, signed]
  );

  if (!odometer || prefersReduced) {
    return (
      <span ref={containerRef} className={`tabular-nums ${className}`}>
        {formatted}
      </span>
    );
  }

  return (
    <span
      ref={containerRef}
      aria-label={formatted}
      className={`inline-flex items-baseline tabular-nums ${className}`}
    >
      <span className="sr-only">{formatted}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {formatted.split('').map((ch, idx) => (
          <OdometerDigit key={`r-${formatted.length - idx}`} char={ch} />
        ))}
      </span>
    </span>
  );
};
