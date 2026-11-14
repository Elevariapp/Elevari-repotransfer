import Header from '@/components/Header';
import AddPropertyForm from '@/components/host/AddPropertyForm';
import Link from 'next/link';

export default function AddPropertyPage() {
  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-8 lg:py-12">
        <Link href="/host" className="text-sm font-medium text-elevari-forest hover:underline">
          ← Tus propiedades
        </Link>
        <header className="mt-4 mb-8">
          <p className="elevari-eyebrow">Anfitrión</p>
          <h1 className="mt-2 font-display text-3xl text-elevari-slate">Publicar espacio</h1>
          <p className="mt-2 text-elevari-muted">
            Crea tu propiedad en la plataforma y sube fotos o videos desde el siguiente paso.
          </p>
        </header>
        <div className="max-w-3xl">
          <AddPropertyForm />
        </div>
      </main>
    </>
  );
}
