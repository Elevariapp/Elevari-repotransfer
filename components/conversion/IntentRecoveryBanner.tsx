'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLastSearch, clearLastSearch } from '@/lib/conversion/intent-recovery';
import { toCatalogHref } from '@/lib/catalog-params';
import { track } from '@/lib/conversion/analytics';

export default function IntentRecoveryBanner() {
  const [search, setSearch] = useState<ReturnType<typeof getLastSearch> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const last = getLastSearch();
    if (last) setSearch(last);
  }, []);

  if (!search) return null;

  const hasContext = search.city || search.guests || search.min_price || search.max_price || (search.amenities && search.amenities.length > 0);

  if (!hasContext) return null;

  const restore = () => {
    track('intent_recovery_restored', { city: search.city });
    router.push(toCatalogHref({
      city: search.city,
      guests: search.guests,
      sort: (search.sort as any) || 'recommended',
      minPrice: search.min_price,
      maxPrice: search.max_price,
      amenities: search.amenities || [],
      offset: 0,
      limit: 24,
    } as any));
  };

  const dismiss = () => {
    clearLastSearch();
    setSearch(null);
  };

  return (
    <div className="wana-container py-4">
      <div className="rounded-2xl border border-elevari-amber/30 bg-elevari-sand/40 p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-elevari-slate">
          ¿Quieres <strong>continuar búsqueda anterior</strong>?
          {search.city && <span className="ml-1">en {search.city}</span>}
          {search.guests && <span className="ml-1">· {search.guests} huéspedes</span>}
        </p>
        <div className="flex gap-2">
          <button onClick={restore} className="min-h-[40px] rounded-full bg-elevari-forest px-4 text-sm font-semibold text-white">
            Continuar búsqueda
          </button>
          <button onClick={dismiss} className="min-h-[40px] rounded-full border border-elevari-border px-4 text-sm font-semibold text-elevari-slate">
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}
