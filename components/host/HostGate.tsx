'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NETWORK_ERROR_MESSAGE } from '@/lib/media-api';

const loginHref = (redirectTo: string) => `/auth/login?redirect=${encodeURIComponent(redirectTo)}`;

/**
 * Only hosts (and admins) get past this point; everyone else sees what to do next.
 * `hostOnly` also turns admins away, for pages that show the signed-in host's own numbers.
 */
export default function HostGate({
  redirectTo,
  hostOnly = false,
  children,
}: {
  redirectTo: string;
  hostOnly?: boolean;
  children: ReactNode;
}) {
  const { user, loading, unavailable, refresh } = useAuth();
  const [retrying, setRetrying] = useState(false);

  if (loading) {
    return (
      <p role="status" className="text-elevari-muted">
        Cargando…
      </p>
    );
  }

  if (!user && unavailable) {
    // A session exists but the API did not answer: asking for a new login would be wrong.
    return (
      <div role="alert" className="elevari-card p-8 text-center">
        <p className="text-elevari-error">{NETWORK_ERROR_MESSAGE}</p>
        <button
          type="button"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            void refresh().finally(() => setRetrying(false));
          }}
          className="elevari-btn-primary mt-6 min-h-[48px]"
        >
          {retrying ? 'Reintentando…' : 'Reintentar'}
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="text-elevari-muted">Inicia sesión como anfitrión para gestionar tus espacios.</p>
        <Link href={loginHref(redirectTo)} className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (user.role !== 'host' && user.role !== 'admin') {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="text-elevari-muted">
          Tu cuenta es de huésped. Conviértela en cuenta de anfitrión para publicar espacios.
        </p>
        <Link href="/become-host" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Activar mi cuenta de anfitrión
        </Link>
      </div>
    );
  }

  if (hostOnly && user.role === 'admin') {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="text-elevari-muted">
          Estas métricas son las de una cuenta de anfitrión. Como administrador, consulta las de toda la plataforma
          en el panel de administración.
        </p>
        <Link href="/admin/analytics" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Ir a analíticas de administración
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

/** Shown when a request answers 401 after the page loaded (token expired or revoked meanwhile). */
export function SessionExpiredNotice({ redirectTo }: { redirectTo: string }) {
  return (
    <div role="alert" className="elevari-card p-8 text-center">
      <p className="font-semibold text-elevari-slate">Tu sesión expiró</p>
      <p className="mt-2 text-elevari-muted">Inicia sesión de nuevo para continuar.</p>
      <Link href={loginHref(redirectTo)} className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
        Iniciar sesión
      </Link>
    </div>
  );
}
