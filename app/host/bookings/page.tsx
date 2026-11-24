import type { Metadata } from 'next';
import Header from '@/components/Header';
import HostBookingsList from '@/components/host/HostBookingsList';
import HostBreadcrumbs from '@/components/host/HostBreadcrumbs';

export const metadata: Metadata = {
  title: 'Reservas de tus espacios',
  robots: { index: false, follow: false },
};

export default function HostBookingsPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <div className="mx-auto w-full max-w-3xl">
          <HostBreadcrumbs items={[{ label: 'Tus propiedades', href: '/host' }, { label: 'Reservas' }]} />
          <header className="mt-4 mb-8">
            <p className="elevari-eyebrow">Anfitrión</p>
            <h1 className="mt-2 font-display text-3xl text-elevari-slate">Reservas de tus espacios</h1>
            <p className="mt-2 text-elevari-muted">
              Las estadías pagadas de tus espacios: quién llega, cuándo y cuánto recibes.
            </p>
          </header>
          <HostBookingsList />
        </div>
      </main>
    </>
  );
}
