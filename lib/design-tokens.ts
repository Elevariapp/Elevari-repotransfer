/**
 * ELEVARI DESIGN TOKENS — TypeScript mirror of app/globals.css
 * Single source of truth for programmatic usage (emails, charts, canvas, tests).
 * Docs: docs/design/TOKEN_SYSTEM.md
 */

export const colors = {
  forest: '#2F6B4F',
  forestDeep: '#1E4835',
  forestLight: '#3D8163',
  fresh: '#5FA76A',
  freshSoft: '#DFF0E3',
  amber: '#E9A820',
  amberInk: '#7A4A00',
  amberSoft: '#F6E3B8',
  ivory: '#F7F4EC',
  surface: '#FFFFFF',
  sand: '#E8E3D5',
  slate: '#22313F',
  ink: '#16222C',
  muted: '#5C6B65',
  border: '#E2DCCC',
  success: '#2F6B4F',
  successSoft: '#DFF0E3',
  warning: '#7A4A00',
  warningSoft: '#FBF0D6',
  error: '#B3261E',
  errorSoft: '#FDECEB',
} as const;

export const typography = {
  display: 'var(--font-display)',
  body: 'var(--font-inter)',
  sizes: {
    display: 'clamp(2rem, 4.2vw + 0.65rem, 3.625rem)',
    heading: 'clamp(1.5rem, 2.2vw + 0.85rem, 2.625rem)',
    body: '1rem',
    caption: '0.8125rem',
    button: '0.875rem',
  },
  weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2.5rem',
  '2xl': '4rem',
} as const;

export const radius = {
  sm: '0.5rem',
  md: '0.875rem',
  lg: '1.25rem',
  xl: '1.75rem',
  full: '9999px',
} as const;

export const shadows = {
  soft: '0 2px 8px rgba(22, 34, 44, 0.05)',
  card: '0 2px 8px rgba(22, 34, 44, 0.04), 0 10px 28px rgba(22, 34, 44, 0.07)',
  floating: '0 12px 32px rgba(22, 34, 44, 0.1)',
  modal: '0 24px 64px rgba(22, 34, 44, 0.18)',
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadows;
