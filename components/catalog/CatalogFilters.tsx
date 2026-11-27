'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useI18n } from '@/components/i18n/useI18n';
import { analytics } from '@/lib/analytics';
import { saveLastSearch } from '@/lib/conversion/intent-recovery';
import {
  CATALOG_AMENITIES,
  CATALOG_SORTS,
  PRICE_PRESETS,
  activeFilterCount,
  pricePreset,
  toCatalogHref,
  toggleAmenity,
  type CatalogParams,
  type CatalogSort,
} from '@/lib/catalog-params';

export default function CatalogFilters({ params }: { params: CatalogParams }) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const active = activeFilterCount(params);
  const currentPreset = pricePreset(params);

  const go = (next: CatalogParams) => {
    saveLastSearch({
      city: next.city,
      guests: next.guests,
      sort: next.sort,
      min_price: next.minPrice,
      max_price: next.maxPrice,
      amenities: next.amenities,
    });
    startTransition(() => {
      router.push(toCatalogHref(next), { scroll: false });
    });
  };

  const applyPreset = (value: string) => {
    const preset = PRICE_PRESETS.find((p) => p.value === value);
    analytics.filterApplied({ key: 'price', value, activeFilters: active });
    go({ ...params, minPrice: preset?.min, maxPrice: preset?.max, offset: 0 });
  };

  const applyAmenity = (amenity: string) => {
    analytics.filterApplied({
      key: 'amenity',
      value: amenity,
      activeFilters: active + (params.amenities.includes(amenity) ? -1 : 1),
    });
    go(toggleAmenity(params, amenity));
  };

  const applySort = (sort: string) => {
    analytics.sortApplied({ sort, activeFilters: active });
    go({ ...params, sort: sort as CatalogSort, offset: 0 });
  };

  const clearFilters = () => {
    analytics.filterApplied({ key: 'clear', value: 'all', activeFilters: 0 });
    go({
      ...params,
      sort: 'recommended',
      minPrice: undefined,
      maxPrice: undefined,
      amenities: [],
      offset: 0,
    });
  };

  return (
    <section
      aria-label={t('Common', 'catalog.filterAria')}
      className="mt-6 rounded-[var(--elevari-radius-lg)] border border-elevari-border bg-elevari-surface p-4 shadow-[var(--elevari-shadow-soft)] sm:p-5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[190px]">
            <label htmlFor="catalog-sort" className="elevari-label mb-1.5 block">
              {t('Common', 'catalog.sortBy')}
            </label>
            <select
              id="catalog-sort"
              value={params.sort}
              onChange={(event) => applySort(event.target.value)}
              className="elevari-input min-h-[44px] w-full min-w-[190px]"
            >
              {CATALOG_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t('Common', `catalog.sort${option.value.charAt(0).toUpperCase()}${option.value
                    .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
                    .slice(1)}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <p aria-live="polite" className="text-xs font-medium text-elevari-muted">
              {pending
                ? t('Common', 'catalog.updating')
                : active > 0
                  ? `${active} ${t('Common', 'catalog.activeFilters')}`
                  : t('Common', 'catalog.noFilters')}
            </p>
            {active > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-[44px] rounded-full border border-elevari-border px-4 text-xs font-semibold text-elevari-forest transition hover:border-elevari-forest"
              >
                {t('Common', 'searchClear')}
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="catalog-keyword" className="elevari-label mb-1.5 block">
            {t('Common', 'catalog.keyword')}
          </label>
          <input
            id="catalog-keyword"
            type="search"
            defaultValue={params.q ?? ''}
            placeholder={t('Common', 'searchKeywordPlaceholder')}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              go({ ...params, q: event.currentTarget.value.trim() || undefined, offset: 0 });
            }}
            onBlur={(event) => {
              const next = event.currentTarget.value.trim() || undefined;
              if (next !== params.q) go({ ...params, q: next, offset: 0 });
            }}
            className="elevari-input min-h-[44px] w-full"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-elevari-muted">
            {t('Common', 'catalog.pricePerNight')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {PRICE_PRESETS.map((preset) => {
              const selected = currentPreset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyPreset(preset.value)}
                  className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold transition ${
                    selected
                      ? 'border-elevari-action bg-elevari-action text-white'
                      : 'border-elevari-border bg-elevari-surface text-elevari-slate hover:border-elevari-forest'
                  }`}
                >
                  {preset.value === 'any'
                    ? t('Common', 'catalog.anyPrice')
                    : preset.max !== undefined && preset.min === undefined
                      ? `${t('Common', 'catalog.lessThan')} ${preset.label.replace('Menos de ', '')}`
                      : preset.min !== undefined && preset.max === undefined
                        ? `${t('Common', 'catalog.moreThan')} ${preset.label.replace('Más de ', '')}`
                        : preset.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-elevari-muted">
            Comodidades
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATALOG_AMENITIES.map((amenity) => {
              const selected = params.amenities.includes(amenity.value);
              return (
                <button
                  key={amenity.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyAmenity(amenity.value)}
                  className={`min-h-[40px] rounded-full border px-4 text-xs font-semibold transition ${
                    selected
                      ? 'border-elevari-forest bg-elevari-fresh-soft text-elevari-forest-deep'
                      : 'border-elevari-border bg-elevari-surface text-elevari-slate hover:border-elevari-forest'
                  }`}
                >
                  {amenity.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
