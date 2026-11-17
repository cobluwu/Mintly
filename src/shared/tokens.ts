/**
 * Mintly Design System Tokens
 * Single source of truth for palette, elevation, typography, radii, and spacing.
 */

export const MINTLY_COLORS = {
  // Core brand & ink
  ink: '#0E2B2B',
  teal900: '#0B3B3A',
  teal800: '#14504D',
  teal950: '#072928',

  // Secondary & atmospheric accents
  sage300: '#A9D6B8',
  sage400: '#6DC397',
  sage100: '#DDEFE3',
  cream: '#F3EFDC',

  // Neutrals & metadata
  muted: '#6B7F7C',
  hairline: 'rgba(14, 43, 43, 0.08)',
  canvas: '#F4F7F4',
  white: '#FFFFFF',

  // Semantic states
  amber: '#E8B64C',
  amberSoft: '#F3EFDC',
  coral: '#E26D5C',
  coralSoft: '#F8E3DF',
  slateMuted: '#8EA8B8',
} as const;

export const MINTLY_ELEVATIONS = {
  L0: {
    level: 'L0',
    name: 'Mesh Canvas',
    description: 'Drifting soft atmospheric mesh gradient with subtle grain overlay',
    className: 'mintly-atmosphere-bg',
  },
  L1: {
    level: 'L1',
    name: 'Glass Surface',
    description: 'White at 55%, backdrop-blur-xl, 1px white/50 inner border, soft long shadow',
    className: 'mintly-glass-shell',
  },
  L2: {
    level: 'L2',
    name: 'Solid White Card',
    description: '24px radius, subtle top inner highlight, layered soft shadow',
    className: 'mintly-white-card',
  },
  L3: {
    level: 'L3',
    name: 'Deep Teal Feature Card',
    description: '28px radius, dot-grid texture, subtle radial glow, inner highlight line, soft shadow',
    className: 'mintly-teal-card',
  },
} as const;

export const MINTLY_RADII = {
  hero: 28,
  card: 24,
  row: 16,
  pill: 9999,
} as const;

export const MINTLY_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  gutter: 20,
  lg: 24,
  xl: 32,
} as const;

export const MINTLY_TYPOGRAPHY = {
  display: 'mintly-type-display',
  heading: 'mintly-type-heading',
  body: 'mintly-type-body',
  caption: 'mintly-type-caption',
  mono: 'mintly-type-mono',
} as const;
