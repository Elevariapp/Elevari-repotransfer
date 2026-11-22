import { publicSiteUrl } from '../email.js';

export const EMAIL_BRAND = {
  name: 'Elevari',
  tagline: 'Glamping en Colombia',
  supportEmail: 'reserve@elevari.live',
  logoUrl: `${publicSiteUrl().replace(/\/$/, '')}/brand/logo-concept-4-blend.svg`,
  colors: {
    black: '#1E4835',
    cream: '#F7F4EC',
    sand: '#E8E3D5',
    champagne: '#E9A820',
    champagneLight: '#F6E3B8',
    charcoal: '#16222C',
    muted: '#22313F',
    border: '#E8E3D5',
    white: '#FFFFFF',
  },
} as const;

export function siteUrl(): string {
  return publicSiteUrl().replace(/\/$/, '');
}

export function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function firstName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'ahí';
  return trimmed.split(/\s+/)[0] ?? 'ahí';
}