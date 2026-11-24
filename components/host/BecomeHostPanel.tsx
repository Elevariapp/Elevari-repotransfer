'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api-client';
import { NETWORK_ERROR_MESSAGE } from '@/lib/media-api';

const LINK_PRIMARY = 'elevari-btn-primary inline-flex min-h-[48px] items-center justify-center';
const LINK_GHOST = 'elevari-btn-ghost inline-flex min-h-[48px] items-center justify-center';

/** What a visitor can do next, by account type: sign in/up, convert a guest account, or go to the panel. */
export default function BecomeHostPanel() {
  const { user, loading, unavailable, becomeHost, refresh } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await becomeHost();
      router.push('/host');
    } catch (err) {
      // A 401 already dropped the session, which swaps this panel to the signed-out state.
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof Error && err.message ? err.message : NETWORK_ERROR_MESSAGE);
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div aria-busy="true" aria-label="Cargando" className="mx-auto mt-4 h-44 max-w-md animate-pulse rounded-3xl bg-elevari-sand" />;
  }

  if (!user && unavailable) {
    return (
      <div role="alert" className="mt-6">
        <p className="text-elevari-error">{NETWORK_ERROR_MESSAGE}</p>
        <Button onClick={() => void refresh()} className="mt-6">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <p className="mt-4 leading-relaxed text-elevari-muted">
          Crea una cuenta de anfitrión para publicar tu espacio y recibir reservas. Si ya tienes una cuenta de huésped,
          inicia sesión y conviértela en un solo paso.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/auth/register?role=host&redirect=%2Fhost" className={LINK_PRIMARY}>
            Crear cuenta de anfitrión
          </Link>
          <Link href="/auth/login?redirect=%2Fhost" className={LINK_GHOST}>
            Ya tengo cuenta
          </Link>
        </div>
      </>
    );
  }

  if (user.role === 'guest') {
    return (
      <>
        <p className="mt-4 leading-relaxed text-elevari-muted">
          Tu cuenta es de huésped. Conviértela en cuenta de anfitrión para publicar tu espacio: conservas tu correo, tu
          contraseña y tus reservas.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" loading={submitting} onClick={() => void convert()}>
            {submitting ? 'Activando…' : 'Convertir mi cuenta en anfitrión'}
          </Button>
          <Link href="/account" className={LINK_GHOST}>
            Ir a mi cuenta
          </Link>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-elevari-error">
            {error}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <p className="mt-4 leading-relaxed text-elevari-muted">
        Tu cuenta ya puede publicar espacios y recibir reservas.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={user.role === 'admin' ? '/admin' : '/host'} className={LINK_PRIMARY}>
          {user.role === 'admin' ? 'Ir al panel de administración' : 'Ir a mi panel de anfitrión'}
        </Link>
        <Link href="/account" className={LINK_GHOST}>
          Ir a mi cuenta
        </Link>
      </div>
    </>
  );
}
