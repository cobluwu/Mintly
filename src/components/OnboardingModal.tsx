import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, X } from 'lucide-react';
import type { IncomeSource, MintlyWorkspaceState, StayType } from '../shared/types';
import { fmtINR, parseAmountToCents } from '../shared/finance';
import { SPRING_BOUNCY, triggerHaptic } from '../shared/motion';
import { MochiMascot } from './brand/MochiMascot';

type VaultGoalKey = 'laptop' | 'trip' | 'emergency' | 'festivals' | 'placement';

interface OnboardingModalProps {
  open: boolean;
  workspace: MintlyWorkspaceState;
  onComplete: (payload: {
    allowanceAmountCents: number;
    allowanceDayOfMonth: number;
    allowanceSource: IncomeSource;
    stayType: StayType;
    selectedVaultKeys: VaultGoalKey[];
  }) => void;
  onSkip: () => void;
}

const ALLOWANCE_PRESETS = [800000, 1200000, 1500000, 2000000]; // ₹8k, ₹12k, ₹15k, ₹20k

const STAY_OPTIONS: Array<{
  id: StayType;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'hostel',
    title: 'College Hostel',
    subtitle: 'Protects Hostel Mess Fee + mobile recharge in your runway.',
  },
  {
    id: 'pg',
    title: 'PG / Shared Flat',
    subtitle: 'Adds PG Rent & Wi-Fi split reserve automatically.',
  },
  {
    id: 'home',
    title: 'Day Scholar (Home)',
    subtitle: 'Skips mess/hostel rent & focuses runway on commute & food.',
  },
];

const VAULT_CHOICES: Array<{
  key: VaultGoalKey;
  title: string;
  targetLabel: string;
}> = [
  { key: 'laptop', title: 'Laptop Fund', targetLabel: '₹1,14,900 goal' },
  { key: 'trip', title: 'Goa Trip', targetLabel: '₹18,000 goal' },
  { key: 'emergency', title: 'Emergency Fund', targetLabel: '₹15,000 goal' },
  { key: 'festivals', title: 'Diwali & Gifts', targetLabel: '₹6,000 goal' },
  { key: 'placement', title: 'Placement Prep Kit', targetLabel: '₹12,000 goal' },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  workspace,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [allowanceRaw, setAllowanceRaw] = useState(
    String(Math.round((workspace.profile.allowanceAmountCents || 1200000) / 100))
  );
  const [resetDay, setResetDay] = useState(workspace.profile.allowanceDayOfMonth || 1);
  const [source, setSource] = useState<IncomeSource>(
    workspace.profile.allowanceSource || 'pocket_money'
  );
  const [stayType, setStayType] = useState<StayType>(
    workspace.profile.stayType || 'hostel'
  );
  const [selectedVaults, setSelectedVaults] = useState<VaultGoalKey[]>([
    'laptop',
    'trip',
    'emergency',
    'festivals',
    'placement',
  ]);

  if (!open) return null;

  const parsedAllowanceCents = parseAmountToCents(allowanceRaw) ?? 1200000;

  const toggleVault = (key: VaultGoalKey) => {
    triggerHaptic(6);
    setSelectedVaults((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleFinish = () => {
    triggerHaptic(14);
    onComplete({
      allowanceAmountCents: parsedAllowanceCents,
      allowanceDayOfMonth: Math.min(28, Math.max(1, resetDay)),
      allowanceSource: source,
      stayType,
      selectedVaultKeys: selectedVaults,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mintly Student Onboarding"
      className="fixed inset-0 z-50 bg-[#0E2B2B]/45 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={SPRING_BOUNCY}
        className="w-full max-w-[430px] rounded-t-[32px] sm:rounded-[32px] bg-[#F7FAF7] border border-white shadow-[0_24px_60px_rgba(14,43,43,0.3)] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Top Row: Step Progress + Skip */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? 'w-7 bg-[#0B3B3A]'
                    : idx < step
                      ? 'w-2.5 bg-[#A9D6B8]'
                      : 'w-2.5 bg-[#DDE5DF]'
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-mono text-[#6B7F7C]">{step + 1}/3</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(6);
                onSkip();
              }}
              className="min-h-[36px] px-3 rounded-full text-xs font-medium text-[#6B7F7C] hover:text-[#0E2B2B] hover:bg-white cursor-pointer"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={onSkip}
              aria-label="Close onboarding"
              className="w-9 h-9 rounded-full bg-[#ECEFED] hover:bg-[#DDE5DF] text-[#0E2B2B] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mochi Welcome Header */}
        <div className="flex items-center gap-3.5">
          <MochiMascot
            mood={step === 2 ? 'celebrating' : step === 1 ? 'happy' : 'chill'}
            accessory={workspace.rewards?.equippedAccessoryId}
            size={64}
            interactive={false}
          />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#6B7F7C]">
              Mintly Campus Setup
            </p>
            <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-[#0E2B2B]">
              {step === 0
                ? 'Monthly pocket money'
                : step === 1
                  ? 'Where do you stay?'
                  : 'Pick your goal vaults'}
            </h2>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="onb-step-0"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.16 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <span className="text-xs font-medium text-[#6B7F7C]">
                  Monthly allowance / stipend (₹)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {ALLOWANCE_PRESETS.map((paise) => {
                    const active = parsedAllowanceCents === paise;
                    return (
                      <button
                        key={paise}
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setAllowanceRaw(String(paise / 100));
                        }}
                        className={`min-h-[38px] rounded-full text-xs font-mono font-medium cursor-pointer ${
                          active
                            ? 'bg-[#0B3B3A] text-white'
                            : 'bg-white border border-[#0E2B2B]/12 text-[#0E2B2B]'
                        }`}
                      >
                        {fmtINR(paise)}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Monthly pocket money in rupees"
                  value={allowanceRaw}
                  onChange={(e) => setAllowanceRaw(e.target.value)}
                  className="w-full min-h-[46px] px-4 rounded-2xl bg-white border border-[#0E2B2B]/12 font-mono text-base text-[#0E2B2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#6B7F7C]">Arrives on day</span>
                  <select
                    aria-label="Allowance day of month"
                    value={resetDay}
                    onChange={(e) => setResetDay(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 text-xs text-[#0E2B2B]"
                  >
                    {[1, 5, 7, 10, 15, 25].map((d) => (
                      <option key={d} value={d}>
                        {d === 1 ? '1st of month' : `${d}th of month`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[#6B7F7C]">Primary source</span>
                  <select
                    aria-label="Primary allowance source"
                    value={source}
                    onChange={(e) => setSource(e.target.value as IncomeSource)}
                    className="w-full min-h-[44px] px-3 rounded-2xl bg-white border border-[#0E2B2B]/12 text-xs text-[#0E2B2B]"
                  >
                    <option value="pocket_money">Pocket Money</option>
                    <option value="scholarship">Scholarship</option>
                    <option value="stipend">Internship Stipend</option>
                    <option value="tutoring">Peer Tutoring</option>
                  </select>
                </label>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="onb-step-1"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.16 }}
              className="space-y-2.5"
            >
              {STAY_OPTIONS.map((opt) => {
                const active = stayType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      triggerHaptic(8);
                      setStayType(opt.id);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      active
                        ? 'bg-[#0B3B3A] text-white border-[#0B3B3A]'
                        : 'bg-white text-[#0E2B2B] border-[#0E2B2B]/10 hover:bg-[#DDEFE3]/40'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{opt.title}</p>
                      <p
                        className={`text-xs mt-1 ${
                          active ? 'text-[#DDEFE3]' : 'text-[#6B7F7C]'
                        }`}
                      >
                        {opt.subtitle}
                      </p>
                    </div>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        active ? 'bg-[#A9D6B8] text-[#0E2B2B]' : 'bg-[#ECEFED] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="onb-step-2"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.16 }}
              className="space-y-2.5"
            >
              <p className="text-xs text-[#6B7F7C]">
                Choose which goals to track with ₹10 round-ups and milestones:
              </p>
              <div className="space-y-2">
                {VAULT_CHOICES.map((vc) => {
                  const active = selectedVaults.includes(vc.key);
                  return (
                    <button
                      key={vc.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleVault(vc.key)}
                      className={`w-full px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ${
                        active
                          ? 'bg-[#DDEFE3] border-[#0B3B3A]/25 text-[#0E2B2B]'
                          : 'bg-white border-[#0E2B2B]/10 text-[#6B7F7C]'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#0E2B2B]">{vc.title}</p>
                        <p className="text-[11px] font-mono text-[#6B7F7C]">{vc.targetLabel}</p>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          active ? 'bg-[#0B3B3A] text-white' : 'bg-[#ECEFED] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <div className="flex items-center gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 2 ? 1 : 0))}
              className="min-h-[48px] px-5 rounded-full bg-white border border-[#0E2B2B]/12 text-sm font-medium text-[#0E2B2B] cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (step < 2) {
                triggerHaptic(8);
                setStep((prev) => (prev === 0 ? 1 : 2));
              } else {
                handleFinish();
              }
            }}
            className="flex-1 min-h-[48px] rounded-full bg-[#0B3B3A] hover:bg-[#14504D] text-white text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {step === 2 && <Sparkles className="w-4 h-4 text-[#A9D6B8]" />}
            <span>{step === 2 ? 'Save & Start Mintly' : 'Continue'}</span>
          </button>
        </div>

        <p className="text-[11px] text-center text-[#6B7F7C]">
          Demo data. Not a real financial app.
        </p>
      </motion.div>
    </div>
  );
};
