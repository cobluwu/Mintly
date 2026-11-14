import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Search, Upload, ChevronDown, RotateCcw, Users } from 'lucide-react';
import type {
  MintlyWorkspaceState,
  SpendingCategory,
  Transaction,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  fmtINR,
  formatActivityDayHeader,
  formatTimeIST12h,
  toIstDateKey,
} from '../shared/finance';
import { CategoryGlyph } from './CategoryArt';
import { MascotCompanion } from './MascotCompanion';

interface ActivityViewProps {
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  onOpenImport: () => void;
  onOpenReport: () => void;
  onReverseTransaction: (txId: string) => void;
  onChangeCategory: (txId: string, category: SpendingCategory) => void;
  onSplitTransaction: (tx: Transaction) => void;
}

const EXPENSE_CATEGORY_OPTIONS: SpendingCategory[] = [
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
];

const MODE_LABEL: Record<string, string> = {
  upi: 'UPI',
  upi_lite: 'UPI Lite',
  cash: 'Cash',
  card: 'Mess Card',
  bank: 'Bank Transfer',
};

export const ActivityView: React.FC<ActivityViewProps> = ({
  workspace,
  t,
  onOpenImport,
  onOpenReport,
  onReverseTransaction,
  onChangeCategory,
  onSplitTransaction,
}) => {
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const accountMap = useMemo(
    () => new Map(workspace.accounts.map((a) => [a.id, a.name])),
    [workspace.accounts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspace.transactions.filter((tx) => {
      if (filter !== 'all' && tx.type !== filter) return false;
      if (!q) return true;
      return (
        tx.merchant.toLowerCase().includes(q) ||
        (tx.note || '').toLowerCase().includes(q) ||
        (tx.upiRef || '').toLowerCase().includes(q) ||
        (tx.paidToUpiId || '').toLowerCase().includes(q) ||
        t.categories[tx.category].toLowerCase().includes(q)
      );
    });
  }, [workspace.transactions, filter, query, t.categories]);

  // Group chronologically by IST calendar date ("Today", "Yesterday", "12 Nov")
  const grouped = useMemo(() => {
    const nowIso = new Date().toISOString();
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime()
    );
    const byDate = new Map<string, { label: string; items: Transaction[] }>();
    for (const tx of sorted) {
      const dateKey = toIstDateKey(tx.occurredAtUtc);
      const bucket = byDate.get(dateKey);
      if (bucket) {
        bucket.items.push(tx);
      } else {
        byDate.set(dateKey, {
          label: formatActivityDayHeader(tx.occurredAtUtc, nowIso),
          items: [tx],
        });
      }
    }
    return Array.from(byDate.entries()).map(([dateKey, group]) => ({
      dateKey,
      label: group.label,
      items: group.items,
    }));
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
          {t.activity.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenReport}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#191D25] hover:bg-[#232934] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#A9D6B8]" />
            <span>{t.extras.moneyReport}</span>
          </button>
          <button
            type="button"
            onClick={onOpenImport}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#191D25] hover:bg-[#232934] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#B9FF4B]" />
            <span>{t.activity.importCsv}</span>
          </button>
        </div>
      </div>

      {/* Search + Segmented Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1 block">
          <span className="sr-only">{t.activity.searchPlaceholder}</span>
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.activity.searchPlaceholder}
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-[#13161C] border border-white/[0.09] text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#B9FF4B]"
          />
        </label>

        <div
          role="tablist"
          aria-label="Filter transactions"
          className="flex items-center gap-1 p-1 rounded-xl bg-[#13161C] border border-white/[0.08] shrink-0"
        >
          {(['all', 'expense', 'income'] as const).map((tabKey) => {
            const label =
              tabKey === 'all'
                ? t.activity.all
                : tabKey === 'expense'
                  ? t.activity.expenses
                  : t.activity.income;
            const active = filter === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tabKey)}
                className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#B9FF4B] text-[#0B0D10]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-3xl bg-[#13161C] border border-white/[0.08] p-8 flex flex-col items-center text-center gap-3">
          <MascotCompanion mood="coach" size={68} />
          <p className="text-sm text-[#94A3B8]">{t.activity.empty}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.dateKey} className="space-y-2">
              <h2 className="text-xs font-mono font-medium text-[#94A3B8] px-1">
                {group.label}
              </h2>
              <div className="divide-y divide-white/[0.06] rounded-3xl bg-[#13161C] border border-white/[0.08] px-4">
                {group.items.map((tx) => {
                  const isOpen = expandedId === tx.id;
                  const modeStr = tx.paymentMode ? MODE_LABEL[tx.paymentMode] || tx.paymentMode : 'UPI';
                  const accountName = accountMap.get(tx.accountId) || 'Student Savings';
                  return (
                    <div key={tx.id} className="py-1">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : tx.id)}
                        aria-expanded={isOpen}
                        className="w-full min-h-[60px] py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CategoryGlyph category={tx.category} size={42} />
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                tx.status === 'reversed' ? 'line-through text-[#64748B]' : 'text-white'
                              }`}
                            >
                              {tx.merchant}
                            </p>
                            <p className="text-xs text-[#94A3B8] truncate">
                              {t.categories[tx.category]}
                              <span aria-hidden="true"> · </span>
                              <span>{accountName}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{formatTimeIST12h(tx.occurredAtUtc)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end gap-0.5">
                            <span
                              className={`font-mono text-sm font-semibold tabular-nums ${
                                tx.status === 'reversed'
                                  ? 'text-[#64748B]'
                                  : tx.type === 'income'
                                    ? 'text-[#B9FF4B]'
                                    : 'text-white'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : '-'}
                              {fmtINR(tx.amountCents)}
                            </span>
                            {tx.roundUpPaise ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#B9FF4B]/15 text-[#B9FF4B] font-mono text-[10px] font-medium tabular-nums">
                                +{fmtINR(tx.roundUpPaise)} saved
                              </span>
                            ) : null}
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-[#64748B] transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pb-3.5 pt-1 pl-[54px] pr-2 space-y-2.5 text-xs text-[#94A3B8]">
                              {tx.note && <p className="text-[#CBD5E1]">{tx.note}</p>}

                              <div className="grid grid-cols-1 gap-1 text-[11px] font-mono bg-white/[0.03] rounded-xl p-2.5 border border-white/[0.06]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span>
                                    {tx.type === 'income' ? 'From' : 'Paid to'}:{' '}
                                    <span className="text-white">
                                      {tx.merchant}
                                      {tx.paidToUpiId ? ` (${tx.paidToUpiId})` : ''}
                                    </span>
                                  </span>
                                  <span>
                                    Mode: <span className="text-white">{modeStr}</span>
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span>
                                    Account: <span className="text-white">{accountName}</span>
                                  </span>
                                  <span>
                                    {formatActivityDayHeader(tx.occurredAtUtc)} ·{' '}
                                    {formatTimeIST12h(tx.occurredAtUtc)} IST
                                  </span>
                                </div>
                                {(tx.upiRef || tx.roundUpPaise) && (
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                    {tx.upiRef && (
                                      <span>
                                        UPI Ref: <span className="text-white">{tx.upiRef}</span>
                                      </span>
                                    )}
                                    {tx.roundUpPaise ? (
                                      <span className="text-[#B9FF4B]">
                                        Round-up +{fmtINR(tx.roundUpPaise)}
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </div>

                              {/* Row Actions: Change Category, Split This, Reverse */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                                {tx.type === 'expense' && (
                                  <label className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-[#94A3B8]">Category:</span>
                                    <select
                                      aria-label={`Change category for ${tx.merchant}`}
                                      value={tx.category}
                                      onChange={(e) =>
                                        onChangeCategory(tx.id, e.target.value as SpendingCategory)
                                      }
                                      className="min-h-[34px] px-2.5 rounded-lg bg-[#191D25] border border-white/[0.1] text-white text-[11px] focus:outline-none focus:border-[#B9FF4B]"
                                    >
                                      {EXPENSE_CATEGORY_OPTIONS.map((cat) => (
                                        <option key={cat} value={cat}>
                                          {t.categories[cat]}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                )}

                                <div className="flex items-center gap-2 ml-auto">
                                  {tx.type === 'expense' && tx.status === 'posted' && (
                                    <button
                                      type="button"
                                      onClick={() => onSplitTransaction(tx)}
                                      className="min-h-[34px] px-3 rounded-lg bg-white/[0.07] hover:bg-[#A9D6B8]/20 text-[#A9D6B8] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <Users className="w-3.5 h-3.5" />
                                      <span>Split this</span>
                                    </button>
                                  )}
                                  {tx.status === 'posted' && (
                                    <button
                                      type="button"
                                      onClick={() => onReverseTransaction(tx.id)}
                                      className="min-h-[34px] px-3 rounded-lg bg-white/[0.05] hover:bg-[#FF6B6B]/20 text-[#FF6B6B] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Reverse Entry</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
