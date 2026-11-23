'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { wanaApi, type HostPropertySummary } from '@/lib/api-client';
import {
  MAX_MEDIA_PER_PROPERTY,
  MEDIA_ACCEPT,
  MEDIA_FORMATS_HINT,
  deletePropertyMedia,
  listPropertyMediaManage,
  uploadPropertyMedia,
  validateMediaFile,
  type PropertyMediaItem,
} from '@/lib/media-api';
import { errorStatus, hostErrorMessage, isUnauthorized } from './errors';
import HostGate, { SessionExpiredNotice } from './HostGate';
import { propertyStatusMeta } from './property-status';

const MEDIA_STATUS: Record<string, { label: string; tone: 'brand' | 'accent' | 'error' }> = {
  approved: { label: 'Aprobada', tone: 'brand' },
  pending: { label: 'En revisión', tone: 'accent' },
  rejected: { label: 'Rechazada', tone: 'error' },
};

type GalleryState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'error'; message: string; status: number | null };

interface UploadProgress {
  name: string;
  index: number;
  total: number;
  percent: number;
}

export default function MediaUploader({ propertyId }: { propertyId: string }) {
  const redirectTo = `/host/properties/${encodeURIComponent(propertyId)}/media`;
  return (
    <HostGate redirectTo={redirectTo}>
      <MediaManager propertyId={propertyId} redirectTo={redirectTo} />
    </HostGate>
  );
}

function MediaManager({ propertyId, redirectTo }: { propertyId: string; redirectTo: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const deletingRef = useRef(false);
  const pickerRef = useRef<HTMLButtonElement>(null);
  const deleteOpenerRef = useRef<HTMLElement | null>(null);
  const deleteWasOpenRef = useRef(false);
  const [items, setItems] = useState<PropertyMediaItem[]>([]);
  const [gallery, setGallery] = useState<GalleryState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [property, setProperty] = useState<HostPropertySummary | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState<{ item: PropertyMediaItem; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPropertyMediaManage(propertyId)
      .then((media) => {
        if (!active) return;
        setItems(media);
        setGallery({ kind: 'ready' });
      })
      .catch((err) => {
        if (!active) return;
        setGallery({
          kind: 'error',
          message: hostErrorMessage(err, 'No pudimos cargar las fotos y videos.'),
          status: errorStatus(err),
        });
      });
    return () => {
      active = false;
    };
  }, [propertyId, attempt]);

  // Property name and status are context only: the page still works if this request fails.
  useEffect(() => {
    let active = true;
    wanaApi
      .listHostProperties()
      .then((r) => {
        if (active) setProperty(r.data.find((p) => p.id === propertyId) ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [propertyId]);

  const retry = () => {
    setGallery({ kind: 'loading' });
    setAttempt((n) => n + 1);
  };

  const uploadFiles = async (selected: File[]) => {
    if (selected.length === 0 || uploadingRef.current) return;
    uploadingRef.current = true;
    setUploading(true);
    setProblems([]);

    const failures: string[] = [];
    let uploaded = 0;
    let stoppedAt = -1;

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      const invalid = validateMediaFile(file);
      if (invalid) {
        failures.push(invalid);
        continue;
      }

      setProgress({ name: file.name, index: i + 1, total: selected.length, percent: 0 });
      try {
        const { media } = await uploadPropertyMedia(propertyId, file, {
          onProgress: (percent) => setProgress((current) => (current ? { ...current, percent } : current)),
        });
        setItems((prev) => [...prev, media]);
        uploaded += 1;
      } catch (err) {
        failures.push(`«${file.name}»: ${hostErrorMessage(err, 'No pudimos subir el archivo.')}`);
        if (isUnauthorized(err)) setSessionExpired(true);
        // These failures would repeat for every remaining file, so stop instead of uploading more large files.
        const status = errorStatus(err);
        if (status === null || [401, 403, 404, 409, 503].includes(status)) {
          stoppedAt = i;
          break;
        }
      }
    }

    const skipped = stoppedAt >= 0 ? selected.length - 1 - stoppedAt : 0;
    if (skipped > 0) {
      failures.push(`Se detuvo la carga: ${skipped === 1 ? '1 archivo quedó' : `${skipped} archivos quedaron`} sin subir.`);
    }

    setProgress(null);
    setProblems(failures);
    if (uploaded > 0) toast.success(uploaded === 1 ? 'Archivo subido' : `${uploaded} archivos subidos`);
    uploadingRef.current = false;
    setUploading(false);

    // Re-sync with the server so order and review status match what is stored.
    listPropertyMediaManage(propertyId)
      .then(setItems)
      .catch(() => {});
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    void uploadFiles(selected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const closeDelete = useCallback(() => {
    if (!deletingRef.current) {
      setToDelete(null);
      setDeleteError(null);
    }
  }, []);

  // The shared Modal does not give focus back, so return it to the button that opened the dialog
  // (or to the picker when that item no longer exists).
  useEffect(() => {
    if (toDelete) {
      deleteWasOpenRef.current = true;
      return;
    }
    if (!deleteWasOpenRef.current) return;
    deleteWasOpenRef.current = false;
    const opener = deleteOpenerRef.current;
    (opener?.isConnected ? opener : pickerRef.current)?.focus();
  }, [toDelete]);

  const confirmDelete = async () => {
    if (!toDelete || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError(null);
    const { item } = toDelete;
    try {
      await deletePropertyMedia(item.id);
      setItems((prev) => prev.filter((m) => m.id !== item.id));
      setToDelete(null);
      toast.success('Archivo eliminado');
    } catch (err) {
      if (errorStatus(err) === 404) {
        // Already gone (deleted from another tab or device).
        setItems((prev) => prev.filter((m) => m.id !== item.id));
        setToDelete(null);
      } else {
        setDeleteError(hostErrorMessage(err, 'No pudimos eliminar el archivo. Inténtalo de nuevo.'));
        if (isUnauthorized(err)) setSessionExpired(true);
      }
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };

  const labelled = useMemo(() => {
    let photos = 0;
    let videos = 0;
    return items.map((item) => ({
      item,
      label: item.type === 'video' ? `Video ${++videos}` : `Foto ${++photos}`,
    }));
  }, [items]);

  const pendingCount = items.filter((m) => m.status === 'pending').length;
  const atLimit = items.length >= MAX_MEDIA_PER_PROPERTY;
  const statusMeta = property ? propertyStatusMeta(property.status) : null;

  // Without access to this property there is nothing to manage, so skip the uploader entirely.
  if (gallery.kind === 'error' && gallery.status !== null && [401, 403, 404].includes(gallery.status)) {
    if (gallery.status === 401) return <SessionExpiredNotice redirectTo={redirectTo} />;
    return (
      <div role="alert" className="elevari-card p-8 text-center">
        <p className="text-elevari-error">
          {gallery.status === 404 ? 'No encontramos este espacio entre tus propiedades.' : gallery.message}
        </p>
        <Link href="/host" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Volver a tus propiedades
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {property && statusMeta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-elevari-border bg-elevari-surface p-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-elevari-slate">{property.title}</p>
            {statusMeta.description && <p className="text-sm text-elevari-muted">{statusMeta.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            {property.status === 'published' && (
              <Link
                href={`/properties/${encodeURIComponent(property.slug)}`}
                className="text-sm font-semibold text-elevari-forest hover:underline"
              >
                Ver publicación
              </Link>
            )}
          </div>
        </div>
      )}

      {sessionExpired && <SessionExpiredNotice redirectTo={redirectTo} />}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading && !atLimit) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={atLimit ? (event) => event.preventDefault() : onDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging ? 'border-elevari-forest bg-elevari-sand/60' : 'border-elevari-border bg-elevari-sand/30'
        } ${uploading ? 'opacity-70' : ''}`}
      >
        <p className="font-semibold text-elevari-slate">Arrastra fotos o videos aquí</p>
        <p className="mt-1 text-sm text-elevari-muted">o elígelos desde tu dispositivo</p>
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_ACCEPT}
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={onInputChange}
        />
        <button
          ref={pickerRef}
          type="button"
          disabled={uploading || atLimit}
          onClick={() => inputRef.current?.click()}
          aria-describedby="media-limits"
          className="elevari-btn-primary mt-4 min-h-[48px]"
        >
          {uploading ? 'Subiendo…' : 'Elegir archivos'}
        </button>
        <p id="media-limits" className="mt-3 text-xs text-elevari-muted">
          {MEDIA_FORMATS_HINT}
        </p>
        {atLimit && (
          <p className="mt-2 text-sm font-medium text-elevari-slate">
            Llegaste al máximo de {MAX_MEDIA_PER_PROPERTY} archivos. Elimina alguno para subir más.
          </p>
        )}

        {progress && (
          <div className="mt-5 text-left">
            <p role="status" className="text-sm font-medium text-elevari-slate">
              Subiendo {progress.index} de {progress.total}: {progress.name}
              {progress.percent >= 100 && ' · procesando…'}
            </p>
            <div
              role="progressbar"
              aria-label={`Progreso de ${progress.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress.percent}
              className="mt-2 h-2 overflow-hidden rounded-full bg-elevari-border"
            >
              <div
                className="h-full rounded-full bg-elevari-forest transition-[width]"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {problems.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-elevari-error/25 bg-elevari-error-soft p-4 text-sm text-elevari-error"
        >
          <p className="font-semibold">
            {problems.length === 1 ? 'No pudimos subir un archivo' : 'No pudimos subir algunos archivos'}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {problems.map((problem, index) => (
              <li key={index}>{problem}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setProblems([])} className="mt-3 font-semibold underline">
            Cerrar
          </button>
        </div>
      )}

      {gallery.kind === 'loading' ? (
        <p role="status" className="text-sm text-elevari-muted">
          Cargando galería…
        </p>
      ) : gallery.kind === 'error' ? (
        <div role="alert" className="elevari-card p-6 text-center">
          <p className="text-elevari-error">{gallery.message}</p>
          <button type="button" onClick={retry} className="elevari-btn-ghost mt-4 min-h-[44px]">
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="elevari-card p-8 text-center">
          <p className="font-semibold text-elevari-slate">Aún no has subido fotos ni videos</p>
          <p className="mt-2 text-sm text-elevari-muted">
            Sube fotos luminosas de los espacios principales. La primera foto aprobada será la portada de tu espacio.
          </p>
        </div>
      ) : (
        <>
          {pendingCount > 0 && (
            <p className="rounded-xl border border-elevari-amber/30 bg-elevari-ivory/80 p-4 text-sm text-elevari-slate">
              {pendingCount === 1
                ? 'Tienes 1 archivo en revisión. Se mostrará a los huéspedes cuando lo aprobemos.'
                : `Tienes ${pendingCount} archivos en revisión. Se mostrarán a los huéspedes cuando los aprobemos.`}
            </p>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labelled.map(({ item, label }) => {
              const status = MEDIA_STATUS[item.status] ?? { label: item.status, tone: 'accent' as const };
              return (
                <li key={item.id} className="overflow-hidden rounded-xl border border-elevari-border bg-elevari-surface">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      aria-label={label}
                      className="aspect-[4/3] w-full bg-elevari-sand object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.thumbnail_url ?? item.url}
                      alt={label}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  <div className="space-y-2 px-3 py-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-semibold text-elevari-slate">{label}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          deleteOpenerRef.current = event.currentTarget;
                          setToDelete({ item, label });
                        }}
                        aria-label={`Eliminar ${label}`}
                        className="elevari-btn-danger min-h-[44px]"
                      >
                        Eliminar
                      </button>
                    </div>
                    {item.status === 'rejected' && (
                      <p className="text-elevari-error">No cumple nuestras guías. Elimínala y sube otra.</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Modal
        open={toDelete !== null}
        onClose={closeDelete}
        title="¿Eliminar este archivo?"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeDelete} disabled={deleting} className="elevari-btn-ghost min-h-[44px]">
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="elevari-btn-danger min-h-[44px]"
            >
              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-elevari-muted">
          {toDelete?.label} se eliminará de tu espacio y no se puede recuperar.
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-sm font-medium text-elevari-error">
            {deleteError}
          </p>
        )}
      </Modal>
    </div>
  );
}
