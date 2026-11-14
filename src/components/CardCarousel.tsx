import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  Check,
  Copy,
  Lock,
  Minus,
  Plus,
  RotateCw,
  SlidersHorizontal,
  Snowflake,
  Unlock,
} from 'lucide-react';
import type { FinancialAccount } from '../shared/types';
import { fmtINR, formatTimeIST12h } from '../shared/finance';
import { SPRING_BOUNCY, SPRING_CARD_FLIP, triggerHaptic } from '../shared/motion';
import { EditorialAmount } from './ui/EditorialAmount';
import { MintlyLogomark } from './brand/MintlyLogo';

export interface CardControlState {
  frozen: boolean;
  dailyLimitCents: number;
}

interface CardCarouselProps {
  accounts: FinancialAccount[];
  cardControls: Record<string, CardControlState>;
  holderName: string;
  totalBalancePaise?: number;
  totalLabel?: string;
  onToggleFreeze: (accountId: string) => void;
  onChangeDailyLimit: (accountId: string, nextLimitCents: number) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

interface AccountTheme {
  gradient: string;
  dotColor: string;
  label: string;
  typeTag: string;
}

function getAccountTheme(type: FinancialAccount['type']): AccountTheme {
  if (type === 'bank' || type === 'checking') {
    return {
      gradient: 'linear-gradient(148deg, #0E4543 0%, #0B3B3A 48%, #062423 100%)',
      dotColor: 'rgba(169, 214, 184, 0.25)',
      label: 'Savings Balance',
      typeTag: 'Bank Account',
    };
  }
  if (type === 'upi_lite') {
    return {
      gradient: 'linear-gradient(148deg, #174B3A 0%, #10382B 50%, #09241B 100%)',
      dotColor: 'rgba(221, 239, 227, 0.24)',
      label: 'UPI Lite Balance',
      typeTag: 'UPI Lite Wallet',
    };
  }
  if (type === 'cash') {
    return {
      gradient: 'linear-gradient(148deg, #1E443B 0%, #14322B 52%, #0B1F1B 100%)',
      dotColor: 'rgba(243, 239, 220, 0.24)',
      label: 'Cash in Hand',
      typeTag: 'Cash Account',
    };
  }
  return {
    gradient: 'linear-gradient(148deg, #1D434B 0%, #133138 52%, #0B2025 100%)',
    dotColor: 'rgba(243, 239, 220, 0.22)',
    label: 'Prepaid Mess Balance',
    typeTag: 'Mess / Canteen Card',
  };
}

const InteractiveAccountFace: React.FC<{
  account: FinancialAccount;
  control: CardControlState;
  holderName: string;
  totalCards: number;
  activeIndex: number;
  flipped: boolean;
  onFlip: () => void;
  onSelectCard: (idx: number) => void;
  onToggleFreeze: (id: string) => void;
  onChangeDailyLimit: (id: string, nextLimitCents: number) => void;
}> = ({
  account,
  control,
  holderName,
  totalCards,
  activeIndex,
  flipped,
  onFlip,
  onSelectCard,
  onToggleFreeze,
  onChangeDailyLimit,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const theme = getAccountTheme(account.type);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rawRotateX = useTransform(pointerY, [0, 1], [6, -6]);
  const rawRotateY = useTransform(pointerX, [0, 1], [-8, 8]);
  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24 });

  const shineX = useTransform(pointerX, [0, 1], ['15%', '85%']);
  const shineY = useTransform(pointerY, [0, 1], ['15%', '85%']);
  const shineOverlay = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced || flipped || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    pointerX.set(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    pointerY.set(Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)));
  };

  const handlePointerLeave = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  const handleCopyUpi = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!account.upiId) return;
    triggerHaptic(8);
    try {
      navigator.clipboard?.writeText(account.upiId);
    } catch {
      // ignore clipboard errors in headless mode
    }
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 1800);
  };

  const syncedTime = account.lastSyncedIso
    ? formatTimeIST12h(account.lastSyncedIso)
    : 'Just now';

  return (
    <div
      data-testid={`mintly-card-${account.id}`}
      data-card-flipped={flipped ? 'true' : 'false'}
      data-card-frozen={control.frozen ? 'true' : 'false'}
      style={{ perspective: 1100 }}
      className="snap-center shrink-0 w-full"
    >
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          transformStyle: 'preserve-3d',
          rotateX: prefersReduced || flipped ? 0 : rotateX,
          rotateY: prefersReduced || flipped ? 0 : rotateY,
        }}
        whileTap={prefersReduced ? undefined : { scale: 0.985 }}
        transition={SPRING_BOUNCY}
        className="relative h-[196px] w-full"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={SPRING_CARD_FLIP}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full h-full"
        >
          {/* FRONT FACE */}
          <div
            role="button"
            tabIndex={flipped ? -1 : 0}
            aria-label={`${account.name}, balance ${fmtINR(account.balanceCents)}. Tap to flip for account details`}
            onClick={() => {
              pointerX.set(0.5);
              pointerY.set(0.5);
              onFlip();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFlip();
              }
            }}
            style={{
              background: theme.gradient,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="absolute inset-0 rounded-[22px] p-5 flex flex-col justify-between overflow-hidden cursor-pointer select-none shadow-[0_18px_36px_-16px_rgba(11,59,58,0.55),inset_0_1px_0_rgba(255,255,255,0.14)] focus-visible:outline-2 focus-visible:outline-[#A9D6B8]"
          >
            {/* Subtle pixel/dot matrix pattern */}
            <div
              aria-hidden="true"
              style={{
                backgroundImage: `radial-gradient(${theme.dotColor} 1px, transparent 1px)`,
                backgroundSize: '7px 7px',
              }}
              className="absolute inset-x-0 top-0 h-28 opacity-80 pointer-events-none [mask-image:linear-gradient(180deg,black_20%,transparent_100%)]"
            />

            {/* Soft pointer shine */}
            {!prefersReduced && (
              <motion.div
                aria-hidden="true"
                style={{ background: shineOverlay }}
                className="absolute inset-0 pointer-events-none"
              />
            )}

            {/* Frozen frost tint */}
            {control.frozen && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#DDEFE3]/15 backdrop-blur-[1.5px] pointer-events-none"
              />
            )}

            {/* Top Row: Account name + Iridescent Holographic Mintly Chip */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-white/65 truncate">
                  {account.institution || 'Mintly'} · {account.name}
                </p>
                {control.frozen && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-medium text-[#DDEFE3]">
                    <Snowflake className="w-3 h-3" />
                    Frozen
                  </span>
                )}
              </div>

              <div
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(169,214,184,0.78) 42%, rgba(243,239,220,0.88) 76%, rgba(186,230,253,0.82) 100%)',
                }}
                className="h-7 px-2.5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center gap-1.5 shrink-0"
              >
                <MintlyLogomark size={14} animateOnLoad={false} />
                <span className="text-[11px] font-semibold tracking-tight text-[#0E2B2B]">
                  Mintly
                </span>
              </div>
            </div>

            {/* Bottom Section: Huge Editorial ₹ Balance + Label + Pagination Dots Pill */}
            <div className="relative flex items-end justify-between gap-2 pt-4">
              <div>
                <EditorialAmount
                  valueCents={account.balanceCents}
                  countUp
                  className="font-display text-[38px] font-medium tracking-[-0.03em] text-white"
                />
                <p className="text-xs font-normal text-white/75 mt-1.5">{theme.label}</p>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/10"
              >
                {Array.from({ length: totalCards }).map((_, idx) => {
                  const isDotActive = idx === activeIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectCard(idx)}
                      aria-label={`Focus account ${idx + 1}`}
                      className="p-0.5 cursor-pointer"
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all ${
                          isDotActive ? 'w-3 bg-white' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BACK FACE (Account type, UPI ID + copy, Last synced IST, Freeze, Limit in ₹) */}
          <div
            onClick={onFlip}
            style={{
              background: 'linear-gradient(155deg, #0E3736 0%, #072221 100%)',
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="absolute inset-0 rounded-[22px] p-4 flex flex-col justify-between overflow-hidden cursor-pointer select-none shadow-[0_18px_36px_-16px_rgba(11,59,58,0.55),inset_0_1px_0_rgba(255,255,255,0.14)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#A9D6B8] truncate">
                  {theme.typeTag} · {account.institution || 'Mintly'}
                </p>
                <p className="text-[11px] text-white/65 mt-0.5">
                  Last synced: {syncedTime} IST
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFlip();
                }}
                aria-label={`Flip ${account.name} back to front`}
                className="min-h-[34px] px-3 rounded-full bg-white/12 hover:bg-white/20 text-xs font-medium text-white inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Front</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic([10, 20, 10]);
                  onToggleFreeze(account.id);
                }}
                aria-pressed={control.frozen}
                className={`min-h-[40px] px-3 rounded-2xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  control.frozen
                    ? 'bg-[#A9D6B8] text-[#0E2B2B]'
                    : 'bg-white/10 hover:bg-white/18 text-white'
                }`}
              >
                {control.frozen ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 shrink-0" />
                    <span>Unfreeze</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0 text-[#E26D5C]" />
                    <span>Freeze</span>
                  </>
                )}
              </button>

              {account.upiId ? (
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="min-h-[40px] px-2.5 rounded-2xl bg-white/10 hover:bg-white/18 text-[11px] font-medium text-white flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#A9D6B8] shrink-0" />
                      <span className="truncate text-[#A9D6B8]">Copied UPI</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#A9D6B8] shrink-0" />
                      <span className="truncate font-mono">{account.upiId}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="min-h-[40px] px-2.5 rounded-2xl bg-white/[0.06] text-[11px] text-white/75 flex items-center justify-center truncate">
                  {account.lastFour ? `Card •••• ${account.lastFour}` : 'Offline Wallet'}
                </div>
              )}
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-2 pt-2 border-t border-white/12"
            >
              <div>
                <p className="text-[11px] text-white/65">Daily Limit</p>
                <p className="font-mono text-xs font-semibold text-[#A9D6B8] tabular-nums">
                  {fmtINR(control.dailyLimitCents)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Decrease daily limit for ${account.name}`}
                  onClick={() => {
                    triggerHaptic(8);
                    onChangeDailyLimit(
                      account.id,
                      Math.max(50000, control.dailyLimitCents - 50000)
                    );
                  }}
                  className="min-h-[34px] min-w-[34px] rounded-full bg-white/12 hover:bg-white/22 text-white flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Increase daily limit for ${account.name}`}
                  onClick={() => {
                    triggerHaptic(8);
                    onChangeDailyLimit(
                      account.id,
                      Math.min(5000000, control.dailyLimitCents + 50000)
                    );
                  }}
                  className="min-h-[34px] min-w-[34px] rounded-full bg-white/12 hover:bg-white/22 text-white flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const CardCarousel: React.FC<CardCarouselProps> = ({
  accounts,
  cardControls,
  holderName,
  totalBalancePaise,
  totalLabel = 'Available Across Accounts',
  onToggleFreeze,
  onChangeDailyLimit,
  onPrimaryAction,
  primaryActionLabel = 'Add Expense',
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({});

  const activeAccount = accounts[activeIndex] ?? accounts[0];

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth || 320;
    const idx = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.max(0, Math.min(accounts.length - 1, idx)));
  };

  const scrollToCard = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(accounts.length - 1, idx));
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      triggerHaptic(8);
      el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
      setActiveIndex(clamped);
    }
  };

  const toggleFlip = (accountId: string) => {
    triggerHaptic(10);
    setFlippedMap((prev) => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const rightHeaderLabel = activeAccount?.lastFour
    ? `x${activeAccount.lastFour}`
    : activeAccount?.upiId
      ? activeAccount.upiId
      : 'Wallet';

  return (
    <section aria-label="Your Accounts" className="relative">
      <div className="mintly-glass-shell rounded-[30px] p-2.5 space-y-2.5">
        {/* Top Notch Strip: Holder Name / Total Across Accounts left, handle/digits right */}
        <div className="relative flex items-center justify-between px-3.5 pt-1 pb-0.5 text-xs gap-2">
          <span className="font-medium text-[#0E2B2B] truncate">
            {totalBalancePaise !== undefined
              ? `${totalLabel}: ${fmtINR(totalBalancePaise)}`
              : holderName}
          </span>
          <span className="font-mono text-[#6B7F7C] tabular-nums shrink-0 truncate max-w-[140px]">
            {rightHeaderLabel}
          </span>
        </div>

        {/* Swipeable Snap Account Carousel */}
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          data-testid="card-carousel"
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory mintly-no-scrollbar rounded-[22px]"
        >
          {accounts.map((account, idx) => (
            <InteractiveAccountFace
              key={account.id}
              account={account}
              control={
                cardControls[account.id] ?? {
                  frozen: Boolean(account.frozen),
                  dailyLimitCents: account.dailyLimitCents ?? 500000,
                }
              }
              holderName={holderName}
              totalCards={accounts.length}
              activeIndex={activeIndex}
              flipped={Boolean(flippedMap[account.id])}
              onFlip={() => toggleFlip(account.id)}
              onSelectCard={scrollToCard}
              onToggleFreeze={onToggleFreeze}
              onChangeDailyLimit={onChangeDailyLimit}
            />
          ))}
        </div>

        {/* Bottom Glass Shell Action Row */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={SPRING_BOUNCY}
            onClick={() => activeAccount && toggleFlip(activeAccount.id)}
            className="min-h-[44px] px-4 rounded-full text-[13px] font-medium text-[#0E2B2B]/80 hover:text-[#0E2B2B] hover:bg-white/40 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 opacity-75" />
            <span>{flippedMap[activeAccount?.id || ''] ? 'Show Card' : 'Manage Card'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={SPRING_BOUNCY}
            onClick={() => {
              triggerHaptic(10);
              onPrimaryAction?.();
            }}
            className="min-h-[44px] px-4 rounded-full bg-white hover:bg-white/95 text-[#0E2B2B] text-[13px] font-medium shadow-[0_8px_20px_-8px_rgba(14,43,43,0.18)] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.25]" />
            <span>{primaryActionLabel}</span>
          </motion.button>
        </div>
      </div>
    </section>
  );
};
