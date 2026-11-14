import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SPRING_BOUNCY } from '../../shared/motion';

export type MochiPoseMood =
  | 'happy'
  | 'chill'
  | 'worried'
  | 'celebrating'
  | 'thinking'
  | 'sleeping'
  | 'proud';

export const MOCHI_POSE_META: Record<
  MochiPoseMood,
  { label: string; caption: string; accent: string }
> = {
  happy: {
    label: 'Happy',
    caption: 'Breezing through the week',
    accent: 'var(--mintly-lime, #B9FF4B)',
  },
  chill: {
    label: 'Chill',
    caption: 'Ahead of pace · Zero stress',
    accent: 'var(--mintly-mint, #34D399)',
  },
  worried: {
    label: 'Worried',
    caption: 'Over budget · Time to pause',
    accent: 'var(--mintly-coral, #FF6B6B)',
  },
  celebrating: {
    label: 'Celebrating',
    caption: 'Vault milestone smashed!',
    accent: 'var(--mintly-amber, #FFD166)',
  },
  thinking: {
    label: 'Thinking',
    caption: 'Crunching your safe spend...',
    accent: 'var(--mintly-lilac, #A78BFA)',
  },
  sleeping: {
    label: 'Sleeping',
    caption: 'Quiet night / empty state',
    accent: 'var(--mintly-sky, #38BDF8)',
  },
  proud: {
    label: 'Proud',
    caption: 'Goal 100% funded!',
    accent: 'var(--mintly-amber, #FFD166)',
  },
};

interface MochiMascotProps {
  mood?: MochiPoseMood;
  accessory?: string | null;
  size?: number;
  interactive?: boolean;
  onTap?: () => void;
  className?: string;
}

export const MochiMascot: React.FC<MochiMascotProps> = ({
  mood = 'happy',
  accessory = null,
  size = 88,
  interactive = true,
  onTap,
  className = '',
}) => {
  const [hops, setHops] = useState(0);

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const meta = MOCHI_POSE_META[mood];

  return (
    <motion.div
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Mochi mascot feeling ${meta.label.toLowerCase()}: ${meta.caption}`}
      data-testid="mochi-svg-mascot"
      data-mochi-mood={mood}
      onClick={() => {
        if (!interactive) return;
        setHops((h) => h + 1);
        onTap?.();
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setHops((h) => h + 1);
          onTap?.();
        }
      }}
      animate={
        hops > 0 && !prefersReduced
          ? { y: [0, -9, 0], scale: [1, 1.07, 0.96, 1] }
          : undefined
      }
      transition={SPRING_BOUNCY}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center relative shrink-0 select-none ${
        interactive ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B9FF4B] rounded-3xl' : ''
      } ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Soft colored aura glow */}
        <circle
          cx="60"
          cy="66"
          r="46"
          fill={meta.accent}
          fillOpacity="0.14"
        />

        {/* Ground contact shadow */}
        <ellipse
          cx="60"
          cy="106"
          rx="31"
          ry="5.5"
          fill="#000000"
          fillOpacity="0.34"
        />

        {/* Animated Mochi Character Group */}
        <g
          style={{ transformOrigin: '60px 92px' }}
          className={prefersReduced ? '' : 'mintly-mochi-breath'}
        >
          {/* Twin Sprout Leaves beside coin slot */}
          <g
            style={{ transformOrigin: '60px 26px' }}
            className={prefersReduced ? '' : 'mintly-mochi-sway'}
          >
            <path
              d="M60 27C60 22 61 18 61 18"
              stroke="var(--mintly-lime, #B9FF4B)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M60 19C54 12 45 14 47 21C49 25 56 23 60 19Z"
              fill="#96DF2C"
            />
            <path
              d="M61 19C66 11 76 13 74 20C72 24 65 23 61 19Z"
              fill="var(--mintly-lime, #B9FF4B)"
            />
          </g>

          {/* Stubby Piggy Feet */}
          <ellipse cx="44" cy="99" rx="10" ry="7" fill="#46C994" />
          <ellipse cx="76" cy="99" rx="10" ry="7" fill="#46C994" />

          {/* Stubby Arms (Pose-driven) */}
          {mood === 'celebrating' ? (
            <>
              <ellipse
                cx="22"
                cy="52"
                rx="8.5"
                ry="13"
                transform="rotate(-35 22 52)"
                fill="#5CD9A4"
              />
              <ellipse
                cx="98"
                cy="52"
                rx="8.5"
                ry="13"
                transform="rotate(35 98 52)"
                fill="#5CD9A4"
              />
            </>
          ) : mood === 'thinking' ? (
            <>
              <ellipse
                cx="23"
                cy="74"
                rx="8"
                ry="11"
                transform="rotate(20 23 74)"
                fill="#5CD9A4"
              />
              {/* Right hand tucked on chin */}
              <ellipse
                cx="78"
                cy="78"
                rx="8"
                ry="10"
                transform="rotate(-25 78 78)"
                fill="#46C994"
              />
            </>
          ) : mood === 'worried' ? (
            <>
              <ellipse
                cx="27"
                cy="66"
                rx="8"
                ry="11"
                transform="rotate(-20 27 66)"
                fill="#5CD9A4"
              />
              <ellipse
                cx="93"
                cy="66"
                rx="8"
                ry="11"
                transform="rotate(20 93 66)"
                fill="#5CD9A4"
              />
            </>
          ) : (
            <>
              <ellipse
                cx="22"
                cy="72"
                rx="8"
                ry="11.5"
                transform="rotate(22 22 72)"
                fill="#5CD9A4"
              />
              <ellipse
                cx="98"
                cy="72"
                rx="8"
                ry="11.5"
                transform="rotate(-22 98 72)"
                fill="#5CD9A4"
              />
            </>
          )}

          {/* Main Rounded Mint Piggy-Bank Blob Body */}
          <rect
            x="22"
            y="26"
            width="76"
            height="72"
            rx="36"
            fill="var(--mintly-mint, #6EE7B7)"
          />
          {/* Subtle top glossy rim highlight */}
          <path
            d="M36 33C43 29.5 74 29.5 83 34"
            stroke="#FFFFFF"
            strokeOpacity="0.45"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Tiny Piggy-Bank Coin Slot on Crown */}
          <rect x="49" y="29" width="22" height="4.5" rx="2.25" fill="#133A2E" />

          {/* Cheek Blush Ovals */}
          <ellipse
            cx="37"
            cy="68"
            rx="6.5"
            ry="4"
            fill="var(--mintly-coral, #FF6B6B)"
            fillOpacity={mood === 'worried' ? 0.35 : 0.58}
          />
          <ellipse
            cx="83"
            cy="68"
            rx="6.5"
            ry="4"
            fill="var(--mintly-coral, #FF6B6B)"
            fillOpacity={mood === 'worried' ? 0.35 : 0.58}
          />

          {/* EYES (7 poses) */}
          {mood === 'celebrating' && (
            <>
              <path
                d="M40 60C42 55.5 47 55.5 49 60"
                stroke="#0F172A"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              <path
                d="M71 60C73 55.5 78 55.5 80 60"
                stroke="#0F172A"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </>
          )}

          {mood === 'sleeping' && (
            <>
              <path
                d="M39 58C41.5 62 47.5 62 50 58"
                stroke="#0F172A"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M70 58C72.5 62 78.5 62 81 58"
                stroke="#0F172A"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </>
          )}

          {mood === 'chill' && (
            <>
              {/* Comfy cool shades */}
              <rect x="33" y="51" width="22" height="14" rx="5.5" fill="#0F172A" />
              <rect x="65" y="51" width="22" height="14" rx="5.5" fill="#0F172A" />
              <path d="M55 56H65" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
              <path d="M37 55L42 60" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
              <path d="M69 55L74 60" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {mood === 'proud' && (
            <>
              {/* Sparkle star eyes */}
              <path
                d="M44.5 51.5L46.3 56.2L51 58L46.3 59.8L44.5 64.5L42.7 59.8L38 58L42.7 56.2L44.5 51.5Z"
                fill="#0F172A"
              />
              <path
                d="M75.5 51.5L77.3 56.2L82 58L77.3 59.8L75.5 64.5L73.7 59.8L69 58L73.7 56.2L75.5 51.5Z"
                fill="#0F172A"
              />
            </>
          )}

          {(mood === 'happy' || mood === 'worried' || mood === 'thinking') && (
            <g
              style={{ transformOrigin: '60px 58px' }}
              className={prefersReduced ? '' : 'mintly-mochi-blink'}
            >
              <circle
                cx={mood === 'thinking' ? 46 : 44.5}
                cy={mood === 'thinking' ? 56 : 58}
                r="5.6"
                fill="#0F172A"
              />
              <circle
                cx={mood === 'thinking' ? 77 : 75.5}
                cy={mood === 'thinking' ? 56 : 58}
                r="5.6"
                fill="#0F172A"
              />
              {/* Eye catchlights */}
              <circle
                cx={mood === 'thinking' ? 47.8 : 46}
                cy={mood === 'thinking' ? 54 : 56}
                r="1.9"
                fill="#FFFFFF"
              />
              <circle
                cx={mood === 'thinking' ? 78.8 : 77}
                cy={mood === 'thinking' ? 54 : 56}
                r="1.9"
                fill="#FFFFFF"
              />
            </g>
          )}

          {/* Worried / Thinking Eyebrows */}
          {mood === 'worried' && (
            <>
              <path d="M38 49L49 46" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M82 49L71 46" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
            </>
          )}
          {mood === 'thinking' && (
            <path d="M69 47C73 45 78 45 81 47" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
          )}

          {/* MOUTHS */}
          {(mood === 'happy' || mood === 'chill') && (
            <path
              d="M52 68C54.5 72.5 65.5 72.5 68 68"
              stroke="#0F172A"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {(mood === 'celebrating' || mood === 'proud') && (
            <path
              d="M50 66C50 76 70 76 70 66H50Z"
              fill="#0F172A"
            />
          )}

          {mood === 'worried' && (
            <path
              d="M51 72C53.5 68.5 56.5 68.5 60 71.5C63.5 74.5 66.5 74 69 70.5"
              stroke="#0F172A"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {mood === 'thinking' && (
            <path
              d="M54 70H65"
              stroke="#0F172A"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {mood === 'sleeping' && (
            <circle cx="60" cy="70" r="3.4" fill="#0F172A" />
          )}

          {/* EQUIPPED COSMETIC ACCESSORIES (Unlocked via Mint Coins) */}
          {accessory === 'mochi_specs' && mood !== 'chill' && (
            <g>
              <circle cx="44.5" cy="58" r="10.5" stroke="#0B3B3A" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.14" />
              <circle cx="75.5" cy="58" r="10.5" stroke="#0B3B3A" strokeWidth="2.4" fill="#FFFFFF" fillOpacity="0.14" />
              <path d="M55 58H65" stroke="#0B3B3A" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M26 55L34 57" stroke="#0B3B3A" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M86 57L94 55" stroke="#0B3B3A" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {accessory === 'mochi_headphones' && (
            <g>
              <path
                d="M21 56C21 29 99 29 99 56"
                stroke="#0B3B3A"
                strokeWidth="5.2"
                strokeLinecap="round"
                fill="none"
              />
              <rect x="14" y="47" width="11" height="22" rx="5.5" fill="#0B3B3A" />
              <rect x="17" y="51" width="4" height="14" rx="2" fill="#A9D6B8" />
              <rect x="95" y="47" width="11" height="22" rx="5.5" fill="#0B3B3A" />
              <rect x="99" y="51" width="4" height="14" rx="2" fill="#A9D6B8" />
            </g>
          )}

          {accessory === 'mochi_grad_cap' && (
            <g>
              <polygon points="60,12 92,23 60,33 28,23" fill="#0E2B2B" />
              <rect x="44" y="25" width="32" height="9" rx="4" fill="#14504D" />
              <path d="M84 25V39" stroke="#E8B64C" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="84" cy="40" r="3" fill="#E8B64C" />
            </g>
          )}

          {accessory === 'mochi_diwali_crown' && (
            <g>
              <path
                d="M37 31L45 17L55 26L60 13L65 26L75 17L83 31Z"
                fill="#E8B64C"
                stroke="#0B3B3A"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="60" cy="24" r="2.6" fill="#E26D5C" />
              <circle cx="46" cy="25" r="2" fill="#FFFFFF" />
              <circle cx="74" cy="25" r="2" fill="#FFFFFF" />
            </g>
          )}
        </g>

        {/* POSE-SPECIFIC FLOATING ACCENTS */}
        {mood === 'worried' && (
          <path
            d="M95 36C95 36 101 44 101 48C101 51.3 98.3 54 95 54C91.7 54 89 51.3 89 48C89 44 95 36 95 36Z"
            fill="var(--mintly-sky, #38BDF8)"
            className={prefersReduced ? '' : 'mintly-mochi-float'}
          />
        )}

        {mood === 'celebrating' && (
          <g
            className={prefersReduced ? '' : 'mintly-mochi-float'}
            style={{ transformOrigin: '60px 24px' }}
          >
            {/* Popping coin above slot */}
            <circle cx="88" cy="24" r="7" fill="var(--mintly-amber, #FFD166)" />
            <path d="M88 20.5V27.5" stroke="#090B0E" strokeWidth="2" strokeLinecap="round" />
            {/* Confetti shapes */}
            <rect x="20" y="26" width="6" height="6" rx="2" transform="rotate(20 20 26)" fill="var(--mintly-lime, #B9FF4B)" />
            <circle cx="102" cy="40" r="3.5" fill="var(--mintly-lilac, #A78BFA)" />
            <circle cx="24" cy="44" r="3" fill="var(--mintly-coral, #FF6B6B)" />
          </g>
        )}

        {mood === 'proud' && (
          <g
            className={prefersReduced ? '' : 'mintly-mochi-float'}
            style={{ transformOrigin: '94px 32px' }}
          >
            <path
              d="M94 22L96.6 28.4L103 31L96.6 33.6L94 40L91.4 33.6L85 31L91.4 28.4L94 22Z"
              fill="var(--mintly-amber, #FFD166)"
            />
          </g>
        )}

        {mood === 'thinking' && (
          <g className={prefersReduced ? '' : 'mintly-mochi-float'}>
            <circle cx="92" cy="42" r="2.8" fill="var(--mintly-lilac, #A78BFA)" />
            <circle cx="99" cy="34" r="4" fill="var(--mintly-lilac, #A78BFA)" />
            <rect x="86" y="14" width="24" height="14" rx="7" fill="var(--mintly-lilac, #A78BFA)" />
            <circle cx="93" cy="21" r="1.6" fill="#090B0E" />
            <circle cx="98" cy="21" r="1.6" fill="#090B0E" />
            <circle cx="103" cy="21" r="1.6" fill="#090B0E" />
          </g>
        )}

        {mood === 'sleeping' && (
          <g className={prefersReduced ? '' : 'mintly-mochi-float'}>
            <path d="M88 38H96L88 46H96" stroke="var(--mintly-sky, #38BDF8)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M98 24H108L98 34H108" stroke="var(--mintly-sky, #38BDF8)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </motion.div>
  );
};
