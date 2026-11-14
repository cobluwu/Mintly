import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import type { CurrencyCode } from '../shared/types';
import { fmtINR } from '../shared/finance';
import { SPRING_BOUNCY, triggerHaptic } from '../shared/motion';

export interface WeeklyPulseDay {
  dayKey: string;
  label: string;
  spentCents: number;
}

interface SpendingPulseChartProps {
  data: WeeklyPulseDay[];
  currency: CurrencyCode;
  dailyBudgetCents: number;
  selectedDayKey: string | null;
  onSelectDay: (dayKey: string | null) => void;
}

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
  payload?: WeeklyPulseDay;
  isSelected?: boolean;
  onBarClick?: (dayKey: string) => void;
}

const AnimatedBarShape: React.FC<CustomBarProps> = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill = '#A9D6B8',
  index = 0,
  payload,
  isSelected = false,
  onBarClick,
}) => {
  const safeHeight = Math.max(10, height);
  const adjustedY = height < 10 ? y - (10 - height) : y;
  const rx = Math.min(10, width / 2);

  return (
    <g
      onClick={() => payload && onBarClick?.(payload.dayKey)}
      style={{ cursor: 'pointer' }}
    >
      <motion.rect
        x={x}
        y={adjustedY}
        width={width}
        height={safeHeight}
        rx={rx}
        ry={rx}
        fill={fill}
        style={{
          transformOrigin: `${x + width / 2}px ${adjustedY + safeHeight}px`,
        }}
        initial={{ scaleY: 0.08, opacity: 0.45 }}
        animate={{
          scaleY: isSelected ? 1.06 : 1,
          scaleX: isSelected ? 1.08 : 1,
          opacity: 1,
        }}
        transition={{
          ...SPRING_BOUNCY,
          delay: index * 0.045,
        }}
      />
    </g>
  );
};

export const SpendingPulseChart: React.FC<SpendingPulseChartProps> = ({
  data,
  dailyBudgetCents,
  selectedDayKey,
  onSelectDay,
}) => {
  const activeDay = data.find((d) => d.dayKey === selectedDayKey) ?? null;

  const handleToggleDay = (dayKey: string) => {
    triggerHaptic(8);
    onSelectDay(selectedDayKey === dayKey ? null : dayKey);
  };

  return (
    <div className="relative space-y-2.5">
      <div className="min-h-[32px] flex items-center">
        <AnimatePresence mode="wait">
          {activeDay ? (
            <motion.div
              key={activeDay.dayKey}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={SPRING_BOUNCY}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3B3A] text-white text-xs font-medium"
            >
              <span>{activeDay.label}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {fmtINR(activeDay.spentCents)}
              </span>
              <span className="text-[11px] text-[#A9D6B8]">
                {activeDay.spentCents > dailyBudgetCents ? 'Above pace' : 'On pace'}
              </span>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-[#6B7F7C]"
            >
              Tap any bar to inspect the day’s spend
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="h-32 w-full min-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            barCategoryGap="24%"
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B7F7C', fontSize: 11, fontFamily: 'Instrument Sans' }}
            />
            <Bar
              dataKey="spentCents"
              isAnimationActive={false}
              shape={(barProps: unknown) => {
                const props = barProps as CustomBarProps & { index: number };
                const day = props.payload;
                const isSelected = Boolean(day && day.dayKey === selectedDayKey);
                return (
                  <AnimatedBarShape
                    {...props}
                    isSelected={isSelected}
                    onBarClick={handleToggleDay}
                  />
                );
              }}
            >
              {data.map((entry) => {
                const isSelected = entry.dayKey === selectedDayKey;
                const isHigh = entry.spentCents > dailyBudgetCents;
                const fill = isSelected
                  ? '#0B3B3A'
                  : isHigh
                    ? '#E26D5C'
                    : '#A9D6B8';
                return <Cell key={entry.dayKey} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-7 gap-1 pt-0.5">
        {data.map((day) => {
          const active = day.dayKey === selectedDayKey;
          return (
            <button
              key={day.dayKey}
              type="button"
              onClick={() => handleToggleDay(day.dayKey)}
              aria-pressed={active}
              aria-label={`${day.label} ${fmtINR(day.spentCents)}`}
              className={`min-h-[30px] rounded-full text-[11px] tabular-nums transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0B3B3A] text-white font-medium'
                  : 'text-[#6B7F7C] hover:text-[#0E2B2B] hover:bg-[#DDEFE3]/50'
              }`}
            >
              {fmtINR(day.spentCents, { compact: true })}
            </button>
          );
        })}
      </div>
    </div>
  );
};
