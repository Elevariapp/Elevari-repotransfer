import Link from 'next/link';
import Header from '@/components/Header';

export default function BecomeHostPage() {
  return (
    <>
      <Header sticky={false} />
      <main id="contenido" className="elevari-container py-14 lg:py-20">
        <div className="mx-auto max-w-lg text-center">
          <p className="elevari-eyebrow">Anfitriones</p>
          <h1 className="mt-3 font-display text-3xl text-elevari-slate sm:text-4xl">
            Publica tu glamping en Eleveri
          </h1>
          <p className="mt-4 text-elevari-muted leading-relaxed">
            Tu cuenta actual es de huésped. Para acceder al panel de anfitrión, regístrate como anfitrión o crea una
            cuenta nueva con ese rol.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register?role=host&redirect=%2Fhost"
              className="elevari-btn-primary min-h-[48px] inline-flex items-center justify-center"
            >
              Crear cuenta anfitrión
            </Link>
            <Link href="/account" className="elevari-btn-ghost min-h-[48px] inline-flex items-center justify-center">
              Ir a mi cuenta
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
