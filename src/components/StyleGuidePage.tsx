import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Filter, Laptop, Sparkles } from 'lucide-react';
import type { FinancialAccount } from '../shared/types';
import {
  AvatarStack,
  Chip,
  EmptyState,
  GlassCard,
  IconBadge,
  PageHeader,
  PageShell,
  Pill,
  SectionHeader,
  Skeleton,
  StatBlock,
  TealFeatureCard,
  WhiteCard,
} from './ui';
import { FloatingBottomNav, type NavTabKey } from './ui/FloatingBottomNav';
import { CardCarousel, type CardControlState } from './CardCarousel';
import { PromoProgressCard } from './ui/PromoProgressCard';
import { TealChallengeCard } from './ui/TealChallengeCard';
import { ChatComposer } from './ui/ChatComposer';

interface StyleGuidePageProps {
  onBackToApp: () => void;
}

const COLOR_TOKENS = [
  { name: '--ink', hex: '#0E2B2B', label: 'Ink Teal' },
  { name: '--teal-900', hex: '#0B3B3A', label: 'Teal 900' },
  { name: '--teal-800', hex: '#14504D', label: 'Teal 800' },
  { name: '--sage-300', hex: '#A9D6B8', label: 'Sage 300' },
  { name: '--sage-100', hex: '#DDEFE3', label: 'Sage 100' },
  { name: '--cream', hex: '#F3EFDC', label: 'Cream Glow' },
  { name: '--muted', hex: '#6B7F7C', label: 'Muted Sage' },
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

const SAMPLE_MEMBERS = [
  { id: 'm1', name: 'Maya Lin', initials: 'ML', color: 'var(--sage-300)' },
  { id: 'm2', name: 'Aarav Patel', initials: 'AP', color: 'var(--cream)' },
  { id: 'm3', name: 'Riya Sharma', initials: 'RS', color: 'var(--sage-100)' },
  { id: 'm4', name: 'Kabir Verma', initials: 'KV', color: 'var(--teal-800)' },
  { id: 'm5', name: 'Devika Nair', initials: 'DN', color: 'var(--amber)' },
  { id: 'm6', name: 'Zoya Khan', initials: 'ZK' },
];

export const StyleGuidePage: React.FC<StyleGuidePageProps> = ({ onBackToApp }) => {
  const [viewMode, setViewMode] = useState<'all' | 'tokens' | 'primitives'>('all');
  const [navTab, setNavTab] = useState<NavTabKey>('home');
  const [activeFilter, setActiveFilter] = useState<'all' | 'dining' | 'upi'>('all');
  const [chatInput, setChatInput] = useState('');
  const [cardControls, setCardControls] = useState<Record<string, CardControlState>>({
    sg_bank: { frozen: false, dailyLimitCents: 250000 },
    sg_upi_lite: { frozen: false, dailyLimitCents: 100000 },
    sg_mess: { frozen: false, dailyLimitCents: 80000 },
  });

  const showTokens = viewMode === 'all' || viewMode === 'tokens';
  const showPrimitives = viewMode === 'all' || viewMode === 'primitives';

  return (
    <PageShell bottomNavPadding={false}>
      <div className="space-y-6 pb-8">
        <PageHeader
          layoutId="sg-page-header-toggle"
          title="Mintly Style Guide"
          subtitle="Shared L0–L3 surfaces, tokens & all primitive variants"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'all', label: 'All' },
            { value: 'tokens', label: 'Tokens' },
            { value: 'primitives', label: 'Primitives' },
          ]}
          mochiMood="chill"
          onAvatarClick={onBackToApp}
          avatarLabel="Return to Mintly Home"
          rightAction={
            <Pill
              variant="glass"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={onBackToApp}
            >
              Home
            </Pill>
          }
        />

        {showTokens && (
          <>
            {/* Color Tokens */}
            <WhiteCard className="space-y-4">
              <SectionHeader title="1. Color Tokens" className="px-0" />
              <div className="grid grid-cols-3 gap-2.5">
                {COLOR_TOKENS.map((tok) => (
                  <div key={tok.name} className="space-y-1.5 min-w-0">
                    <div
                      style={{ backgroundColor: tok.hex }}
                      className="h-11 rounded-[16px] border border-[#0E2B2B]/10 shadow-inner"
                    />
                    <p className="font-mono text-[10px] font-medium text-[var(--ink)] truncate">
                      {tok.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] truncate">
                      {tok.label} · {tok.hex}
                    </p>
                  </div>
                ))}
              </div>
            </WhiteCard>

            {/* Typography & Non-Clipping Wrapping */}
            <WhiteCard className="space-y-3">
              <SectionHeader title="2. Typography & Text-Wrap Discipline" className="px-0" />
              <div className="space-y-2">
                <p className="font-display text-[32px] font-medium tracking-[-0.03em] leading-[1.08] text-[var(--ink)]">
                  Display · Welcome back
                </p>
                <p className="font-display text-lg font-medium tracking-[-0.02em] text-[var(--ink)]">
                  Heading · Campus Savings & Vaults
                </p>
                <p className="text-[14px] text-[var(--ink)] leading-relaxed">
                  Body · Long merchant names wrap up to two clean lines instead of awkwardly clipping mid-word:
                </p>
                <p
                  title="Dining & Coffee · Dining Flex Campus Canteen & Chai Bar"
                  className="text-sm font-medium text-[var(--ink)] line-clamp-2 rounded-[16px] bg-[var(--surface-subtle)] px-3 py-2"
                >
                  Dining & Coffee · Dining Flex Campus Canteen & Midnight Maggi Counter
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Caption · Food & Chai · UPI Lite · Verified
                </p>
                <p className="font-mono text-xs tabular-nums text-[var(--teal-900)]">
                  Mono Figures · ₹14,850.50 · Ref 431900284910
                </p>
              </div>
            </WhiteCard>

            {/* Radii & Elevation L0-L3 */}
            <div className="space-y-3">
              <SectionHeader title="3. Elevation System (L0 – L3)" />
              <GlassCard>
                <p className="text-xs font-semibold text-[var(--ink)]">
                  L1 · GlassCard (55% white, blur 24px, 24px radius)
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Used for account carousel shells, sticky search inputs, and floating controls.
                </p>
              </GlassCard>

              <WhiteCard>
                <p className="text-xs font-semibold text-[var(--ink)]">
                  L2 · WhiteCard (solid white, 24px radius, inner highlight)
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Supports padded, noPadding + divideY row groups, and interactive button mode.
                </p>
              </WhiteCard>

              <TealFeatureCard>
                <p className="text-xs font-semibold text-white">
                  L3 · TealFeatureCard (28px hero radius, dot-grid texture, radial glow)
                </p>
                <p className="text-xs text-white/75 mt-1">
                  Reserved for the primary hero module on each screen.
                </p>
              </TealFeatureCard>
            </div>
          </>
        )}

        {showPrimitives && (
          <>
            {/* Pills & Chips */}
            <WhiteCard className="space-y-4">
              <SectionHeader title="4. Pill & Chip Variants" className="px-0" />
              <div className="flex flex-wrap gap-2">
                <Pill variant="ink" size="md" icon={<ArrowUpRight className="w-3.5 h-3.5" />} onClick={() => {}}>
                  Ink Primary
                </Pill>
                <Pill variant="sage" size="md" onClick={() => {}}>
                  Sage Accent
                </Pill>
                <Pill variant="sage-soft" size="md" onClick={() => {}}>
                  Sage Soft
                </Pill>
                <Pill variant="glass" size="sm" onClick={() => {}}>
                  Glass
                </Pill>
                <Pill variant="ghost" size="sm" onClick={() => {}}>
                  Ghost
                </Pill>
                <Pill variant="danger" size="sm" onClick={() => {}}>
                  Danger
                </Pill>
              </div>

              <div className="pt-2 border-t border-[var(--hairline-soft)] space-y-2.5">
                <p className="text-[11px] font-medium text-[var(--muted)]">
                  Interactive Filter Chips & Semantic Status Chips
                </p>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    label="All"
                    icon={<Filter className="w-3 h-3" />}
                    active={activeFilter === 'all'}
                    onClick={() => setActiveFilter('all')}
                  />
                  <Chip
                    label="Food & Chai"
                    active={activeFilter === 'dining'}
                    onClick={() => setActiveFilter('dining')}
                  />
                  <Chip
                    label="UPI Lite"
                    active={activeFilter === 'upi'}
                    onClick={() => setActiveFilter('upi')}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip variant="sage">+₹10 saved</Chip>
                  <Chip variant="coral">Pending verify</Chip>
                  <Chip variant="amber">Caution pace</Chip>
                  <Chip variant="teal">Verified</Chip>
                  <Chip variant="glass">Auto-roundups ON</Chip>
                </div>
              </div>
            </WhiteCard>

            {/* StatBlock & IconBadge */}
            <WhiteCard className="space-y-4">
              <SectionHeader title="5. StatBlock & IconBadge" className="px-0" />
              <div className="grid grid-cols-2 gap-4">
                <StatBlock
                  label="Hero Balance"
                  valueCents={1119050}
                  size="lg"
                  caption="3 accounts active"
                />
                <StatBlock
                  label="Daily Safe Spend"
                  valueCents={34200}
                  size="md"
                  caption="On track this cycle"
                />
              </div>
              <div className="pt-3 border-t border-[var(--hairline-soft)] flex flex-wrap items-center gap-2.5">
                <IconBadge name="dining" tone="cream" size="sm" shape="circle" />
                <IconBadge name="vault" tone="sage" size="md" shape="circle" />
                <IconBadge name="bills" tone="teal" size="md" shape="rounded" />
                <IconBadge name="expense" tone="coral" size="md" shape="rounded" />
                <IconBadge name="gift" tone="amber" size="lg" shape="rounded" />
                <IconBadge icon={<Laptop className="w-5 h-5" />} tone="neutral" size="lg" shape="circle" />
              </div>
            </WhiteCard>

            {/* AvatarStack & EmptyState */}
            <WhiteCard className="space-y-4">
              <SectionHeader title="6. AvatarStack" className="px-0" />
              <div className="flex items-center justify-between gap-3">
                <AvatarStack members={SAMPLE_MEMBERS.slice(0, 3)} max={4} size={36} />
                <AvatarStack members={SAMPLE_MEMBERS} max={4} size={36} />
              </div>
            </WhiteCard>

            <EmptyState
              title="No matching transactions"
              description="Try clearing your search or checking another account filter."
              mood="thinking"
              actionLabel="Reset Filters"
              onAction={() => setActiveFilter('all')}
            />

            {/* Skeletons */}
            <div className="space-y-3">
              <SectionHeader title="7. Skeleton Shimmer States" />
              <Skeleton variant="hero-teal" />
              <WhiteCard noPadding divideY>
                <Skeleton variant="row" />
                <Skeleton variant="row" />
              </WhiteCard>
            </div>

            {/* Signature Home Modules */}
            <div className="space-y-3">
              <SectionHeader title="8. Signature Home Modules" />
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
              <PromoProgressCard
                icon={<Sparkles className="w-4 h-4" />}
                title="Laptop Fund"
                description="Auto-roundups and monthly boosts bring your engineering laptop goal closer."
                progressLeft="₹68,500 / ₹1,14,900"
                progressRight="60%"
                ratio={68500 / 114900}
                onAction={() => {}}
              />
              <TealChallengeCard
                title="Food & Chai Plan"
                spentCents={148500}
                limitCents={300000}
                currency="INR"
                streakTitle="Day 5 of 7"
                ctaLabel="View Plan Details"
                onCtaClick={() => {}}
              />
              <ChatComposer
                value={chatInput}
                onChange={setChatInput}
                onSubmit={() => setChatInput('')}
                credits={76}
              />
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};
