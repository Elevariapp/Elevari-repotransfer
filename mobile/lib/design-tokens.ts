export const colors = {
  // Primarios
  forest: '#D97706',
  forestDeep: '#B45309',
  forestLight: '#EA9A2E',
  fresh: '#064E3B',
  freshSoft: '#FEF3C7',
  // Acento
  amber: '#D97706',
  amberInk: '#92400E',
  amberSoft: '#FEF3C7',
  // Fondos y superficies
  ivory: '#FEF3C7',
  surface: '#FFFFFF',
  sand: '#E8E3D5',
  // Texto
  slate: '#0F172A',
  ink: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  // Feedback
  success: '#064E3B',
  successSoft: '#FEF3C7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  error: '#B3261E',
  errorSoft: '#FDECEB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  display: 'Plus Jakarta Sans',
  sans: 'Inter',
  sizes: {
    hero: 32,
    heading: 24,
    body: 16,
    caption: 13,
    button: 14,
  },
  weights: {
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;