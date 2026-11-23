import Link from 'next/link';
import Logo from '@/components/Logo';
import ScenicBackground from '@/components/scene/ScenicBackground';

type AuthShellProps = {
  children: React.ReactNode;
  /** Link superior derecho (ej. login ↔ registro) */
  topLink?: { href: string; label: string };
};

export default function AuthShell({
  children,
  topLink,
}: AuthShellProps) {
  return (
    <div className="relative min-h-[100svh]">
      <ScenicBackground idPrefix="auth" scrim="auth" />

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <header className="elevari-container flex h-16 shrink-0 items-center justify-between">
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
          <div className="elevari-auth-form-card w-full max-w-[420px]">{children}</div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/85 [text-shadow:0_1px_10px_rgb(24_8_3/0.6)]">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-elevari-amber-soft">✓</span> Pago seguro
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-elevari-amber-soft">✓</span> Soporte en español
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-elevari-amber-soft">✓</span> Cancelación clara
            </li>
          </ul>
          <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-white/85 [text-shadow:0_1px_10px_rgb(24_8_3/0.6)]">
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
