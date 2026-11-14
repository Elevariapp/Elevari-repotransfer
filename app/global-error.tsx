'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportError } from '@/lib/observability';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { level: 'error', tags: { source: 'global-error', digest: error.digest } });
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-elevari-ivory px-6 text-center text-elevari-slate">
        <p className="font-display text-2xl font-semibold text-elevari-forest">Elevari</p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-elevari-ink">
          Algo no salió como esperábamos
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-elevari-muted">
          Ya registramos el problema. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-elevari-action px-6 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-elevari-border bg-elevari-surface px-6 text-sm font-semibold text-elevari-slate"
          >
            Ir al inicio
          </Link>
        </div>
      </body>
    </html>
  );
}
