'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/useI18n';

/** Ubicaciones + destacado — sin duplicados confusos */
const REGIONS = [
  { labelKey: 'regionAll', city: '', detailKey: 'regionColombia' },
  { labelKey: 'regionSutatausa', city: 'Sutatausa', detailKey: 'regionSutatausaDetail' },
  { labelKey: 'regionCucunuba', city: 'Cucunubá', detailKey: 'regionCucunubaDetail' },
  { labelKey: 'regionSabana', city: 'Sabana', detailKey: 'regionSabanaDetail' },
] as const;

const HIGHLIGHT = { labelKey: 'highlightFeatured', slug: 'glamping-wana', detailKey: 'highlightFeaturedDetail' } as const;

export default function CategoryStrip({ activeCity }: { activeCity?: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const goCity = (city: string) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    router.push(`/properties${params.toString() ? `?${params}` : ''}`);
  };

  const label = (key: string) => t('Common', key);

  return (
    <section className="relative z-10 border-b border-elevari-border/70 bg-elevari-surface/95 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="elevari-container py-3 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-elevari-muted">
            {label('explore')}
          </p>

          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-elevari-muted/80 lg:sr-only">
              {label('byRegion')}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {REGIONS.map((item) => {
                const active =
                  activeCity === item.city || (!activeCity && !item.city);
                return (
                  <button
                    key={item.labelKey}
                    type="button"
                    onClick={() => goCity(item.city)}
                    className={`elevari-category-chip shrink-0 ${active ? 'elevari-category-chip-active' : ''}`}
                  >
                    <span className="text-left">
                      <span className="block leading-tight">{label(item.labelKey)}</span>
                      <span
                        className={`mt-0.5 block text-[10px] font-normal sm:hidden ${
                          active ? 'text-white' : 'text-elevari-muted'
                        }`}
                      >
                        {label(item.detailKey)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden h-8 w-px shrink-0 bg-elevari-border lg:block" aria-hidden />

          <button
            type="button"
            onClick={() => router.push(`/properties/${HIGHLIGHT.slug}`)}
            className="elevari-category-chip w-full shrink-0 justify-center border-elevari-amber/40 bg-elevari-amber/10 lg:w-auto"
          >
            <span aria-hidden className="text-elevari-amber">
              ★
            </span>
            <span>
              {label(HIGHLIGHT.labelKey)}
              <span className="hidden text-elevari-muted lg:inline"> · {label(HIGHLIGHT.detailKey)}</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
