import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Delete,
  QrCode,
  Snowflake,
  X,
} from 'lucide-react';
import type {
  IncomeSource,
  MintlyWorkspaceState,
  PaymentMode,
  SpendingCategory,
} from '../shared/types';
import type { TranslationBundle } from '../shared/i18n';
import {
  SAMPLE_UPI_QR_CODES,
  computeRoundUpPaise,
  fmtINR,
  parseAmountToCents,
  parseUpiQrUri,
  suggestCategoryForMerchant,
} from '../shared/finance';
import { SPRING_BOUNCY, triggerHaptic } from '../shared/motion';
import { CATEGORY_STYLE } from './CategoryArt';
import { Icon } from './brand/Icon';
import { SlideToConfirm } from './SlideToConfirm';
import type { CardControlState } from './CardCarousel';

const EXPENSE_CATEGORIES: SpendingCategory[] = [
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

const INCOME_SOURCES: Array<{ id: IncomeSource; label: string }> = [
  { id: 'pocket_money', label: 'Pocket Money' },
  { id: 'scholarship', label: 'Scholarship' },
  { id: 'tutoring', label: 'Peer Tutoring' },
  { id: 'stipend', label: 'Stipend' },
  { id: 'gift', label: 'Gift / Shagun' },
  { id: 'refund', label: 'Refund' },
];

const QUICK_MERCHANTS: Record<'expense' | 'income', string[]> = {
  expense: ['Chai Tapri', 'College Canteen', 'Swiggy', 'Blinkit', 'Rapido', 'Local Xerox'],
  income: ['Pocket Money', 'Scholarship', 'Peer Tutoring', 'Gift (Shagun)'],
};

const PAID_VIA_MODES: Array<{ id: PaymentMode; label: string }> = [
  { id: 'upi', label: 'UPI' },
  { id: 'upi_lite', label: 'UPI Lite' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Mess Card' },
];

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'] as const;

function inferPaymentMode(accountType?: string): PaymentMode {
  if (accountType === 'upi_lite') return 'upi_lite';
  if (accountType === 'cash') return 'cash';
  if (accountType === 'mess_card' || accountType === 'campus_card') return 'card';
  return 'upi';
}

interface TransactionBottomSheetProps {
  defaultType: 'expense' | 'income';
  workspace: MintlyWorkspaceState;
  cardControls: Record<string, CardControlState>;
  t: TranslationBundle;
  onClose: () => void;
  onSubmit: (payload: {
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
}

export const TransactionBottomSheet: React.FC<TransactionBottomSheetProps> = ({
  defaultType,
  workspace,
  cardControls,
  t,
  onClose,
  onSubmit,
}) => {
  const spendAccounts = workspace.accounts;
  const [txType, setTxType] = useState<'expense' | 'income'>(defaultType);
  const [amountStr, setAmountStr] = useState('0');
  const [merchant, setMerchant] = useState('');
  const [paidToUpiId, setPaidToUpiId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<SpendingCategory>(
    defaultType === 'income' ? 'income' : 'dining'
  );
  const [manualCategoryPicked, setManualCategoryPicked] = useState(false);
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('pocket_money');
  const [accountId, setAccountId] = useState(
    spendAccounts[0]?.id || 'acc_bank'
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(() =>
    defaultType === 'income' ? 'bank' : inferPaymentMode(spendAccounts[0]?.type)
  );
  const [error, setError] = useState<string | null>(null);

  // Camera UPI QR Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'starting' | 'live' | 'simulated'>('starting');
  const [selectedSampleQrId, setSelectedSampleQrId] = useState(SAMPLE_UPI_QR_CODES[0].id);
  const [customQrUri, setCustomQrUri] = useState('');
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);
  const [qrLockPulse, setQrLockPulse] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const merchantSuggestions = useMemo(() => {
    const history = workspace.transactions
      .filter((tx) => tx.type === txType)
      .map((tx) => tx.merchant);
    return Array.from(
      new Set([
        ...QUICK_MERCHANTS[txType],
        ...(txType === 'expense'
          ? ['Zomato', 'Airtel Prepaid', 'Nescafe Stall', 'Metro DMRC', 'Apollo Pharmacy']
          : ['Internship Stipend', 'Book Refund']),
        ...history,
      ])
    ).slice(0, 16);
  }, [workspace.transactions, txType]);

  const handleMerchantChange = (nextName: string) => {
    setMerchant(nextName);
    setError(null);
    if (txType === 'expense' && !manualCategoryPicked && nextName.trim().length >= 2) {
      setCategory(suggestCategoryForMerchant(nextName, 'expense'));
    }
  };

  const selectedAccount = spendAccounts.find((a) => a.id === accountId) ?? spendAccounts[0];
  const selectedControl = cardControls[accountId];
  const isCardFrozen = txType === 'expense' && Boolean(selectedControl?.frozen);
  const amountCents = parseAmountToCents(amountStr) ?? 0;

  const appendDigit = (key: string) => {
    triggerHaptic(8);
    setError(null);
    setAmountStr((prev) => {
      if (key === 'BACK') {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return `${prev}.`;
      }
      if (prev === '0') return key;
      const [, dec] = prev.split('.');
      if (dec !== undefined && dec.length >= 2) return prev;
      if (prev.replace('.', '').length >= 7) return prev;
      return `${prev}${key}`;
    });
  };

  useEffect(() => {
    if (!scannerOpen) return;
    let cancelled = false;
    let activeStream: MediaStream | null = null;
    setCameraMode('starting');
    setQrFeedback(null);
    setQrLockPulse(false);

    const startCamera = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setCameraMode('simulated');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraMode('live');
      } catch {
        if (!cancelled) setCameraMode('simulated');
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((tr) => tr.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [scannerOpen]);

  const applyScannedQrUri = (rawUri: string) => {
    const parsed = parseUpiQrUri(rawUri);
    if (!parsed) {
      setQrFeedback('Could not read a valid upi://pay QR code (missing pa= VPA).');
      triggerHaptic([20, 40, 20]);
      return;
    }

    triggerHaptic([12, 30, 18]);
    setQrLockPulse(true);
    setMerchant(parsed.merchant);
    setPaidToUpiId(parsed.vpa);
    setManualCategoryPicked(false);
    setCategory(parsed.category);
    setPaymentMode('upi');
    const bankAcc = spendAccounts.find((a) => a.type === 'bank' || a.type === 'checking');
    if (bankAcc) setAccountId(bankAcc.id);

    if (parsed.amountCents) {
      const nextStr =
        parsed.amountCents % 100 === 0
          ? String(parsed.amountCents / 100)
          : (parsed.amountCents / 100).toFixed(2);
      setAmountStr(nextStr);
    }

    const amtDisplay = parsed.amountCents ? ` · ${fmtINR(parsed.amountCents)}` : '';
    setQrFeedback(`Scanned ${parsed.merchant}${amtDisplay} (${parsed.vpa})`);
    setError(null);

    setTimeout(() => {
      setScannerOpen(false);
      setQrLockPulse(false);
    }, 380);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (scannerOpen) {
        if (e.key === 'Escape') setScannerOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (/^[0-9.]$/.test(e.key)) {
        e.preventDefault();
        appendDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        appendDigit('BACK');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, scannerOpen]);

  const handleConfirm = () => {
    const cents = parseAmountToCents(amountStr);
    if (!cents) {
      setError('Enter an amount above ₹0 first.');
      triggerHaptic([20, 40, 20]);
      return;
    }
    if (isCardFrozen) {
      setError('This account is frozen — flip it on Home to unfreeze or switch account.');
      triggerHaptic([20, 40, 20]);
      return;
    }
    const cleanMerchant =
      merchant.trim() ||
      (txType === 'expense'
        ? `${t.categories[category]} Spend`
        : INCOME_SOURCES.find((s) => s.id === incomeSource)?.label || 'Income');

    onSubmit({
      type: txType,
      merchant: cleanMerchant,
      amountCents: cents,
      category: txType === 'income' ? 'income' : category,
      accountId,
      note: '',
      paymentMode: txType === 'income' ? 'bank' : paymentMode,
      paidToUpiId: txType === 'expense' ? paidToUpiId : undefined,
      incomeSource: txType === 'income' ? incomeSource : undefined,
    });
    onClose();
  };

  const formattedSlideAmount = fmtINR(amountCents);
  const activeSampleQr =
    SAMPLE_UPI_QR_CODES.find((q) => q.id === selectedSampleQrId) ?? SAMPLE_UPI_QR_CODES[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#0E2B2B]/35 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={txType === 'expense' ? t.home.addExpense : t.home.addIncome}
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
        className="w-full sm:max-w-[430px] rounded-t-[32px] sm:rounded-[32px] bg-[#F8FAF8] shadow-[0_-18px_50px_rgba(14,43,43,0.18)] border border-white px-5 pt-3 pb-6 max-h-[93vh] overflow-y-auto mintly-no-scrollbar text-[#0E2B2B]"
      >
        <div
          className="w-12 h-1.5 rounded-full bg-[#0E2B2B]/15 mx-auto mb-3 cursor-grab active:cursor-grabbing"
          aria-hidden="true"
        />

        {/* Mode Switcher + Scan QR + Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {scannerOpen ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setScannerOpen(false);
              }}
              className="min-h-[40px] px-3.5 rounded-full bg-[#0E2B2B]/[0.07] hover:bg-[#0E2B2B]/[0.12] text-xs font-medium text-[#0E2B2B] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Entry</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#0E2B2B]/[0.07]">
              {(['expense', 'income'] as const).map((kind) => {
                const active = txType === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      triggerHaptic(8);
                      setTxType(kind);
                      setManualCategoryPicked(false);
                      setPaidToUpiId(undefined);
                      setCategory(kind === 'income' ? 'income' : 'dining');
                      if (kind === 'expense') {
                        setPaymentMode(inferPaymentMode(selectedAccount?.type));
                      }
                      setError(null);
                    }}
                    className={`relative min-h-[38px] px-4 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                      active ? 'text-[#0E2B2B]' : 'text-[#6B7F7C] hover:text-[#0E2B2B]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sheet-tx-type-pill"
                        transition={SPRING_BOUNCY}
                        className="absolute inset-0 rounded-full bg-white shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{kind}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {!scannerOpen && txType === 'expense' && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                transition={SPRING_BOUNCY}
                onClick={() => {
                  triggerHaptic(10);
                  setScannerOpen(true);
                }}
                className="min-h-[40px] px-3.5 rounded-full bg-[#DDEFE3] hover:bg-[#cbe6d4] border border-[#0B3B3A]/15 text-xs font-medium text-[#0E2B2B] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <QrCode className="w-3.5 h-3.5 text-[#0B3B3A]" />
                <span>Scan QR</span>
              </motion.button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="min-h-[44px] min-w-[44px] rounded-full bg-[#0E2B2B]/[0.06] hover:bg-[#0E2B2B]/[0.12] flex items-center justify-center text-[#0E2B2B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {scannerOpen ? (
            <motion.section
              key="qr-scanner-view"
              aria-label="UPI QR Camera Scanner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={SPRING_BOUNCY}
              className="space-y-3.5 pb-1"
            >
              {/* Camera / Simulated Viewfinder */}
              <div className="relative w-full aspect-[4/3] rounded-[26px] overflow-hidden bg-[#0E2B2B] border border-[#0B3B3A]/30 shadow-[0_18px_36px_-14px_rgba(14,43,43,0.45)] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  aria-label="UPI QR camera viewfinder"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    cameraMode === 'live' ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Ambient Simulated Camera Surface when webcam isn't active */}
                {cameraMode !== 'live' && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(169,214,184,0.22),transparent_50%),radial-gradient(circle_at_75%_80%,rgba(243,239,220,0.16),transparent_55%),linear-gradient(155deg,#0B3B3A_0%,#0E2B2B_100%)]"
                  />
                )}

                {/* Top Camera Status Pill */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-[11px] font-medium text-white inline-flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-[#A9D6B8]" />
                    <span>
                      {cameraMode === 'live'
                        ? 'Live Camera'
                        : cameraMode === 'starting'
                          ? 'Starting camera...'
                          : 'Simulated Camera'}
                    </span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md font-mono text-[10px] text-[#DDEFE3]">
                    NPCI UPI QR
                  </span>
                </div>

                {/* Aiming Reticle + Stylized QR Target Card */}
                <div className="relative z-10 w-44 h-44 flex items-center justify-center">
                  {/* Corner Brackets */}
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-[#A9D6B8] rounded-tl-xl" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-[#A9D6B8] rounded-tr-xl" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-[#A9D6B8] rounded-bl-xl" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-[#A9D6B8] rounded-br-xl" />

                  {/* Target Merchant Sticker Preview inside Reticle */}
                  <div className="w-32 h-32 rounded-2xl bg-white/95 shadow-lg p-2.5 flex flex-col items-center justify-between text-center">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#0B3B3A]">
                      BHIM · UPI
                    </span>
                    <svg
                      viewBox="0 0 64 64"
                      className="w-16 h-16 text-[#0E2B2B]"
                      aria-hidden="true"
                    >
                      <rect x="4" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="10" y="10" width="6" height="6" rx="1" fill="currentColor" />
                      <rect x="42" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="48" y="10" width="6" height="6" rx="1" fill="currentColor" />
                      <rect x="4" y="42" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="10" y="48" width="6" height="6" rx="1" fill="currentColor" />
                      <path
                        d="M28 8h6v6h-6zM28 20h10v6H28zM8 28h10v6H8zM24 30h6v10h-6zM36 28h8v6h-8zM50 28h10v6H50zM34 40h12v6H34zM28 50h10v10H28zM44 50h14v10H44z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="text-[10px] font-medium text-[#0E2B2B] truncate w-full">
                      {activeSampleQr.merchant} · {activeSampleQr.amountLabel}
                    </span>
                  </div>

                  {/* Animated Scan Laser Beam */}
                  <motion.div
                    aria-hidden="true"
                    animate={qrLockPulse ? { top: '50%', opacity: 0 } : { top: ['12%', '86%', '12%'] }}
                    transition={
                      qrLockPulse
                        ? { duration: 0.2 }
                        : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                    }
                    className="absolute left-3 right-3 h-0.5 rounded-full bg-[#A9D6B8] shadow-[0_0_12px_#A9D6B8]"
                  />

                  {/* Scan Success Flash Overlay */}
                  <AnimatePresence>
                    {qrLockPulse && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-[#0B3B3A]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 text-white"
                      >
                        <CheckCircle2 className="w-8 h-8 text-[#A9D6B8]" />
                        <span className="text-xs font-medium">QR Read</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Select Target Merchant QR Sticker */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-[#6B7F7C]">
                  Aim at a campus UPI QR sticker to simulate scan
                </p>
                <div className="flex items-center gap-1.5 overflow-x-auto mintly-no-scrollbar">
                  {SAMPLE_UPI_QR_CODES.map((qr) => {
                    const active = qr.id === selectedSampleQrId;
                    return (
                      <button
                        key={qr.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          triggerHaptic(6);
                          setSelectedSampleQrId(qr.id);
                          setQrFeedback(null);
                        }}
                        className={`min-h-[36px] px-3 rounded-full text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#0B3B3A] text-white'
                            : 'bg-white border border-[#0E2B2B]/10 text-[#0E2B2B] hover:bg-[#DDEFE3]/50'
                        }`}
                      >
                        {qr.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Simulate QR Read Button */}
              <button
                type="button"
                onClick={() => applyScannedQrUri(activeSampleQr.uri)}
                className="w-full min-h-[48px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] text-white text-sm font-medium inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#A9D6B8]" />
                <span>Simulate QR Read ({activeSampleQr.label})</span>
              </button>

              {/* Optional Custom upi://pay URI Reader */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customQrUri}
                  onChange={(e) => {
                    setCustomQrUri(e.target.value);
                    setQrFeedback(null);
                  }}
                  placeholder="Or paste upi://pay?pa=...&pn=...&am=..."
                  aria-label="Paste UPI QR URI"
                  className="flex-1 min-h-[40px] px-3.5 rounded-full bg-white border border-[#0E2B2B]/10 font-mono text-[11px] text-[#0E2B2B] placeholder:text-[#6B7F7C] focus:outline-none focus:ring-2 focus:ring-[#0B3B3A]"
                />
                <button
                  type="button"
                  onClick={() => applyScannedQrUri(customQrUri)}
                  className="min-h-[40px] px-4 rounded-full bg-[#DDEFE3] hover:bg-[#cbe6d4] text-xs font-medium text-[#0E2B2B] cursor-pointer shrink-0"
                >
                  Read URI
                </button>
              </div>

              {qrFeedback && (
                <p
                  role="status"
                  className="text-xs font-medium text-[#0B3B3A] text-center px-2"
                >
                  {qrFeedback}
                </p>
              )}
            </motion.section>
          ) : (
            <motion.div
              key="manual-entry-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={SPRING_BOUNCY}
            >

        {/* Big Animated Amount Readout */}
        <div className="text-center py-2">
          <div
            data-testid="custom-numpad-amount"
            aria-live="polite"
            className="inline-flex items-baseline justify-center font-display text-5xl font-medium tracking-[-0.03em] text-[#0E2B2B] tabular-nums"
          >
            <span className="text-2xl text-[#6B7F7C] mr-1">₹</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {amountStr.split('').map((ch, idx) => (
                <motion.span
                  key={`${idx}-${ch}`}
                  initial={{ y: 12, opacity: 0, scale: 0.85 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -10, opacity: 0, scale: 0.85 }}
                  transition={SPRING_BOUNCY}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2.5">
            {['20', '50', '100', '200'].map((preset) => (
              <motion.button
                key={preset}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={SPRING_BOUNCY}
                onClick={() => {
                  triggerHaptic(8);
                  setError(null);
                  setAmountStr(preset);
                }}
                className="min-h-[36px] px-3.5 rounded-full bg-white border border-[#0E2B2B]/10 hover:bg-[#DDEFE3]/50 text-xs font-medium text-[#0E2B2B] tabular-nums cursor-pointer"
              >
                ₹{preset}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category Pills or Income Source Pills */}
        {txType === 'expense' ? (
          <div className="flex items-center gap-2 overflow-x-auto mintly-no-scrollbar py-2 -mx-1 px-1">
            {EXPENSE_CATEGORIES.map((cat) => {
              const active = category === cat;
              const style = CATEGORY_STYLE[cat];
              return (
                <motion.button
                  key={cat}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_BOUNCY}
                  onClick={() => {
                    triggerHaptic(8);
                    setManualCategoryPicked(true);
                    setCategory(cat);
                  }}
                  aria-pressed={active}
                  className={`min-h-[40px] px-3.5 rounded-full text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#0B3B3A] text-white shadow-sm'
                      : 'bg-white border border-[#0E2B2B]/10 text-[#0E2B2B] hover:bg-[#DDEFE3]/40'
                  }`}
                >
                  <Icon
                    name={style.icon}
                    size={15}
                    color={active ? '#A9D6B8' : '#0E2B2B'}
                    accentColor={active ? '#FFFFFF' : '#0B3B3A'}
                  />
                  <span>{t.categories[cat] || style.labelShort}</span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto mintly-no-scrollbar py-2 -mx-1 px-1">
            {INCOME_SOURCES.map((src) => {
              const active = incomeSource === src.id;
              return (
                <motion.button
                  key={src.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_BOUNCY}
                  onClick={() => {
                    triggerHaptic(8);
                    setIncomeSource(src.id);
                    if (!merchant.trim()) setMerchant(src.label);
                  }}
                  aria-pressed={active}
                  className={`min-h-[38px] px-3.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#0B3B3A] text-white shadow-sm'
                      : 'bg-white border border-[#0E2B2B]/10 text-[#0E2B2B] hover:bg-[#DDEFE3]/40'
                  }`}
                >
                  {src.label}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Merchant + Quick Chips + Account & Paid Via Picker */}
        <div className="space-y-2.5 mt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="block">
              <span className="sr-only">Merchant or title</span>
              <input
                type="text"
                list="mintly-merchant-suggestions"
                value={merchant}
                onChange={(e) => handleMerchantChange(e.target.value)}
                placeholder={txType === 'expense' ? 'Paid to (e.g. Chai Tapri)' : 'Where is it from?'}
                className="w-full min-h-[44px] px-4 rounded-2xl bg-white border border-[#0E2B2B]/10 text-sm text-[#0E2B2B] placeholder:text-[#6B7F7C] focus:outline-none focus:ring-2 focus:ring-[#0B3B3A]"
              />
              <datalist id="mintly-merchant-suggestions">
                {merchantSuggestions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="sr-only">Account</span>
              <select
                value={accountId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setAccountId(nextId);
                  const nextAcc = spendAccounts.find((a) => a.id === nextId);
                  if (txType === 'expense') {
                    setPaymentMode(inferPaymentMode(nextAcc?.type));
                  }
                  setError(null);
                }}
                className="w-full min-h-[44px] px-3.5 rounded-2xl bg-white border border-[#0E2B2B]/10 text-sm text-[#0E2B2B] focus:outline-none focus:ring-2 focus:ring-[#0B3B3A]"
              >
                {spendAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {cardControls[acc.id]?.frozen ? '(Frozen)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto mintly-no-scrollbar">
            {QUICK_MERCHANTS[txType].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  handleMerchantChange(name);
                }}
                className="min-h-[34px] px-3 rounded-full bg-white border border-[#0E2B2B]/10 hover:bg-[#DDEFE3]/50 text-[11px] font-medium text-[#6B7F7C] hover:text-[#0E2B2B] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {name}
              </button>
            ))}
          </div>

          {txType === 'expense' && paidToUpiId && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-[#DDEFE3]/70 border border-[#0B3B3A]/15 text-[11px] font-mono text-[#0E2B2B]">
              <span className="truncate">UPI ID: {paidToUpiId}</span>
              <button
                type="button"
                onClick={() => setPaidToUpiId(undefined)}
                className="text-[#6B7F7C] hover:text-[#0E2B2B] text-[10px] font-sans font-medium cursor-pointer shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {txType === 'expense' && (
            <div className="flex items-center gap-1.5 overflow-x-auto mintly-no-scrollbar">
              <span className="text-[11px] font-medium text-[#6B7F7C] shrink-0 pr-1">
                Paid via
              </span>
              {PAID_VIA_MODES.map((m) => {
                const active = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      triggerHaptic(6);
                      setPaymentMode(m.id);
                    }}
                    className={`min-h-[32px] px-3 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#DDEFE3] text-[#0E2B2B] border border-[#0B3B3A]/20'
                        : 'bg-white border border-[#0E2B2B]/10 text-[#6B7F7C] hover:text-[#0E2B2B]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {txType === 'expense' &&
          workspace.roundUp?.enabled &&
          computeRoundUpPaise(amountCents) > 0 && (
            <div
              role="status"
              className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#DDEFE3]/80 border border-[#0B3B3A]/15 text-[11px] font-medium text-[#0B3B3A] flex items-center justify-between gap-2"
            >
              <span>
                +{fmtINR(computeRoundUpPaise(amountCents))} saved via ₹10 round-up
              </span>
              <span className="font-mono text-[10px] text-[#6B7F7C] truncate">
                {workspace.vaults.find((v) => v.id === workspace.roundUp?.targetVaultId)?.title ||
                  'Vault'}
              </span>
            </div>
          )}

        {(isCardFrozen || error) && (
          <div
            role="alert"
            className="mt-2.5 px-3.5 py-2 rounded-2xl bg-[#E26D5C]/15 text-[#9B2F21] text-xs font-medium flex items-center gap-2"
          >
            {isCardFrozen && <Snowflake className="w-3.5 h-3.5 shrink-0" />}
            <span>
              {error || 'Account is frozen — flip card on Home to unfreeze or switch account.'}
            </span>
          </div>
        )}

        {/* Custom Tactile Numpad */}
        <div aria-label="Amount keypad" className="grid grid-cols-3 gap-2 mt-3">
          {NUMPAD_KEYS.map((key) => {
            const isBack = key === 'BACK';
            return (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.93 }}
                transition={SPRING_BOUNCY}
                onClick={() => appendDigit(key)}
                aria-label={isBack ? 'Backspace' : key === '.' ? 'Decimal point' : key}
                className="min-h-[48px] rounded-2xl bg-white hover:bg-[#DDEFE3]/40 border border-[#0E2B2B]/[0.07] font-display text-xl font-medium text-[#0E2B2B] flex items-center justify-center cursor-pointer shadow-[0_2px_6px_-2px_rgba(14,43,43,0.06)] select-none"
              >
                {isBack ? <Delete className="w-5 h-5 text-[#6B7F7C]" /> : key}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4">
          <SlideToConfirm
            label={
              amountCents > 0
                ? txType === 'expense'
                  ? `Slide to log ${formattedSlideAmount}`
                  : `Slide to add ${formattedSlideAmount}`
                : 'Type an amount to slide'
            }
            disabled={amountCents <= 0 || isCardFrozen}
            accentColor={txType === 'expense' ? '#0B3B3A' : '#14504D'}
            onConfirm={handleConfirm}
          />
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
