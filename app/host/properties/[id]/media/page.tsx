import type { Metadata } from 'next';
import Header from '@/components/Header';
import HostBreadcrumbs from '@/components/host/HostBreadcrumbs';
import MediaUploader from '@/components/host/MediaUploader';

export const metadata: Metadata = {
  title: 'Fotos y videos',
  robots: { index: false, follow: false },
};

export default async function HostPropertyMediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <HostBreadcrumbs items={[{ label: 'Tus propiedades', href: '/host' }, { label: 'Fotos y videos' }]} />
        <header className="mt-4 mb-8">
          <p className="elevari-eyebrow">Anfitrión</p>
          <h1 className="mt-2 font-display text-3xl text-elevari-slate">Fotos y videos</h1>
          <p className="mt-2 text-elevari-muted">
            Las fotos y los videos son lo primero que ven los huéspedes. Los archivos nuevos pasan por una revisión
            antes de mostrarse.
          </p>
        </header>
        <MediaUploader propertyId={id} />
      </main>
    </>
  );
}
