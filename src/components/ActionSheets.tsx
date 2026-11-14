import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Cloud,
  LogOut,
  RotateCcw,
  Palette,
  Smartphone,
  ShieldCheck,
  Coins,
  BarChart3,
  SlidersHorizontal,
  Check,
  Sparkles,
} from 'lucide-react';
import type {
  BudgetStatus,
  CircleDebtTransfer,
  CurrencyCode,
  IncomeSource,
  LanguageCode,
  MintlyWorkspaceState,
  MonthlyMoneyReport,
  PaymentMode,
  SpendingCategory,
  SplitMode,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  MOCHI_ACCESSORIES,
  SAMPLE_INDIAN_BANK_SMS,
  computeSplitShares,
  fmtINR,
  parseAmountToCents,
} from '../shared/finance';
import { SPRING_BOUNCY, triggerHaptic } from '../shared/motion';
import type { CardControlState } from './CardCarousel';
import { TransactionBottomSheet } from './TransactionBottomSheet';
import { MochiMascot } from './brand/MochiMascot';

export type ActiveSheet =
  | { kind: 'none' }
  | { kind: 'transaction'; defaultType: 'expense' | 'income' }
  | { kind: 'vault'; vaultId: string }
  | {
      kind: 'split';
      circleId: string;
      prefillTitle?: string;
      prefillAmountCents?: number;
    }
  | {
      kind: 'settle';
      circleId: string;
      transfer: CircleDebtTransfer;
    }
  | { kind: 'import' }
  | { kind: 'rewards' }
  | { kind: 'report' }
  | { kind: 'settings' };

interface ActionSheetsProps {
  sheet: ActiveSheet;
  workspace: MintlyWorkspaceState;
  budgets: BudgetStatus[];
  monthlyReport: MonthlyMoneyReport;
  cardControls: Record<string, CardControlState>;
  t: TranslationBundle;
  authUserEmail: string | null;
  cloudBusy: boolean;
  onClose: () => void;
  onAddTransaction: (payload: {
    type: 'expense' | 'income';
    merchant: string;
    amountCents: number;
    category: SpendingCategory;
    accountId: string;
    note: string;
    paymentMode?: PaymentMode;
    paidToUpiId?: string;
    incomeSource?: IncomeSource;
  }) => void;
  onContributeVault: (vaultId: string, amountCents: number, note: string) => void;
  onAddCircleSplit: (payload: {
    circleId: string;
    title: string;
    amountCents: number;
    paidByMemberId: string;
    splitBetweenIds: string[];
    splitMode: SplitMode;
    customSplits?: Record<string, number>;
  }) => void;
  onConfirmCircleSettle: (payload: {
    circleId: string;
    fromMemberId: string;
    toMemberId: string;
    amountCents: number;
    upiApp: string;
    accountId?: string;
  }) => void;
  onImportBatch: (rawLines: string) => Promise<{
    addedCount: number;
    duplicateCount: number;
    parserUsed?: string;
  }>;
  onUpdateSettings: (patch: {
    language?: LanguageCode;
    currency?: CurrencyCode;
    allowanceAmountCents?: number;
    nextAllowanceIso?: string;
  }) => void;
  onUnlockReward: (itemId: string, costCoins: number, equip?: boolean) => void;
  onOpenSheet: (sheet: ActiveSheet) => void;
  onOpenOnboarding: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onResetWorkspace: () => void;
  onOpenStyleGuide?: () => void;
  onOpenBrandStudio?: () => void;
}

const SheetFrame: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-[#0E2B2B]/35 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    onClick={onClose}
  >
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      initial={{ y: '100%', opacity: 0.7 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0.5 }}
      transition={SPRING_BOUNCY}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.04, bottom: 0.45 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 110 || info.velocity.y > 500) {
          triggerHaptic(10);
          onClose();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:max-w-[430px] rounded-t-[32px] sm:rounded-[32px] bg-[#F8FAF8] border border-white shadow-[0_-18px_50px_rgba(14,43,43,0.18)] px-5 pt-3 pb-6 max-h-[88vh] overflow-y-auto text-[#0E2B2B]"
    >
      <div className="w-12 h-1.5 bg-[#0E2B2B]/15 rounded-full mx-auto mb-3 cursor-grab active:cursor-grabbing" />
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-[#0E2B2B]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="min-h-[44px] min-w-[44px] rounded-full bg-[#0E2B2B]/[0.06] hover:bg-[#0E2B2B]/[0.12] flex items-center justify-center text-[#0E2B2B] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

export const ActionSheets: React.FC<ActionSheetsProps> = ({
  sheet,
  workspace,
  budgets,
  monthlyReport,
  cardControls,
  t,
  authUserEmail,
  cloudBusy,
  onClose,
  onAddTransaction,
  onContributeVault,
  onAddCircleSplit,
  onConfirmCircleSettle,
  onImportBatch,
  onUpdateSettings,
  onUnlockReward,
  onOpenSheet,
  onOpenOnboarding,
  onGoogleSignIn,
  onGoogleSignOut,
  onResetWorkspace,
  onOpenStyleGuide,
  onOpenBrandStudio,
}) => {
  return (
    <AnimatePresence>
      {sheet.kind === 'transaction' && (
        <TransactionBottomSheet
          key={`tx-${sheet.defaultType}`}
          defaultType={sheet.defaultType}
          workspace={workspace}
          cardControls={cardControls}
          t={t}
          onClose={onClose}
          onSubmit={onAddTransaction}
        />
      )}

      {sheet.kind === 'vault' && (
        <VaultSheet
          key={`vault-${sheet.vaultId}`}
          vaultId={sheet.vaultId}
          workspace={workspace}
          t={t}
          onClose={onClose}
          onSubmit={onContributeVault}
        />
      )}

      {sheet.kind === 'split' && (
        <SplitSheet
          key={`split-${sheet.circleId}-${sheet.prefillTitle || ''}`}
          circleId={sheet.circleId}
          prefillTitle={sheet.prefillTitle}
          prefillAmountCents={sheet.prefillAmountCents}
          workspace={workspace}
          t={t}
          onClose={onClose}
          onSubmit={onAddCircleSplit}
        />
      )}

      {sheet.kind === 'settle' && (
        <SettleSheet
          key={`settle-${sheet.circleId}-${sheet.transfer.fromMemberId}-${sheet.transfer.toMemberId}`}
          circleId={sheet.circleId}
          transfer={sheet.transfer}
          workspace={workspace}
          onClose={onClose}
          onConfirm={onConfirmCircleSettle}
        />
      )}

      {sheet.kind === 'import' && (
        <ImportSheet key="import-sheet" onClose={onClose} onImportBatch={onImportBatch} />
      )}

      {sheet.kind === 'rewards' && (
        <RewardsSheet
          key="rewards-sheet"
          workspace={workspace}
          t={t}
          onClose={onClose}
          onUnlockReward={onUnlockReward}
        />
      )}

      {sheet.kind === 'report' && (
        <MonthlyReportSheet
          key="report-sheet"
          monthlyReport={monthlyReport}
          budgets={budgets}
          t={t}
          onClose={onClose}
        />
      )}

      {sheet.kind === 'settings' && (
        <SettingsSheet
          key="settings-sheet"
          workspace={workspace}
          t={t}
          authUserEmail={authUserEmail}
          cloudBusy={cloudBusy}
          onClose={onClose}
          onUpdateSettings={onUpdateSettings}
          onOpenRewards={() => onOpenSheet({ kind: 'rewards' })}
          onOpenReport={() => onOpenSheet({ kind: 'report' })}
          onOpenOnboarding={() => {
            onClose();
            onOpenOnboarding();
          }}
          onGoogleSignIn={onGoogleSignIn}
          onGoogleSignOut={onGoogleSignOut}
          onResetWorkspace={onResetWorkspace}
          onOpenStyleGuide={onOpenStyleGuide}
          onOpenBrandStudio={onOpenBrandStudio}
        />
      )}
    </AnimatePresence>
  );
};

const VaultSheet: React.FC<{
  vaultId: string;
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  onClose: () => void;
  onSubmit: ActionSheetsProps['onContributeVault'];
}> = ({ vaultId, workspace, t, onClose, onSubmit }) => {
  const [selectedVaultId, setSelectedVaultId] = useState(
    vaultId || workspace.vaults[0]?.id || ''
  );
  const [amountRaw, setAmountRaw] = useState('500');
  const [note, setNote] = useState('Manual vault drop');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseAmountToCents(amountRaw);
    if (!cents) {
      setError('Enter a valid deposit amount above ₹0.');
      return;
    }
    onSubmit(selectedVaultId, cents, note.trim() || 'Vault deposit');
    onClose();
  };

  return (
    <SheetFrame title={t.plans.contribute} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#6B7F7C]">Target Vault</span>
          <select
            value={selectedVaultId}
            onChange={(e) => setSelectedVaultId(e.target.value)}
            className="w-full min-h-[46px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 text-sm text-[#0E2B2B]"
          >
            {workspace.vaults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#6B7F7C]">Deposit Amount (₹)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            className="w-full min-h-[46px] px-3.5 rounded-2xl bg-white border border-[#0E2B2B]/12 font-mono text-lg text-[#0E2B2B]"
          />
        </label>

        <div className="flex gap-2">
          {['250', '500', '1000'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmountRaw(preset)}
              className="flex-1 min-h-[40px] rounded-full bg-white border border-[#0E2B2B]/10 hover:bg-[#DDEFE3]/50 font-mono text-xs text-[#0E2B2B] cursor-pointer"
            >
              +₹{preset}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#6B7F7C]">Note</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[44px] px-3.5 rounded-2xl bg-white border border-[#0E2B2B]/12 text-sm text-[#0E2B2B]"
          />
        </label>

        {error && (
          <p className="text-xs text-[#E26D5C]" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] text-white font-medium text-sm cursor-pointer"
        >
          Confirm Boost
        </button>
      </form>
    </SheetFrame>
  );
};

const SPLIT_MODES: Array<{ id: SplitMode; label: string }> = [
  { id: 'equal', label: 'Equal' },
  { id: 'exact', label: 'Exact ₹' },
  { id: 'percent', label: 'Percent %' },
  { id: 'shares', label: 'Shares' },
];

const SplitSheet: React.FC<{
  circleId: string;
  prefillTitle?: string;
  prefillAmountCents?: number;
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  onClose: () => void;
  onSubmit: ActionSheetsProps['onAddCircleSplit'];
}> = ({
  circleId,
  prefillTitle,
  prefillAmountCents,
  workspace,
  t,
  onClose,
  onSubmit,
}) => {
  const [selectedCircleId, setSelectedCircleId] = useState(
    circleId || workspace.circles[0]?.id || ''
  );
  const circle =
    workspace.circles.find((c) => c.id === selectedCircleId) || workspace.circles[0];
  const [title, setTitle] = useState(prefillTitle || '');
  const [amountRaw, setAmountRaw] = useState(() =>
    prefillAmountCents
      ? String(
          prefillAmountCents % 100 === 0
            ? prefillAmountCents / 100
            : (prefillAmountCents / 100).toFixed(2)
        )
      : ''
  );
  const [paidBy, setPaidBy] = useState(circle?.members[0]?.id || '');
  const [splitBetweenIds, setSplitBetweenIds] = useState<string[]>(
    circle?.members.map((m) => m.id) || []
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [rawMemberInputs, setRawMemberInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const amountCents = parseAmountToCents(amountRaw) ?? 0;

  const initInputsForMode = (mode: SplitMode, members: string[], totalCents: number) => {
    const next: Record<string, string> = {};
    if (mode === 'shares') {
      members.forEach((id) => {
        next[id] = '1';
      });
    } else if (mode === 'percent') {
      const base = members.length > 0 ? Math.floor(100 / members.length) : 0;
      const rem = members.length > 0 ? 100 % members.length : 0;
      members.forEach((id, idx) => {
        next[id] = String(base + (idx < rem ? 1 : 0));
      });
    } else if (mode === 'exact') {
      const eq = computeSplitShares({
        amountCents: Math.max(0, totalCents),
        memberIds: members,
        mode: 'equal',
      });
      members.forEach((id) => {
        const paise = eq[id] ?? 0;
        next[id] =
          paise > 0
            ? paise % 100 === 0
              ? String(paise / 100)
              : (paise / 100).toFixed(2)
            : '0';
      });
    }
    setRawMemberInputs(next);
  };

  const handleSelectCircle = (nextCircleId: string) => {
    setSelectedCircleId(nextCircleId);
    const nextCircle = workspace.circles.find((c) => c.id === nextCircleId);
    if (nextCircle) {
      const memberIds = nextCircle.members.map((m) => m.id);
      setPaidBy(memberIds[0] || '');
      setSplitBetweenIds(memberIds);
      initInputsForMode(splitMode, memberIds, amountCents);
    }
    setError(null);
  };

  const handleToggleMember = (memberId: string) => {
    setSplitBetweenIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
    setError(null);
  };

  const handleSelectMode = (nextMode: SplitMode) => {
    triggerHaptic(6);
    setSplitMode(nextMode);
    initInputsForMode(nextMode, splitBetweenIds, amountCents);
    setError(null);
  };

  const computedPreview = useMemo(() => {
    if (amountCents <= 0 || splitBetweenIds.length === 0) return {};
    const numericValues: Record<string, number> = {};
    for (const id of splitBetweenIds) {
      const val = Number(rawMemberInputs[id] ?? (splitMode === 'shares' ? '1' : '0'));
      if (splitMode === 'exact') {
        numericValues[id] = Math.max(0, Math.round((Number.isFinite(val) ? val : 0) * 100));
      } else {
        numericValues[id] = Number.isFinite(val) && val >= 0 ? val : 0;
      }
    }
    return computeSplitShares({
      amountCents,
      memberIds: splitBetweenIds,
      mode: splitMode,
      rawValues: numericValues,
    });
  }, [amountCents, splitBetweenIds, splitMode, rawMemberInputs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseAmountToCents(amountRaw);
    if (!cents) {
      setError('Enter a valid positive split amount in ₹.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a description for the shared expense.');
      return;
    }
    if (splitBetweenIds.length === 0) {
      setError('Select at least one circle member.');
      return;
    }

    if (splitMode === 'percent') {
      const totalPct = splitBetweenIds.reduce(
        (sum, id) => sum + (Number(rawMemberInputs[id]) || 0),
        0
      );
      if (Math.abs(totalPct - 100) > 0.01) {
        setError(`Percentages must add up to 100% (currently ${totalPct}%).`);
        return;
      }
    }

    if (splitMode === 'exact') {
      const totalExactPaise = splitBetweenIds.reduce((sum, id) => {
        const parsed = parseAmountToCents(rawMemberInputs[id] || '0');
        const val = parsed ?? (Number(rawMemberInputs[id]) === 0 ? 0 : -1);
        return sum + val;
      }, 0);
      if (totalExactPaise !== cents) {
        setError(
          `Exact amounts must sum to ${fmtINR(cents)} (currently ${fmtINR(Math.max(0, totalExactPaise))}).`
        );
        return;
      }
    }

    if (splitMode === 'shares') {
      const totalShares = splitBetweenIds.reduce(
        (sum, id) => sum + Math.max(0, Number(rawMemberInputs[id] ?? 1) || 0),
        0
      );
      if (totalShares <= 0) {
        setError('Total shares must be greater than zero.');
        return;
      }
    }

    onSubmit({
      circleId: circle.id,
      title: title.trim(),
      amountCents: cents,
      paidByMemberId: paidBy || circle.members[0].id,
      splitBetweenIds,
      splitMode,
      customSplits: splitMode === 'equal' ? undefined : computedPreview,
    });
    onClose();
  };

  const submitLabel =
    splitMode === 'equal'
      ? 'Split Equally'
      : splitMode === 'exact'
        ? 'Save Exact Split'
        : splitMode === 'percent'
          ? 'Save Percent Split'
          : 'Save Shares Split';

  return (
    <SheetFrame title={t.circles.addSplit} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#6B7F7C]">Circle</span>
          <select
            value={selectedCircleId}
            onChange={(e) => handleSelectCircle(e.target.value)}
            className="w-full min-h-[46px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 text-sm text-[#0E2B2B]"
          >
            {workspace.circles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#6B7F7C]">What was split?</span>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="Swiggy midnight biryani"
            className="w-full min-h-[46px] px-3.5 rounded-2xl bg-white border border-[#0E2B2B]/12 text-sm text-[#0E2B2B]"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#6B7F7C]">Total Amount (₹)</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountRaw}
              onChange={(e) => {
                setAmountRaw(e.target.value);
                setError(null);
              }}
              placeholder="480"
              className="w-full min-h-[46px] px-3.5 rounded-2xl bg-white border border-[#0E2B2B]/12 font-mono text-lg text-[#0E2B2B]"
            />
          </label>

          {circle && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#6B7F7C]">Paid By</span>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 text-sm text-[#0E2B2B]"
              >
                {circle.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Split Between Member Chips */}
        {circle && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[#6B7F7C]">Split Between</span>
            <div className="flex flex-wrap gap-1.5">
              {circle.members.map((m) => {
                const included = splitBetweenIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={included}
                    onClick={() => handleToggleMember(m.id)}
                    className={`min-h-[34px] px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      included
                        ? 'bg-[#0B3B3A] text-white'
                        : 'bg-white border border-[#0E2B2B]/12 text-[#6B7F7C]'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Split Mode Tabs */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-[#6B7F7C]">Split Mode</span>
          <div
            role="tablist"
            aria-label="Split mode"
            className="grid grid-cols-4 gap-1 p-1 rounded-full bg-white border border-[#0E2B2B]/10"
          >
            {SPLIT_MODES.map((m) => {
              const active = splitMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSelectMode(m.id)}
                  className={`min-h-[34px] rounded-full text-[11px] font-medium cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0B3B3A] ${
                    active
                      ? 'bg-[#0B3B3A] text-white shadow-sm'
                      : 'bg-transparent text-[#6B7F7C] hover:text-[#0E2B2B]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-member Split Inputs + Live ₹ Breakdown */}
        {circle && amountCents > 0 && (
          <div className="rounded-2xl bg-white border border-[#0E2B2B]/10 p-3 space-y-2">
            {splitBetweenIds.map((memberId) => {
              const member = circle.members.find((m) => m.id === memberId);
              if (!member) return null;
              const shareCents = computedPreview[memberId] ?? 0;
              return (
                <div key={memberId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#0E2B2B] truncate">{member.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {splitMode !== 'equal' && (
                      <label className="flex items-center gap-1">
                        <span className="sr-only">
                          {splitMode} value for {member.name}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step={splitMode === 'shares' ? '1' : '0.01'}
                          aria-label={`${member.name} ${splitMode}`}
                          value={rawMemberInputs[memberId] ?? (splitMode === 'shares' ? '1' : '0')}
                          onChange={(e) => {
                            setRawMemberInputs((prev) => ({
                              ...prev,
                              [memberId]: e.target.value,
                            }));
                            setError(null);
                          }}
                          className="w-20 min-h-[34px] px-2 rounded-xl bg-[#F8FAF8] border border-[#0E2B2B]/12 font-mono text-xs text-right text-[#0E2B2B]"
                        />
                        <span className="text-[11px] text-[#6B7F7C] w-4">
                          {splitMode === 'exact' ? '₹' : splitMode === 'percent' ? '%' : 'x'}
                        </span>
                      </label>
                    )}
                    <span className="font-mono font-medium text-[#0B3B3A] tabular-nums w-20 text-right">
                      {fmtINR(shareCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs text-[#E26D5C]" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] text-white font-medium text-sm cursor-pointer"
        >
          {submitLabel}
        </button>
      </form>
    </SheetFrame>
  );
};

const UPI_APPS = ['GPay', 'PhonePe', 'BHIM UPI', 'Paytm'] as const;

const SettleSheet: React.FC<{
  circleId: string;
  transfer: CircleDebtTransfer;
  workspace: MintlyWorkspaceState;
  onClose: () => void;
  onConfirm: ActionSheetsProps['onConfirmCircleSettle'];
}> = ({ circleId, transfer, workspace, onClose, onConfirm }) => {
  const circle = workspace.circles.find((c) => c.id === circleId);
  const fromMember = circle?.members.find((m) => m.id === transfer.fromMemberId);
  const toMember = circle?.members.find((m) => m.id === transfer.toMemberId);
  const selfInvolved = Boolean(fromMember?.isSelf || toMember?.isSelf);
  const selfIsPayer = Boolean(fromMember?.isSelf);

  const [upiApp, setUpiApp] = useState<string>('GPay');
  const [accountId, setAccountId] = useState<string>(workspace.accounts[0]?.id || 'acc_bank');
  const [updateBalance, setUpdateBalance] = useState<boolean>(selfInvolved);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic([12, 30, 18]);
    onConfirm({
      circleId,
      fromMemberId: transfer.fromMemberId,
      toMemberId: transfer.toMemberId,
      amountCents: transfer.amountCents,
      upiApp,
      accountId: updateBalance && selfInvolved ? accountId : undefined,
    });
    onClose();
  };

  return (
    <SheetFrame title="Settle via UPI" onClose={onClose}>
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="rounded-[24px] bg-[#0B3B3A] text-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-[#A9D6B8]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Simulated UPI Transfer</span>
            </span>
            <span className="font-mono">{circle?.name || 'Circle'}</span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/75">
                {transfer.fromName} paying {transfer.toName}
              </p>
              <p className="font-mono text-xs text-[#A9D6B8] truncate mt-0.5">
                {transfer.toUpiId || `${transfer.toName.toLowerCase().replace(/\s+/g, '')}@okupi`}
              </p>
            </div>
            <p className="font-display text-3xl font-semibold tracking-[-0.02em] tabular-nums shrink-0">
              {fmtINR(transfer.amountCents)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-[#6B7F7C]">Choose UPI App</span>
          <div className="grid grid-cols-4 gap-2">
            {UPI_APPS.map((app) => {
              const active = upiApp === app;
              return (
                <button
                  key={app}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    triggerHaptic(6);
                    setUpiApp(app);
                  }}
                  className={`min-h-[40px] rounded-2xl text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0B3B3A] text-white'
                      : 'bg-white border border-[#0E2B2B]/12 text-[#0E2B2B]'
                  }`}
                >
                  {app}
                </button>
              );
            })}
          </div>
        </div>

        {selfInvolved && (
          <div className="rounded-2xl bg-white border border-[#0E2B2B]/10 p-3.5 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-xs font-medium text-[#0E2B2B]">
                {selfIsPayer
                  ? 'Debit from my Mintly account'
                  : 'Credit receipt to my Mintly account'}
              </span>
              <input
                type="checkbox"
                checked={updateBalance}
                onChange={(e) => setUpdateBalance(e.target.checked)}
                className="w-4 h-4 accent-[#0B3B3A]"
              />
            </label>

            {updateBalance && (
              <label className="block space-y-1">
                <span className="text-[11px] text-[#6B7F7C]">Account</span>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#F8FAF8] border border-[#0E2B2B]/12 text-xs text-[#0E2B2B]"
                >
                  {workspace.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({fmtINR(acc.balanceCents)})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] text-white font-medium text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>
            {selfIsPayer
              ? `Pay & Settle ${fmtINR(transfer.amountCents)} via ${upiApp}`
              : `Record UPI Settlement (${fmtINR(transfer.amountCents)})`}
          </span>
        </button>
      </form>
    </SheetFrame>
  );
};

const ImportSheet: React.FC<{
  onClose: () => void;
  onImportBatch: ActionSheetsProps['onImportBatch'];
}> = ({ onClose, onImportBatch }) => {
  const [rawText, setRawText] = useState(
    'Chai Tapri, 30, dining\nLocal Xerox Shop, 48, textbooks\nBlinkit, 240, groceries'
  );
  const [sampleIndex, setSampleIndex] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleTrySampleSms = () => {
    triggerHaptic(8);
    const chosen = SAMPLE_INDIAN_BANK_SMS[sampleIndex % SAMPLE_INDIAN_BANK_SMS.length];
    setRawText(chosen.sms);
    setSampleIndex((prev) => prev + 1);
    setStatus(`Loaded ${chosen.bank} SMS sample — tap Import to parse.`);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await onImportBatch(rawText);
      const via =
        res.parserUsed === 'gemini'
          ? 'Gemini AI'
          : res.parserUsed === 'regex'
            ? 'SMS parser'
            : 'CSV parser';
      setStatus(
        `Imported ${res.addedCount} new · skipped ${res.duplicateCount} duplicate(s) (${via}).`
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetFrame title="Import SMS / CSV" onClose={onClose}>
      <form onSubmit={handleImport} className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#6B7F7C]">
            Paste Indian bank SMS alerts or CSV
          </span>
          <button
            type="button"
            onClick={handleTrySampleSms}
            className="min-h-[34px] px-3 rounded-full bg-[#DDEFE3] hover:bg-[#cbe6d4] text-[11px] font-medium text-[#0E2B2B] cursor-pointer whitespace-nowrap shrink-0"
          >
            Try sample SMS
          </button>
        </div>

        {/* 5 Realistic Indian Bank SMS Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto mintly-no-scrollbar pb-0.5">
          {SAMPLE_INDIAN_BANK_SMS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                triggerHaptic(6);
                setRawText(sample.sms);
                setStatus(null);
              }}
              className="min-h-[32px] px-2.5 rounded-full bg-white border border-[#0E2B2B]/10 hover:bg-[#DDEFE3]/50 text-[11px] font-medium text-[#6B7F7C] hover:text-[#0E2B2B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setRawText(SAMPLE_INDIAN_BANK_SMS.map((s) => s.sms).join('\n'));
              setStatus(null);
            }}
            className="min-h-[32px] px-2.5 rounded-full bg-white border border-[#0E2B2B]/15 hover:bg-[#F3EFDC] text-[11px] font-medium text-[#0B3B3A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            All 5 SMS
          </button>
        </div>

        <label className="block">
          <span className="sr-only">Bank SMS alerts or CSV rows</span>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste bank UPI SMS alerts or CSV lines (Merchant, Amount, Category)..."
            className="w-full p-3 rounded-2xl bg-white border border-[#0E2B2B]/12 font-mono text-xs text-[#0E2B2B] focus:outline-none focus:ring-2 focus:ring-[#0B3B3A]"
          />
        </label>

        {status && (
          <p role="status" className="text-xs font-medium text-[#0B3B3A]">
            {status}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[48px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] disabled:opacity-50 text-white font-medium text-sm cursor-pointer"
        >
          {busy ? 'Parsing & Importing...' : 'Run Idempotent Import'}
        </button>
      </form>
    </SheetFrame>
  );
};

const RewardsSheet: React.FC<{
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  onClose: () => void;
  onUnlockReward: (itemId: string, costCoins: number, equip?: boolean) => void;
}> = ({ workspace, t, onClose, onUnlockReward }) => {
  const rewards = workspace.rewards ?? {
    coins: 0,
    streakDays: 1,
    unlockedItemIds: [],
    equippedAccessoryId: null,
  };
  const isHinglish = workspace.profile.language === 'hinglish';

  return (
    <SheetFrame title={t.extras.mintCoins} onClose={onClose}>
      <div className="space-y-4">
        {/* Hero Balance + Live Mochi Preview */}
        <div className="rounded-[24px] bg-[#0B3B3A] p-4 text-white flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-medium text-[#A9D6B8]">
              <Coins className="w-3.5 h-3.5" />
              <span>{rewards.streakDays}-day budget streak</span>
            </div>
            <p className="font-display text-3xl font-medium tracking-[-0.02em] tabular-nums">
              {rewards.coins} Coins
            </p>
            <p className="text-[11px] text-white/75">
              +10 per expense · +25 vault boost · +15 UPI settle
            </p>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <MochiMascot
              mood="proud"
              accessory={rewards.equippedAccessoryId}
              size={72}
              interactive={false}
            />
          </div>
        </div>

        {/* Cosmetic Catalog */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-[#6B7F7C]">Mochi Cosmetic Closet</p>
          {MOCHI_ACCESSORIES.map((item) => {
            const unlocked = rewards.unlockedItemIds.includes(item.id);
            const equipped = rewards.equippedAccessoryId === item.id;
            const canAfford = rewards.coins >= item.costCoins;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-[#0E2B2B]/10 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F7F4] flex items-center justify-center shrink-0">
                    <MochiMascot mood="happy" accessory={item.id} size={44} interactive={false} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0E2B2B] truncate">
                      {isHinglish ? item.hinglishLabel : item.label}
                    </p>
                    <p className="text-[11px] text-[#6B7F7C] line-clamp-1">{item.description}</p>
                    <p className="text-[11px] font-mono text-[#0B3B3A] mt-0.5">
                      {unlocked ? 'Unlocked' : `${item.costCoins} Mint Coins`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!unlocked && !canAfford}
                  onClick={() => {
                    triggerHaptic(10);
                    onUnlockReward(item.id, item.costCoins, true);
                  }}
                  className={`min-h-[38px] px-3.5 rounded-full text-xs font-medium shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                    equipped
                      ? 'bg-[#DDEFE3] text-[#0B3B3A]'
                      : unlocked
                        ? 'bg-[#0B3B3A] text-white'
                        : canAfford
                          ? 'bg-[#0B3B3A] hover:bg-[#14504D] text-white'
                          : 'bg-[#ECEFED] text-[#6B7F7C] opacity-60 cursor-not-allowed'
                  }`}
                >
                  {equipped && <Check className="w-3.5 h-3.5" />}
                  <span>
                    {equipped ? 'Equipped' : unlocked ? 'Equip' : `Unlock · ${item.costCoins}`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </SheetFrame>
  );
};

const MonthlyReportSheet: React.FC<{
  monthlyReport: MonthlyMoneyReport;
  budgets: BudgetStatus[];
  t: TranslationBundle;
  onClose: () => void;
}> = ({ monthlyReport, budgets, t, onClose }) => {
  const deltaSign = monthlyReport.deltaPercent > 0 ? '+' : '';
  const topCatLabel = monthlyReport.topCategory
    ? t.categories[monthlyReport.topCategory]
    : 'Food & Chai';

  return (
    <SheetFrame title={t.extras.moneyReport} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-[24px] bg-[#0B3B3A] p-5 text-white space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#DDEFE3]">
              Cycle {monthlyReport.monthKey} vs {monthlyReport.previousMonthKey}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium ${
                monthlyReport.deltaPercent <= 0
                  ? 'bg-[#A9D6B8] text-[#0E2B2B]'
                  : 'bg-[#E8B64C] text-[#0E2B2B]'
              }`}
            >
              {deltaSign}
              {monthlyReport.deltaPercent}% spend
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-[11px] text-white/70">Total Spent</p>
              <p className="font-display text-2xl font-medium tabular-nums">
                {fmtINR(monthlyReport.totalSpentCents)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/70">Net Saved</p>
              <p className="font-display text-2xl font-medium text-[#A9D6B8] tabular-nums">
                {fmtINR(monthlyReport.savedCents)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white border border-[#0E2B2B]/10 p-3.5">
            <p className="text-[11px] text-[#6B7F7C]">Top Category</p>
            <p className="text-sm font-medium text-[#0E2B2B] mt-0.5">{topCatLabel}</p>
            <p className="font-mono text-xs text-[#0B3B3A] mt-0.5 tabular-nums">
              {fmtINR(monthlyReport.topCategorySpentCents)}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-[#0E2B2B]/10 p-3.5">
            <p className="text-[11px] text-[#6B7F7C]">Calmest Spend Day</p>
            <p className="text-sm font-medium text-[#0E2B2B] mt-0.5">
              {monthlyReport.bestDayLabel || '14 Nov'}
            </p>
            <p className="font-mono text-xs text-[#0B3B3A] mt-0.5 tabular-nums">
              {fmtINR(monthlyReport.bestDaySpentCents)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#0E2B2B]/10 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#6B7F7C]">Category Breakdown</p>
            <p className="text-[11px] font-mono text-[#6B7F7C]">
              Income: {fmtINR(monthlyReport.totalIncomeCents)}
            </p>
          </div>
          {budgets.slice(0, 5).map((b) => {
            const pct = Math.min(100, Math.round(b.utilizationRatio * 100));
            return (
              <div key={b.budget.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#0E2B2B]">
                    {t.categories[b.budget.category]}
                  </span>
                  <span className="font-mono text-[#6B7F7C] tabular-nums">
                    {fmtINR(b.spentCents)} / {fmtINR(b.budget.limitCents)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#ECEFED] overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full ${
                      b.status === 'exceeded'
                        ? 'bg-[#E26D5C]'
                        : b.status === 'warning'
                          ? 'bg-[#E8B64C]'
                          : 'bg-[#0B3B3A]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SheetFrame>
  );
};

const SettingsSheet: React.FC<{
  workspace: MintlyWorkspaceState;
  t: TranslationBundle;
  authUserEmail: string | null;
  cloudBusy: boolean;
  onClose: () => void;
  onUpdateSettings: ActionSheetsProps['onUpdateSettings'];
  onOpenRewards: () => void;
  onOpenReport: () => void;
  onOpenOnboarding: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  onResetWorkspace: () => void;
  onOpenStyleGuide?: () => void;
  onOpenBrandStudio?: () => void;
}> = ({
  workspace,
  t,
  authUserEmail,
  cloudBusy,
  onClose,
  onUpdateSettings,
  onOpenRewards,
  onOpenReport,
  onOpenOnboarding,
  onGoogleSignIn,
  onGoogleSignOut,
  onResetWorkspace,
  onOpenStyleGuide,
  onOpenBrandStudio,
}) => {
  const [allowanceInput, setAllowanceInput] = useState(
    String(Math.round(workspace.profile.allowanceAmountCents / 100))
  );
  const [nextDate, setNextDate] = useState(workspace.profile.nextAllowanceIso);
  const rewards = workspace.rewards ?? { coins: 0, streakDays: 1 };

  return (
    <SheetFrame title={t.settings.profileTitle} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#0E2B2B]">{workspace.profile.displayName}</p>
            <p className="text-xs text-[#6B7F7C]">
              {workspace.profile.university || 'Student Workspace'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRewards}
            className="min-h-[36px] px-3 rounded-full bg-[#DDEFE3] hover:bg-[#cbe6d4] text-xs font-medium text-[#0B3B3A] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{rewards.coins} Coins</span>
          </button>
        </div>

        {/* Language Selector (English / Hinglish) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B7F7C]">{t.settings.language}</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { code: 'en', label: 'English' },
                { code: 'hinglish', label: 'Hinglish' },
              ] as const
            ).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onUpdateSettings({ language: lang.code })}
                className={`min-h-[42px] rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  workspace.profile.language === lang.code
                    ? 'bg-[#0B3B3A] text-white'
                    : 'bg-white text-[#6B7F7C] border border-[#0E2B2B]/10'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Single Currency Indicator (INR) */}
        <div className="flex items-center justify-between px-4 min-h-[44px] rounded-2xl bg-white border border-[#0E2B2B]/10">
          <span className="text-xs font-medium text-[#6B7F7C]">{t.settings.currency}</span>
          <span className="font-mono text-xs font-medium text-[#0E2B2B]">INR (₹)</span>
        </div>

        {/* Allowance Cycle Tuning */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#6B7F7C]">
              {t.settings.allowanceCycle} (₹)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={allowanceInput}
              onChange={(e) => setAllowanceInput(e.target.value)}
              onBlur={() => {
                const cents = parseAmountToCents(allowanceInput);
                if (cents) onUpdateSettings({ allowanceAmountCents: cents });
              }}
              className="w-full min-h-[44px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 font-mono text-sm text-[#0E2B2B]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#6B7F7C]">Next Pocket Money</span>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => {
                setNextDate(e.target.value);
                if (e.target.value) onUpdateSettings({ nextAllowanceIso: e.target.value });
              }}
              className="w-full min-h-[44px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 font-mono text-xs text-[#0E2B2B]"
            />
          </label>
        </div>

        {/* Quick Tools: Monthly Report, Rewards Closet, Setup Wizard */}
        <div className="space-y-2 pt-2 border-t border-[#0E2B2B]/[0.08]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[42px] px-3 rounded-full bg-white border border-[#0E2B2B]/12 hover:bg-[#DDEFE3]/50 text-xs font-medium text-[#0E2B2B] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#0B3B3A]" />
              <span>{t.extras.moneyReport}</span>
            </button>
            <button
              type="button"
              onClick={onOpenRewards}
              className="min-h-[42px] px-3 rounded-full bg-white border border-[#0E2B2B]/12 hover:bg-[#F3EFDC] text-xs font-medium text-[#0E2B2B] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8B64C]" />
              <span>Mochi Closet</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="w-full min-h-[42px] px-3 rounded-full bg-[#DDEFE3]/70 hover:bg-[#DDEFE3] text-xs font-medium text-[#0B3B3A] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t.extras.setupWizard}</span>
          </button>
        </div>

        {/* Design Pages Quick Access */}
        {(onOpenStyleGuide || onOpenBrandStudio) && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#0E2B2B]/[0.08]">
            {onOpenStyleGuide && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStyleGuide();
                }}
                className="min-h-[42px] px-3 rounded-full bg-[#DDEFE3] hover:bg-[#cbe6d4] text-xs font-medium text-[#0E2B2B] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Style Guide</span>
              </button>
            )}
            {onOpenBrandStudio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBrandStudio();
                }}
                className="min-h-[42px] px-3 rounded-full bg-white border border-[#0E2B2B]/12 hover:bg-[#F3EFDC] text-xs font-medium text-[#0E2B2B] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Brand Studio</span>
              </button>
            )}
          </div>
        )}

        {/* Cloud Persistence & Reset Demo */}
        <div className="pt-4 border-t border-[#0E2B2B]/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B7F7C]">{t.settings.cloudSync}</span>
            <span className="text-xs font-mono text-[#0E2B2B]">
              {authUserEmail ? authUserEmail : 'Local storage'}
            </span>
          </div>

          {authUserEmail ? (
            <button
              type="button"
              onClick={onGoogleSignOut}
              disabled={cloudBusy}
              className="w-full min-h-[44px] rounded-full bg-white border border-[#0E2B2B]/12 text-xs font-medium text-[#0E2B2B] flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.settings.signOut}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={cloudBusy}
              className="w-full min-h-[44px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>{t.settings.signInGoogle}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onResetWorkspace();
              onClose();
            }}
            className="w-full min-h-[44px] rounded-full bg-transparent hover:bg-[#E26D5C]/12 text-xs font-medium text-[#6B7F7C] hover:text-[#9B2F21] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.settings.resetDemo}</span>
          </button>

          <p className="text-[11px] text-center text-[#6B7F7C]">
            Demo data. Not a real financial app.
          </p>
        </div>
      </div>
    </SheetFrame>
  );
};
