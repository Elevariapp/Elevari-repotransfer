'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi } from '@/lib/api-client';
import { useEffect, useState } from 'react';

export default function HostDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Awaited<ReturnType<typeof wanaApi.listHostProperties>>['data']>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'host' && user.role !== 'admin')) return;
    wanaApi
      .listHostProperties()
      .then((r) => setProperties(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [user]);

  if (authLoading) {
    return <p className="text-elevari-muted">Cargando…</p>;
  }

  if (!user) {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="text-elevari-muted">Inicia sesión como anfitrión para gestionar tus propiedades.</p>
        <Link href="/auth/login?redirect=/host" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (user.role === 'guest') {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="text-elevari-muted">Tu cuenta es de huésped. Regístrate como anfitrión para publicar espacios.</p>
        <Link href="/auth/register" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Crear cuenta anfitrión
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {properties.length === 0 ? (
        <div className="elevari-card p-8 text-center">
          <p className="text-elevari-muted">Aún no tienes propiedades publicadas.</p>
          <Link href="/host/add-property" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
            Publicar tu primer espacio
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/host/properties/${p.id}/media`}
              className="elevari-card overflow-hidden transition hover:shadow-card"
            >
              <div className="aspect-[16/10] bg-elevari-sand">
                {p.cover_image ? (
                  <img src={p.cover_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-elevari-muted/70">Sin foto</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-elevari-slate">{p.title}</h2>
                <p className="text-sm text-elevari-muted">{p.city ?? 'Colombia'}</p>
                <p className="mt-2 text-xs font-semibold text-elevari-forest">
                  {p.media_count} archivo{p.media_count !== 1 ? 's' : ''} · Gestionar →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
