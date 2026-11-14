import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import type { FinancialAccount } from '../shared/types';
import { SPRING_BOUNCY } from '../shared/motion';
import { SegmentedToggle } from './ui/SegmentedToggle';
import { FloatingBottomNav, type NavTabKey } from './ui/FloatingBottomNav';
import { CardCarousel, type CardControlState } from './CardCarousel';
import { PromoProgressCard } from './ui/PromoProgressCard';
import { TealChallengeCard } from './ui/TealChallengeCard';
import { ChatComposer } from './ui/ChatComposer';
import { EditorialAmount } from './ui/EditorialAmount';
import { MochiMascot } from './brand/MochiMascot';

interface StyleGuidePageProps {
  onBackToApp: () => void;
}

const COLOR_TOKENS = [
  { name: '--ink', hex: '#0E2B2B', label: 'Ink Teal (Headings)' },
  { name: '--teal-900', hex: '#0B3B3A', label: 'Teal 900 (Hero & CTA)' },
  { name: '--teal-800', hex: '#14504D', label: 'Teal 800 (Depth)' },
  { name: '--sage-300', hex: '#A9D6B8', label: 'Sage 300 (Progress)' },
  { name: '--sage-100', hex: '#DDEFE3', label: 'Sage 100 (Soft Tint)' },
  { name: '--cream', hex: '#F3EFDC', label: 'Cream Glow' },
  { name: '--muted', hex: '#6B7F7C', label: 'Muted Sage Gray' },
  { name: '--amber', hex: '#E8B64C', label: 'Soft Amber' },
  { name: '--coral', hex: '#E26D5C', label: 'Soft Coral' },
];

const SAMPLE_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'sg_bank',
    ownerId: 'sg',
    name: 'Student Savings',
    type: 'bank',
    institution: 'SBI / HDFC Student',
    lastFour: '4821',
    upiId: 'maya.lin@okaxis',
    balanceCents: 845000,
    currency: 'INR',
  },
  {
    id: 'sg_upi_lite',
    ownerId: 'sg',
    name: 'UPI Lite',
    type: 'upi_lite',
    institution: 'BHIM UPI Lite',
    lastFour: '2014',
    upiId: 'maya.lite@okaxis',
    balanceCents: 64000,
    currency: 'INR',
  },
  {
    id: 'sg_mess',
    ownerId: 'sg',
    name: 'Mess / Canteen Card',
    type: 'mess_card',
    institution: 'Hostel Block B',
    lastFour: '9012',
    balanceCents: 98000,
    currency: 'INR',
  },
];

export const StyleGuidePage: React.FC<StyleGuidePageProps> = ({ onBackToApp }) => {
  const [toggleValue, setToggleValue] = useState<'overview' | 'budget'>('overview');
  const [navTab, setNavTab] = useState<NavTabKey>('home');
  const [chatInput, setChatInput] = useState('');
  const [cardControls, setCardControls] = useState<Record<string, CardControlState>>({
    sg_bank: { frozen: false, dailyLimitCents: 250000 },
    sg_upi_lite: { frozen: false, dailyLimitCents: 100000 },
    sg_mess: { frozen: false, dailyLimitCents: 80000 },
  });

  return (
    <div className="min-h-screen relative overflow-x-clip text-[#0E2B2B]">
      {/* Atmospheric Drifting Mesh Gradient + Grain Overlay */}
      <div className="fixed inset-0 -z-20 mintly-atmosphere-bg mintly-atmosphere-drift pointer-events-none" />
      <div className="fixed inset-0 -z-10 mintly-grain-overlay pointer-events-none" />

      <div className="max-w-[430px] mx-auto px-5 pt-6 pb-20 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={SPRING_BOUNCY}
            onClick={onBackToApp}
            className="min-h-[44px] px-4 rounded-full mintly-glass-shell text-xs font-medium text-[#0E2B2B] inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>

          <div className="w-11 h-11 rounded-full bg-white/80 border border-white flex items-center justify-center shadow-sm">
            <MochiMascot mood="chill" size={36} interactive={false} />
          </div>
        </header>

        <section className="space-y-1">
          <h1 className="font-display text-[38px] font-medium tracking-[-0.03em] leading-[1.08] text-[#0E2B2B]">
            Mintly Style Guide
          </h1>
          <p className="text-sm text-[#6B7F7C]">
            Calm light-mode design tokens & signature components
          </p>
        </section>

        {/* 1. Color Tokens */}
        <section className="mintly-white-card p-5 space-y-4">
          <h2 className="text-sm font-medium text-[#6B7F7C]">Color Tokens</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {COLOR_TOKENS.map((tok) => (
              <div key={tok.name} className="space-y-1.5">
                <div
                  style={{ backgroundColor: tok.hex }}
                  className="h-11 rounded-2xl border border-[#0E2B2B]/10 shadow-inner"
                />
                <p className="font-mono text-[10px] font-medium text-[#0E2B2B] truncate">
                  {tok.name}
                </p>
                <p className="text-[10px] text-[#6B7F7C] truncate">{tok.hex}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Typography & Hero Numerals */}
        <section className="mintly-white-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-[#6B7F7C]">
            Typography · Instrument Sans
          </h2>
          <p className="font-display text-[36px] font-medium tracking-[-0.03em] leading-[1.08] text-[#0E2B2B]">
            Welcome back, Maya
          </p>
          <p className="text-xs text-[#6B7F7C]">
            Hero Money Pattern (small ₹ + large whole + small paise)
          </p>
          <div className="pt-1">
            <EditorialAmount
              valueCents={1119050}
              currency="INR"
              countUp={false}
              className="font-display text-[42px] font-medium tracking-[-0.03em] text-[#0E2B2B]"
            />
          </div>
        </section>

        {/* 3. Segmented Pill Toggle */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-medium text-[#6B7F7C]">1. Segmented Pill Toggle</h2>
          <SegmentedToggle
            layoutId="sg-segmented-toggle"
            value={toggleValue}
            onChange={setToggleValue}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'budget', label: 'Budget' },
            ]}
          />
        </section>

        {/* 4. Floating Bottom Navigation */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-medium text-[#6B7F7C]">2. Floating Bottom Nav</h2>
          <FloatingBottomNav
            activeTab={navTab}
            onSelectTab={setNavTab}
            labels={{
              home: 'Home',
              activity: 'Activity',
              plans: 'Plans',
              circles: 'Circles',
              coach: 'Mochi',
            }}
          />
        </section>

        {/* 5. Glass Card Shell */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-medium text-[#6B7F7C]">3. Glass Card Shell</h2>
          <CardCarousel
            accounts={SAMPLE_ACCOUNTS}
            cardControls={cardControls}
            holderName="Maya Lin"
            totalBalancePaise={1007000}
            primaryActionLabel="Add Expense"
            onPrimaryAction={() => {}}
            onToggleFreeze={(id) =>
              setCardControls((prev) => ({
                ...prev,
                [id]: { ...prev[id], frozen: !prev[id].frozen },
              }))
            }
            onChangeDailyLimit={(id, next) =>
              setCardControls((prev) => ({
                ...prev,
                [id]: { ...prev[id], dailyLimitCents: next },
              }))
            }
          />
        </section>

        {/* 6. White Promo/Progress Card */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-medium text-[#6B7F7C]">4. White Progress Card</h2>
          <PromoProgressCard
            icon={<Sparkles className="w-4 h-4" />}
            title="Laptop Fund"
            description="Auto-roundups and monthly boosts bring your engineering laptop goal closer."
            progressLeft="₹68,500 / ₹1,14,900"
            progressRight="60%"
            ratio={68500 / 114900}
            onAction={() => {}}
          />
        </section>

        {/* 7. Dark Teal Feature / Challenge Card */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-medium text-[#6B7F7C]">5. Dark Teal Feature Card</h2>
          <TealChallengeCard
            title="Food & Chai Plan"
            spentCents={148500}
            limitCents={300000}
            currency="INR"
            streakTitle="Day 5 of 7"
            ctaLabel="View Plan Details"
            onCtaClick={() => {}}
          />
        </section>

        {/* 8. Chat Composer */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-medium text-[#6B7F7C]">6. Chat Composer</h2>
          <ChatComposer
            value={chatInput}
            onChange={setChatInput}
            onSubmit={() => setChatInput('')}
            credits={76}
          />
        </section>

        {/* 9. Button System */}
        <section className="mintly-white-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-[#6B7F7C]">7. Button System</h2>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              className="min-h-[44px] px-5 rounded-full bg-[#0B3B3A] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>View your plan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="min-h-[44px] px-5 rounded-full bg-[#A9D6B8] text-[#0E2B2B] text-xs font-medium cursor-pointer"
            >
              Save to Vault
            </button>
            <button
              type="button"
              className="min-h-[44px] px-5 rounded-full border border-[#0E2B2B]/15 text-[#0E2B2B] text-xs font-medium cursor-pointer"
            >
              Manage Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
