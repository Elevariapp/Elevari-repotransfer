import type { Metadata } from 'next';
import Header from '@/components/Header';
import AddPropertyForm from '@/components/host/AddPropertyForm';
import HostBreadcrumbs from '@/components/host/HostBreadcrumbs';

export const metadata: Metadata = {
  title: 'Publicar espacio',
  robots: { index: false, follow: false },
};

export default function AddPropertyPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <HostBreadcrumbs items={[{ label: 'Tus propiedades', href: '/host' }, { label: 'Publicar espacio' }]} />
        <header className="mt-4 mb-8">
          <p className="elevari-eyebrow">Anfitrión</p>
          <h1 className="mt-2 font-display text-3xl text-elevari-slate">Publicar espacio</h1>
          <p className="mt-2 text-elevari-muted">
            Cuéntanos sobre tu espacio. Después podrás subir más fotos y videos, y nuestro equipo lo revisará antes de
            publicarlo.
          </p>
        </header>
        <div className="max-w-3xl">
          <AddPropertyForm />
        </div>
      </main>
    </>
  );
}
