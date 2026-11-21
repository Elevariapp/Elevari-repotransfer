import { publicSiteUrl } from '../email.js';

export const EMAIL_BRAND = {
  name: 'Elevari',
  tagline: 'Glamping en Colombia',
  supportEmail: 'reserve@elevari.live',
  colors: {
    black: '#0A0A0A',
    cream: '#FAF9F7',
    sand: '#ECEAE6',
    champagne: '#D4AF7A',
    champagneLight: '#E8D5B5',
    charcoal: '#1A1A1A',
    muted: '#737373',
    border: '#E5E3DF',
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
