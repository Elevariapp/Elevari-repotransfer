'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  deletePropertyMedia,
  listPropertyMediaManage,
  uploadPropertyMedia,
  type PropertyMediaItem,
} from '@/lib/media-api';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';

export default function MediaUploader({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<PropertyMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const media = await listPropertyMediaManage(propertyId);
      setItems(media);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error cargando media');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const { media } = await uploadPropertyMedia(propertyId, file);
        setItems((prev) => [...prev, media]);
        toast.success(`${file.name} subido`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Error: ${file.name}`);
      }
    }

    setUploading(false);
    await refresh();
  };

  const onDelete = async (id: string) => {
    try {
      await deletePropertyMedia(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
      toast.success('Eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`relative rounded-2xl border-2 border-dashed border-elevari-border bg-elevari-sand/30 p-8 text-center transition ${
          uploading ? 'opacity-60' : 'hover:border-elevari-forest hover:bg-elevari-sand/50'
        }`}
      >
        <input
          type="file"
          accept={ACCEPT}
          multiple
          disabled={uploading}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => onFiles(e.target.files)}
        />
        <p className="font-semibold text-elevari-slate">Arrastra fotos o videos aquí</p>
        <p className="mt-2 text-sm text-elevari-muted">
          JPG, PNG, WebP, GIF · MP4/WebM · Imágenes hasta 10MB · Video hasta 80MB
        </p>
        {uploading && <p className="mt-3 text-sm font-medium text-elevari-forest">Subiendo…</p>}
      </div>

      {loading ? (
        <p className="text-sm text-elevari-muted">Cargando galería…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-elevari-muted">Sin archivos todavía.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-xl border border-elevari-border bg-elevari-surface">
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  className="aspect-[4/3] w-full object-cover"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={item.thumbnail_url ?? item.url}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="rounded-full bg-elevari-sand px-2 py-0.5 font-semibold text-elevari-muted">
                  {item.type} · {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="font-medium text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
