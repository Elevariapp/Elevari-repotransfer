'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/useI18n';
import { wanaApi } from '@/lib/api-client';

interface CityOption {
  label: string;
  value: string;
  detail: string;
}

/**
 * Two layouts:
 *  - `compact` for the header slot (320-420px): destination + keyword + submit, one row, no overflow.
 *  - `full` for hero/landing surfaces: destination + keyword + dates + guests.
 * Dates and guests live in the hero search (`SearchHero`), so the header never needs them.
 */
export default function GlobalSearchBar({
  className = '',
  variant = 'full',
}: {
  className?: string;
  variant?: 'compact' | 'full';
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);

  const anywhere: CityOption = {
    label: t('Common', 'search.anywhere'),
    value: '',
    detail: t('Common', 'collection'),
  };

  // The visible label follows the selected city *and* the active language.
  const cityLabel = city || t('Common', 'search.destinationPlaceholder');

  useEffect(() => {
    let cancelled = false;
    wanaApi
      .getCities()
      .then(({ data }) => {
        if (cancelled) return;
        setLocations(
          data.map((cityName) => ({
            label: cityName,
            value: cityName,
            detail: t('Common', 'searchResultsFor'),
          })),
        );
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    if (guests) params.set('guests', guests);
    router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const clearAll = () => {
    setCity('');
    setKeyword('');
    setCheckIn('');
    setCheckOut('');
    setGuests('');
  };

  if (variant === 'compact') {
    return (
      <div className={`relative flex w-full items-center gap-2 ${className}`}>
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="elevari-header-search-list"
            aria-label={t('Common', 'search.destinationPlaceholder')}
            autoComplete="off"
            value={open ? city : cityLabel}
            placeholder={t('Common', 'search.destinationPlaceholder')}
            disabled={loading}
            onChange={(e) => {
              setCity(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="min-h-[40px] w-full truncate rounded-full border border-white/20 bg-white/10 py-2 pl-3 pr-3 text-sm text-white placeholder-white/55 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
          />
          {open && !loading && (
            <ul
              id="elevari-header-search-list"
              role="listbox"
              className="absolute left-0 top-full z-[70] mt-1 max-h-[260px] w-[260px] overflow-y-auto rounded-xl border border-white/20 bg-elevari-slate/95 text-white shadow-2xl backdrop-blur"
            >
              <li role="option" aria-selected={!city}>
                <button
                  type="button"
                  onClick={() => {
                    setCity('');
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/20 focus:bg-white/20 focus:outline-none"
                >
                  {anywhere.label}
                </button>
              </li>
              {locations.map((loc) => (
                <li key={loc.value} role="option" aria-selected={city === loc.value}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(loc.value);
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/20 focus:bg-white/20 focus:outline-none"
                  >
                    {loc.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          aria-label={t('Common', 'search.search')}
          className="shrink-0 rounded-full bg-elevari-amber-soft p-2.5 text-elevari-slate transition hover:bg-elevari-amber focus:outline-none focus:ring-2 focus:ring-elevari-amber"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <label htmlFor="search-where" className="sr-only">
            {t('Common', 'search.destinationPlaceholder')}
          </label>
          <input
            id="search-where"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="elevari-global-search-location-list"
            autoComplete="off"
            value={open ? city : cityLabel}
            placeholder={t('Common', 'search.destinationPlaceholder')}
            disabled={loading}
            onChange={(e) => {
              setCity(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="min-h-[44px] w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-left text-white placeholder-white/50 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
          />
          {open && !loading && (
            <ul
              id="elevari-global-search-location-list"
              role="listbox"
              className="absolute z-50 mt-1 max-h-[240px] w-full overflow-y-auto rounded-xl border border-white/20 bg-elevari-slate/95 text-white shadow-xl backdrop-blur"
            >
              <li role="option" aria-selected={!city}>
                <button
                  type="button"
                  onClick={() => {
                    setCity('');
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/20 focus:bg-white/20 focus:outline-none"
                >
                  <span className="block font-semibold">{anywhere.label}</span>
                  <span className="text-xs text-white/70">{anywhere.detail}</span>
                </button>
              </li>
              {locations.map((loc) => (
                <li key={loc.value} role="option" aria-selected={city === loc.value}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(loc.value);
                      setOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/20 focus:bg-white/20 focus:outline-none"
                  >
                    <span className="block font-semibold">{loc.label}</span>
                    <span className="text-xs text-white/70">{loc.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loading && open && (
            <div
              role="status"
              className="absolute z-50 mt-1 w-full animate-pulse rounded-xl border border-white/20 bg-white/10 p-4 text-white shadow-xl"
            >
              <p className="text-xs text-white/70">{t('Common', 'searchLoadingDestinations')}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="search-keyword" className="sr-only">
            {t('Common', 'searchKeywordPlaceholder')}
          </label>
          <input
            id="search-keyword"
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={t('Common', 'searchKeywordPlaceholder')}
            className="min-h-[44px] w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
          />
        </div>


        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            aria-label={t('Common', 'checkIn')}
            className="min-h-[44px] w-full rounded-xl border border-white/20 bg-white/10 px-2 py-2 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
          />
          <input
            type="date"
            value={checkOut}
            min={checkIn || undefined}
            onChange={(e) => setCheckOut(e.target.value)}
            aria-label={t('Common', 'checkOut')}
            className="min-h-[44px] w-full rounded-xl border border-white/20 bg-white/10 px-2 py-2 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
          />
        </div>

        <div>
          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            aria-label={t('Common', 'searchGuests')}
            className="min-h-[44px] w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
          >
            <option value="">{t('Common', 'searchGuests')}</option>
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((count) => (
              <option key={count} value={count} className="text-elevari-slate">
                {count}+ {t('Common', 'guests')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleSearch}
          className="min-h-[44px] flex-1 rounded-xl bg-elevari-amber-soft px-4 py-2 text-sm font-semibold text-elevari-slate transition-all hover:bg-elevari-amber focus:outline-none focus:ring-2 focus:ring-elevari-amber focus:ring-offset-2 focus:ring-offset-white/10"
        >
          {t('Common', 'search.search')}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="min-h-[44px] rounded-xl border border-white/25 px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft"
        >
          {t('Common', 'searchClear')}
        </button>
      </div>
    </div>
  );
}

