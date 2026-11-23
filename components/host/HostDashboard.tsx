'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import { wanaApi, type HostPropertySummary } from '@/lib/api-client';
import { hostErrorMessage, isUnauthorized } from './errors';
import HostGate, { SessionExpiredNotice } from './HostGate';
import { propertyStatusMeta } from './property-status';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; properties: HostPropertySummary[] }
  | { kind: 'session-expired' }
  | { kind: 'error'; message: string };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

function mediaSummary(property: HostPropertySummary): string {
  if (property.media_count === 0) return 'Aún no has subido fotos ni videos.';
  const files = plural(property.media_count, 'archivo', 'archivos');
  const pending = property.pending_media_count ?? 0;
  return pending > 0 ? `${files} · ${pending} en revisión` : files;
}

export default function HostDashboard() {
  return (
    <HostGate redirectTo="/host">
      <PropertyList />
    </HostGate>
  );
}

function PropertyList() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    wanaApi
      .listHostProperties()
      .then((r) => {
        if (active) setState({ kind: 'ready', properties: r.data });
      })
      .catch((err) => {
        if (!active) return;
        setState(
          isUnauthorized(err)
            ? { kind: 'session-expired' }
            : { kind: 'error', message: hostErrorMessage(err, 'No pudimos cargar tus propiedades.') },
        );
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setState({ kind: 'loading' });
    setAttempt((n) => n + 1);
  };

  if (state.kind === 'loading') {
    return (
      <div role="status" aria-busy="true" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <span className="sr-only">Cargando tus propiedades…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="elevari-card h-72 animate-pulse" aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (state.kind === 'session-expired') {
    return <SessionExpiredNotice redirectTo="/host" />;
  }

  if (state.kind === 'error') {
    return (
      <div role="alert" className="elevari-card p-8 text-center">
        <p className="text-elevari-error">{state.message}</p>
        <button type="button" onClick={retry} className="elevari-btn-ghost mt-6 min-h-[44px]">
          Reintentar
        </button>
      </div>
    );
  }

  const { properties } = state;
  const published = properties.filter((p) => p.status === 'published').length;
  const inReview = properties.filter((p) => p.status === 'draft').length;

  if (properties.length === 0) {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="font-semibold text-elevari-slate">Aún no has creado ningún espacio</p>
        <p className="mt-2 text-elevari-muted">
          Crea tu primer espacio: lo revisaremos y lo publicaremos para que empiece a recibir reservas.
        </p>
        <Link href="/host/add-property" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Publicar tu primer espacio
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-elevari-muted">
        {plural(properties.length, 'espacio', 'espacios')} · {plural(published, 'publicado', 'publicados')}
        {inReview > 0 && ` · ${inReview} en revisión`}
      </p>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => {
          const meta = propertyStatusMeta(p.status);
          const mediaHref = `/host/properties/${encodeURIComponent(p.id)}/media`;
          return (
            <li key={p.id} className="elevari-card flex flex-col overflow-hidden">
              <Link
                href={mediaHref}
                aria-label={`Fotos y videos de ${p.title}`}
                className="block aspect-[16/10] bg-elevari-sand"
              >
                {p.cover_image ? (
                  <img src={p.cover_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-elevari-muted/70">Sin foto</span>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-elevari-slate">{p.title}</h2>
                    <p className="text-sm text-elevari-muted">{p.city ?? 'Colombia'}</p>
                  </div>
                  <Badge tone={meta.tone} className="shrink-0">
                    {meta.label}
                  </Badge>
                </div>
                {meta.description && <p className="mt-3 text-sm text-elevari-muted">{meta.description}</p>}
                <p className="mt-2 text-xs text-elevari-muted">{mediaSummary(p)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={mediaHref} className="elevari-btn-ghost min-h-[44px]">
                    Fotos y videos
                  </Link>
                  {p.status === 'published' && (
                    <Link href={`/properties/${encodeURIComponent(p.slug)}`} className="elevari-btn-ghost min-h-[44px]">
                      Ver publicación
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
