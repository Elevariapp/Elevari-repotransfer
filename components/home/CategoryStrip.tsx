'use client';

import { useRouter } from 'next/navigation';

/** Ubicaciones + destacado — sin duplicados confusos */
const REGIONS = [
  { label: 'Toda la colección', city: '', detail: 'Colombia' },
  { label: 'Sutatausa', city: 'Sutatausa', detail: 'Montañas y domos' },
  { label: 'Cucunubá', city: 'Cucunubá', detail: 'Sabana rural' },
  { label: 'Sabana de Bogotá', city: 'Sabana', detail: 'Cerca de la capital' },
] as const;

const HIGHLIGHT = { label: 'Destacado', slug: 'glamping-wana', detail: 'Mejor valorado' } as const;

export default function CategoryStrip({ activeCity }: { activeCity?: string }) {
  const router = useRouter();

  const goCity = (city: string) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    router.push(`/properties${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section className="relative z-10 border-b border-elevari-border/70 bg-white/95 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="wana-container py-3 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-elevari-muted">
            Explorar
          </p>

          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-elevari-muted/80 lg:sr-only">
              Por región
            </p>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {REGIONS.map((item) => {
                const active =
                  activeCity === item.city || (!activeCity && !item.city);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goCity(item.city)}
                    className={`wana-category-chip shrink-0 ${active ? 'wana-category-chip-active' : ''}`}
                  >
                    <span className="text-left">
                      <span className="block leading-tight">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] font-normal text-elevari-muted sm:hidden">
                        {item.detail}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden h-8 w-px shrink-0 bg-wana-border lg:block" aria-hidden />

          <button
            type="button"
            onClick={() => router.push(`/properties/${HIGHLIGHT.slug}`)}
            className="wana-category-chip w-full shrink-0 justify-center border-elevari-amber/40 bg-elevari-amber/10 lg:w-auto"
          >
            <span aria-hidden className="text-elevari-amber">
              ★
            </span>
            <span>
              {HIGHLIGHT.label}
              <span className="hidden text-elevari-muted lg:inline"> · {HIGHLIGHT.detail}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
