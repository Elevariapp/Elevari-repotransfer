import type { Metadata } from 'next';
import Header from '@/components/Header';
import BecomeHostPanel from '@/components/host/BecomeHostPanel';

export const metadata: Metadata = {
  title: 'Conviértete en anfitrión',
  description: 'Publica tu glamping o alojamiento en Elevari y recibe reservas de viajeros de todo el mundo.',
};

export default function BecomeHostPage() {
  return (
    <>
      <Header sticky={false} />
      <main id="contenido" className="elevari-container py-14 lg:py-20">
        <div className="mx-auto max-w-lg text-center">
          <p className="elevari-eyebrow">Anfitriones</p>
          <h1 className="mt-3 font-display text-3xl text-elevari-slate sm:text-4xl">
            Publica tu glamping en Elevari
          </h1>
          <BecomeHostPanel />
        </div>
      </main>
    </>
  );
}
