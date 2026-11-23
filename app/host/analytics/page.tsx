import type { Metadata } from 'next';
import Header from '@/components/Header';
import HostAnalytics from '@/components/host/HostAnalytics';
import HostBreadcrumbs from '@/components/host/HostBreadcrumbs';

export const metadata: Metadata = {
  title: 'Analíticas',
  robots: { index: false, follow: false },
};

export default function HostAnalyticsPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <HostBreadcrumbs items={[{ label: 'Tus propiedades', href: '/host' }, { label: 'Analíticas' }]} />
        <header className="mt-4 mb-8">
          <p className="elevari-eyebrow">Anfitrión</p>
          <h1 className="mt-2 font-display text-3xl text-elevari-slate">Analíticas</h1>
          <p className="mt-2 text-elevari-muted">Reservas, ocupación e ingresos de tus espacios.</p>
        </header>
        <HostAnalytics />
      </main>
    </>
  );
}
