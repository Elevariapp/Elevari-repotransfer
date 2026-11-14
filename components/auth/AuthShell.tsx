import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/components/Logo';

type AuthShellProps = {
  children: React.ReactNode;
  image?: string;
  imageAlt?: string;
  /** Link superior derecho (ej. login ↔ registro) */
  topLink?: { href: string; label: string };
};

/** Imagen hero full-bleed — misma estética en login y registro */
export const AUTH_BACKGROUND_IMAGE = '/properties/glamping-wana/01-cover.jpeg';

export default function AuthShell({
  children,
  image = AUTH_BACKGROUND_IMAGE,
  imageAlt = 'Eleveri — experiencia en naturaleza',
  topLink,
}: AuthShellProps) {
  return (
    <div className="wana-auth-immersive relative min-h-[100svh]">
      <div className="wana-auth-immersive-bg" aria-hidden>
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="wana-auth-immersive-overlay" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <header className="wana-container flex h-16 shrink-0 items-center justify-between">
          <Logo onDark />
          {topLink ? (
            <Link
              href={topLink.href}
              className="text-sm font-medium text-white/85 transition hover:text-elevari-amber-soft"
            >
              {topLink.label}
            </Link>
          ) : (
            <Link
              href="/properties"
              className="text-sm font-medium text-white/85 transition hover:text-elevari-amber-soft"
            >
              Explorar
            </Link>
          )}
        </header>

        <main id="contenido" className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
          <div className="wana-auth-form-card w-full max-w-[420px]">{children}</div>
          <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-white/75">
            Al continuar aceptas nuestros{' '}
            <Link href="/legal/terms" className="font-medium text-elevari-amber-soft hover:underline">
              términos
            </Link>{' '}
            y{' '}
            <Link href="/legal/privacy" className="font-medium text-elevari-amber-soft hover:underline">
              privacidad
            </Link>
            .
          </p>
        </main>
      </div>
    </div>
  );
}
