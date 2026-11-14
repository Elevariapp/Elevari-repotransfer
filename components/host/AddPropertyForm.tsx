'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { wanaApi } from '@/lib/api-client';
import { uploadPropertyMedia } from '@/lib/media-api';

const AMENITY_OPTIONS = ['WiFi', 'Agua caliente', 'Estacionamiento', 'Cocina', 'Vista', 'Pet friendly'];

export default function AddPropertyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    const city = String(form.get('city') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const price = Number(form.get('price'));
    const maxGuests = Number(form.get('max_guests') ?? 2);

    try {
      const { property } = await wanaApi.createHostProperty({
        title,
        description,
        city,
        price_per_night: price,
        max_guests: maxGuests,
        amenities,
      });

      if (file) {
        await uploadPropertyMedia(property.id, file);
      }

      toast.success('Propiedad creada. Agrega más fotos si quieres.');
      router.push(`/host/properties/${property.id}/media`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la propiedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="wana-card space-y-6 p-6 sm:p-8">
      <div className="rounded-xl border border-elevari-amber/30 bg-elevari-ivory/80 p-4 text-sm text-elevari-slate">
        <p className="font-semibold">Guía de calidad</p>
        <p className="mt-1 text-elevari-muted">
          Usa fotos bien iluminadas en alta resolución. Tu espacio quedará en borrador hasta que un
          administrador lo publique.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="wana-label">Título</span>
          <input name="title" required minLength={3} className="wana-input" placeholder="Domo en el bosque" />
        </label>
        <label className="block space-y-1.5">
          <span className="wana-label">Ciudad / zona</span>
          <input name="city" required className="wana-input" placeholder="Guatavita, Cundinamarca" />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="wana-label">Descripción</span>
        <textarea
          name="description"
          required
          minLength={20}
          rows={5}
          className="wana-input min-h-[120px]"
          placeholder="Describe la experiencia, acceso y lo que incluye la estadía…"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="wana-label">Precio por noche (COP)</span>
          <input name="price" type="number" min={1} required className="wana-input" />
        </label>
        <label className="block space-y-1.5">
          <span className="wana-label">Huéspedes máx.</span>
          <input name="max_guests" type="number" min={1} max={20} defaultValue={2} className="wana-input" />
        </label>
      </div>

      <fieldset>
        <legend className="wana-label">Comodidades</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((name) => {
            const active = amenities.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleAmenity(name)}
                className={`wana-chip ${active ? 'wana-chip-active' : ''}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="wana-label">Foto o video destacado (opcional)</span>
        <input
          type="file"
          accept="image/jpeg,image/webp,image/png,video/mp4,video/quicktime"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="wana-input text-sm"
        />
      </label>

      <button type="submit" disabled={loading} className="wana-btn-primary w-full sm:w-auto min-h-[48px]">
        {loading ? 'Creando…' : 'Crear y subir media'}
      </button>
    </form>
  );
}
