import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header sticky={false} />
      <main id="contenido" className="wana-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <p className="wana-eyebrow">404</p>
        <h1 className="mt-3 font-display text-3xl text-elevari-slate sm:text-4xl">Página no encontrada</h1>
        <p className="mt-3 max-w-md text-elevari-muted">
          El refugio que buscas no está aquí. Explora nuestra colección en Sutatausa y Cucunubá.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="wana-btn-primary min-h-[48px]">Ir al inicio</Link>
          <Link href="/properties" className="wana-btn-ghost min-h-[48px]">Ver colección</Link>
        </div>
      </main>
    </>
  );
}
