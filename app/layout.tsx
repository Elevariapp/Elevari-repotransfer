import type { Metadata } from 'next';
import './globals.css';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import MarketingScripts from '@/components/analytics/MarketingScripts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eleveri.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Eleveri — Glamping en Colombia', template: '%s | Eleveri' },
  description: 'Reserva experiencias de glamping únicas en Colombia. Naturaleza, confort y aventura.',
  openGraph: {
    siteName: 'Eleveri',
    locale: 'es_CO',
    type: 'website',
  },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="wana-page-bg min-h-screen font-sans text-elevari-slate antialiased">
        <a href="#contenido" className="wana-skip-link">
          Saltar al contenido principal
        </a>
        <MarketingScripts />
        {children}
        <ConditionalFooter />
        <Toaster
          position="top-center"
          containerStyle={{ zIndex: 9999 }}
          toastOptions={{
            className: 'text-sm font-medium',
            ariaProps: { role: 'status', 'aria-live': 'polite' },
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              background: 'var(--elevari-surface)',
              color: 'var(--elevari-slate)',
              border: '1px solid var(--elevari-border)',
              boxShadow: 'var(--elevari-shadow-floating)',
            },
            success: {
              iconTheme: { primary: 'var(--elevari-forest)', secondary: '#ffffff' },
            },
            error: {
              style: {
                background: 'var(--elevari-error-soft)',
                color: 'var(--elevari-error)',
                border: '1px solid rgba(179, 38, 30, 0.25)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
