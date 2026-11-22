import type { Metadata } from 'next';
import './globals.css';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import MarketingScripts from '@/components/analytics/MarketingScripts';
import ObservabilityProvider from '@/components/observability/ObservabilityProvider';
import { themeInitScript } from '@/components/theme/ThemeToggle';

import { siteUrl } from '@/lib/site-url';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Elevari — Glamping en Colombia', template: '%s | Elevari' },
  description: 'Reserva experiencias de glamping únicas en Colombia. Naturaleza, confort y aventura.',
  openGraph: {
    siteName: 'Elevari',
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
  const orgSchema = buildOrganizationSchema();
  const webSchema = buildWebSiteSchema();
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSchema) }} />
      </head>
      <body className="elevari-page-bg min-h-screen font-sans text-elevari-slate antialiased">
        <a href="#contenido" className="elevari-skip-link">
          Saltar al contenido principal
        </a>
        <MarketingScripts />
        <ObservabilityProvider />
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
