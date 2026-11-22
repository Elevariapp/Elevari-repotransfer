import Link from 'next/link';
import Header from '@/components/Header';

export default function PropertyNotFound() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-12 lg:py-16">
        <section className="mx-auto max-w-lg p-8 text-center elevari-card-premium">
          <p className="elevari-eyebrow">Propiedad</p>
          <h1 className="mt-2 font-display text-2xl text-elevari-slate sm:text-3xl">No encontrada</h1>
          <p className="mt-3 text-elevari-muted">La propiedad que buscas no existe o no está publicada.</p>
          <Link href="/properties" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
            Ver colección
          </Link>
        </section>
      </main>
    </>
  );
}
