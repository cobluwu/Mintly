import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, X } from 'lucide-react';
import type {
  FinancialAccount,
  PaymentMode,
  SpendingCategory,
  Transaction,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import { SPRING_BOUNCY, SPRING_GENTLE, triggerHaptic } from '../shared/motion';
import { Chip, Pill } from './ui';

export type ActivityDateRange = 'all' | '7d' | 'month';
export type ActivityTrustFilter = 'all' | 'verified' | 'self_reported' | 'pending';

export interface ActivityFilters {
  category: SpendingCategory | 'all';
  accountId: string | 'all';
  paymentMode: PaymentMode | 'all';
  dateRange: ActivityDateRange;
  trustStatus: ActivityTrustFilter;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  category: 'all',
  accountId: 'all',
  paymentMode: 'all',
  dateRange: 'all',
  trustStatus: 'all',
};

export function resolveTransactionTrustStatus(
  tx: Transaction
): 'pending' | 'self_reported' | 'verified' {
  if (tx.status === 'pending') return 'pending';
  if (tx.paymentMode === 'cash' || (!tx.upiRef && tx.paymentMode !== 'bank')) {
    return 'self_reported';
  }
  return 'verified';
}

export function countActiveActivityFilters(filters: ActivityFilters): number {
  let count = 0;
  if (filters.category !== 'all') count++;
  if (filters.accountId !== 'all') count++;
  if (filters.paymentMode !== 'all') count++;
  if (filters.dateRange !== 'all') count++;
  if (filters.trustStatus !== 'all') count++;
  return count;
}

interface ActivityFilterSheetProps {
  open: boolean;
  filters: ActivityFilters;
  accounts: FinancialAccount[];
  t: TranslationBundle;
  onChange: (next: ActivityFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

const FILTER_CATEGORIES: Array<SpendingCategory | 'all'> = [
  'all',
  'dining',
  'groceries',
  'transport',
  'textbooks',
  'subscriptions',
  'fun',
  'rent',
  'health',
  'laundry',
  'festivals',
  'trips',
  'income',
  'savings',
];

const PAYMENT_MODES: Array<{ value: PaymentMode | 'all'; label: string }> = [
  { value: 'all', label: 'All modes' },
  { value: 'upi', label: 'UPI' },
  { value: 'upi_lite', label: 'UPI Lite' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Mess Card' },
  { value: 'bank', label: 'Bank Transfer' },
];

const DATE_RANGES: Array<{ value: ActivityDateRange; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
];

const TRUST_STATUSES: Array<{ value: ActivityTrustFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'self_reported', label: 'Self-reported' },
  { value: 'pending', label: 'Pending' },
];

export const ActivityFilterSheet: React.FC<ActivityFilterSheetProps> = ({
  open,
  filters,
  accounts,
  t,
  onChange,
  onReset,
  onClose,
}) => {
  const activeCount = countActiveActivityFilters(filters);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Activity"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0E2B2B]/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.98 }}
            transition={SPRING_GENTLE}
            className="w-full max-w-md max-h-[86vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-[var(--surface-sheet)] border border-white p-5 sm:p-6 shadow-[0_-18px_48px_-14px_rgba(14,43,43,0.24)] space-y-5 text-[var(--ink)]"
          >
            {/* Drag Handle + Header */}
            <div className="space-y-2">
              <div className="w-10 h-1 rounded-full bg-[var(--ink)]/15 mx-auto sm:hidden" />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-[var(--ink)]">
                    Filter Activity
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Narrow down by category, account, mode, dates, or status
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING_BOUNCY}
                  onClick={() => {
                    triggerHaptic(6);
                    onClose();
                  }}
                  aria-label="Close filter sheet"
                  className="w-10 h-10 rounded-full bg-white border border-[var(--ink)]/10 text-[var(--ink)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">Date Range</p>
              <div className="flex flex-wrap gap-2">
                {DATE_RANGES.map((dr) => (
                  <Chip
                    key={dr.value}
                    label={dr.label}
                    active={filters.dateRange === dr.value}
                    onClick={() => onChange({ ...filters, dateRange: dr.value })}
                  />
                ))}
              </div>
            </div>

            {/* Verification / Trust Status */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">Verification Status</p>
              <div className="flex flex-wrap gap-2">
                {TRUST_STATUSES.map((ts) => (
                  <Chip
                    key={ts.value}
                    label={ts.label}
                    active={filters.trustStatus === ts.value}
                    onClick={() => onChange({ ...filters, trustStatus: ts.value })}
                  />
                ))}
              </div>
            </div>

            {/* Account */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">Account</p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="All accounts"
                  active={filters.accountId === 'all'}
                  onClick={() => onChange({ ...filters, accountId: 'all' })}
                />
                {accounts.map((acc) => (
                  <Chip
                    key={acc.id}
                    label={acc.name}
                    active={filters.accountId === acc.id}
                    onClick={() => onChange({ ...filters, accountId: acc.id })}
                  />
                ))}
              </div>
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">Payment Mode</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((pm) => (
                  <Chip
                    key={pm.value}
                    label={pm.label}
                    active={filters.paymentMode === pm.value}
                    onClick={() => onChange({ ...filters, paymentMode: pm.value })}
                  />
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--muted)]">Category</p>
              <div className="flex flex-wrap gap-2">
                {FILTER_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat === 'all' ? 'All categories' : t.categories[cat]}
                    active={filters.category === cat}
                    onClick={() => onChange({ ...filters, category: cat })}
                  />
                ))}
              </div>
            </div>

            {/* Sticky Footer Actions */}
            <div className="sticky -bottom-5 sm:-bottom-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 bg-[var(--surface-sheet)]/95 backdrop-blur-md border-t border-[var(--hairline-soft)] flex items-center gap-2.5">
              <Pill
                variant="ghost"
                size="md"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={onReset}
                disabled={activeCount === 0}
              >
                Reset
              </Pill>
              <Pill
                variant="ink"
                size="md"
                fullWidth
                className="flex-1"
                onClick={onClose}
              >
                {activeCount > 0 ? `Show Results (${activeCount} active)` : 'Done'}
              </Pill>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
