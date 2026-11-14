import Link from 'next/link';
import Header from '@/components/Header';
import HostDashboard from '@/components/host/HostDashboard';

export default function HostPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="elevari-eyebrow">Anfitrión</p>
            <h1 className="mt-2 font-display text-3xl text-elevari-slate">Tus propiedades</h1>
            <p className="mt-2 text-elevari-muted">Administra fotos y videos de cada espacio.</p>
          </div>
          <Link href="/host/add-property" className="elevari-btn-primary inline-flex min-h-[44px] shrink-0">
            + Publicar espacio
          </Link>
        </header>
        <HostDashboard />
      </main>
    </>
  );
}
