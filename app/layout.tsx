import type { Metadata } from 'next';
import './globals.css';
import localFont from 'next/font/local';
import { Toaster } from 'react-hot-toast';
import ConditionalFooter from '@/components/layout/ConditionalFooter';
import FloatingActions from '@/components/layout/FloatingActions';
import MarketingScripts from '@/components/analytics/MarketingScripts';
import ObservabilityProvider from '@/components/observability/ObservabilityProvider';
import { themeInitScript } from '@/components/theme/ThemeToggle';
import { sceneInitScript } from '@/lib/scene/time-of-day';
import { I18nProvider } from '@/components/i18n/I18nProvider';

import { siteUrl } from '@/lib/site-url';
import { installCaptureScript } from '@/lib/pwa-install-script';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';
import { getServerLanguage } from '@/lib/i18n-server';

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Elevari — Glamping en Colombia', template: '%s | Elevari' },
  description: 'Reserva experiencias de glamping únicas en Colombia. Naturaleza, confort y aventura.',
  appleWebApp: { capable: true, title: 'Elevari', statusBarStyle: 'default' },
  openGraph: {
    siteName: 'Elevari',
    locale: 'es_CO',
    type: 'website',
  },
};

// Self-hosted on purpose: the Google Fonts loader downloads fonts at build time and
// crashed the Docker build on the VPS when Google answered with extensionless URLs.
// Latin covers all Spanish text; other scripts fall back to the system font.
const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = localFont({
  src: './fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-display',
  display: 'swap',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = await getServerLanguage();
  const orgSchema = buildOrganizationSchema();
  const webSchema = buildWebSiteSchema();
  return (
    <html lang={language} suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="apple-touch-icon" sizes="180x180" href="/app/apple-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: sceneInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: installCaptureScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSchema) }} />
      </head>
      <body className="elevari-page-bg min-h-screen font-sans text-elevari-slate antialiased">
        <a href="#contenido" className="elevari-skip-link">
          Saltar al contenido principal
        </a>
        <MarketingScripts />
        <ObservabilityProvider />
        <I18nProvider initialLanguage={language}>{children}</I18nProvider>
        <ConditionalFooter />
        <FloatingActions />
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
