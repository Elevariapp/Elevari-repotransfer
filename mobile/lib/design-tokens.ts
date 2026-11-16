export const colors = {
  // Primarios
  forest: '#2F6B4F',
  forestDeep: '#1E4835',
  forestLight: '#3D8163',
  fresh: '#5FA76A',
  freshSoft: '#DFF0E3',
  // Acento
  amber: '#E9A820',
  amberInk: '#7A4A00',
  amberSoft: '#F6E3B8',
  // Fondos y superficies
  ivory: '#F7F4EC',
  surface: '#FFFFFF',
  sand: '#E8E3D5',
  // Texto
  slate: '#22313F',
  ink: '#16222C',
  muted: '#5C6B65',
  border: '#E2DCCC',
  // Feedback
  success: '#2F6B4F',
  successSoft: '#DFF0E3',
  warning: '#7A4A00',
  warningSoft: '#FBF0D6',
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