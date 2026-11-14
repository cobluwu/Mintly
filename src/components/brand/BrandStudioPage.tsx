import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import {
  DEFAULT_LOGO_CONCEPT,
  LOGO_CONCEPT_META,
  MintlyAppIcon,
  MintlyLogoLockup,
  MintlyLogomark,
  MintlySplashMark,
  type LogoConcept,
} from './MintlyLogo';
import {
  MOCHI_POSE_META,
  MochiMascot,
  type MochiPoseMood,
} from './MochiMascot';
import { ALL_MINTLY_ICONS, CategoryBadgeIcon, Icon } from './Icon';
import { SPRING_BOUNCY } from '../../shared/motion';

interface BrandStudioPageProps {
  onBackToApp: () => void;
}

const CONCEPTS: LogoConcept[] = ['A', 'B', 'C'];
const MOODS: MochiPoseMood[] = [
  'happy',
  'chill',
  'worried',
  'celebrating',
  'thinking',
  'sleeping',
  'proud',
];

export const BrandStudioPage: React.FC<BrandStudioPageProps> = ({
  onBackToApp,
}) => {
  const [selectedConcept, setSelectedConcept] = useState<LogoConcept>(
    DEFAULT_LOGO_CONCEPT
  );

  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F8FAFC] px-4 sm:px-8 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              transition={SPRING_BOUNCY}
              onClick={onBackToApp}
              className="min-h-[44px] px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-white inline-flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Mintly</span>
            </motion.button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Mintly Brand Studio
              </h1>
              <p className="text-xs sm:text-sm text-[#A1B0C4]">
                Inline SVG Logo Concepts · 7 Mochi Expressions · 26-Icon System
              </p>
            </div>
          </div>

          <MintlyLogoLockup concept={selectedConcept} />
        </header>

        {/* PART 1: 3 LOGO CONCEPTS SIDE BY SIDE (DARK + LIGHT) */}
        <section aria-labelledby="logo-heading" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2
                id="logo-heading"
                className="font-display text-xl sm:text-2xl font-extrabold text-white"
              >
                1. Logo Directions (Dark & Light)
              </h2>
              <p className="text-xs sm:text-sm text-[#A1B0C4]">
                Concept A is wired as the default direction. Click any direction to preview it live.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {CONCEPTS.map((concept) => {
              const isActive = selectedConcept === concept;
              const meta = LOGO_CONCEPT_META[concept];

              return (
                <article
                  key={concept}
                  data-testid={`brand-concept-${concept}`}
                  className={`mintly-surface-card p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isActive
                      ? 'ring-2 ring-[#B9FF4B]'
                      : 'ring-1 ring-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-white">
                        {meta.title}
                      </h3>
                      <p className="text-xs text-[#A1B0C4] mt-0.5">
                        {meta.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedConcept(concept)}
                      className={`min-h-[38px] px-3.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-[#B9FF4B] text-[#090B0E]'
                          : 'bg-white/[0.08] text-white hover:bg-white/[0.14]'
                      }`}
                    >
                      {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{isActive ? 'Active' : 'Preview'}</span>
                    </button>
                  </div>

                  {/* Dark Canvas Lockup, 16px Micro & App Icon */}
                  <div className="rounded-[24px] bg-[#090B0E] p-4 space-y-4 border border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                      <MintlyLogoLockup concept={concept} tone="dark" />
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#A1B0C4]">
                        <span>16px</span>
                        <span className="p-1.5 rounded-lg bg-white/[0.06]">
                          <MintlyLogomark concept={concept} size={16} animateOnLoad={false} />
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <MintlyAppIcon concept={concept} size={56} tone="dark" />
                      <div className="flex-1">
                        <MintlySplashMark concept={concept} tone="dark" />
                      </div>
                    </div>
                  </div>

                  {/* Light Canvas Lockup, 16px Micro & App Icon */}
                  <div className="rounded-[24px] bg-[#F8FAFC] p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <MintlyLogoLockup concept={concept} tone="light" />
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                        <span>16px</span>
                        <span className="p-1.5 rounded-lg bg-slate-200/80">
                          <MintlyLogomark concept={concept} size={16} animateOnLoad={false} />
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <MintlyAppIcon concept={concept} size={56} tone="light" />
                      <div className="flex-1">
                        <MintlySplashMark concept={concept} tone="light" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* PART 2: MOCHI MASCOT — 7 POSES */}
        <section aria-labelledby="mochi-heading" className="space-y-4">
          <div>
            <h2
              id="mochi-heading"
              className="font-display text-xl sm:text-2xl font-extrabold text-white"
            >
              2. Mochi Mascot · 7 Expressions
            </h2>
            <p className="text-xs sm:text-sm text-[#A1B0C4]">
              Pure inline SVG piggy-bank blob with breathing, blinking, and tap-to-hop physics.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
            {MOODS.map((mood) => {
              const info = MOCHI_POSE_META[mood];
              return (
                <div
                  key={mood}
                  data-testid={`brand-mochi-${mood}`}
                  className="mintly-surface-card p-4 flex flex-col items-center text-center gap-2.5"
                >
                  <MochiMascot mood={mood} size={86} />
                  <div>
                    <p className="font-display text-sm font-extrabold text-white">
                      {info.label}
                    </p>
                    <p className="text-[11px] text-[#A1B0C4] leading-snug mt-0.5">
                      {info.caption}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PART 3: CUSTOM 24PX DUOTONE ICON FAMILY */}
        <section aria-labelledby="icons-heading" className="space-y-4">
          <div>
            <h2
              id="icons-heading"
              className="font-display text-xl sm:text-2xl font-extrabold text-white"
            >
              3. Custom Icon Family ({ALL_MINTLY_ICONS.length} Icons)
            </h2>
            <p className="text-xs sm:text-sm text-[#A1B0C4]">
              24px grid · Chunky rounded strokes · Duotone CSS tokens · Tinted glowing category badges
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
            {ALL_MINTLY_ICONS.map((item) => (
              <div
                key={item.name}
                data-testid={`brand-icon-${item.name}`}
                className="mintly-surface-subtle p-3.5 flex flex-col items-center text-center gap-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <CategoryBadgeIcon name={item.name} color={item.color} size={44} />
                  <Icon
                    name={item.name}
                    size={22}
                    color="#F8FAFC"
                    accentColor={item.color}
                  />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-xs font-bold text-white truncate">
                    {item.label}
                  </p>
                  <p className="font-mono text-[10px] text-[#7C8CA3] truncate">
                    {item.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
