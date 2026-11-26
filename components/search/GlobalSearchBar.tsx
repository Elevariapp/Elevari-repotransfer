'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/useI18n';

const LOCATIONS = [
  { label: 'Cualquier lugar en Colombia', value: '', detail: 'Toda la colección Elevari' },
  { label: 'Sutatausa', value: 'Sutatausa', detail: 'Sabana, montañas y domos' },
  { label: 'Cucunubá', value: 'Cucunubá', detail: 'Paisaje rural y cielo abierto' },
  { label: 'Cundinamarca', value: 'Cundinamarca', detail: 'Cerca de Bogotá' },
  { label: 'Sabana de Bogotá', value: 'Sabana', detail: 'Escapadas de fin de semana' },
];

export default function GlobalSearchBar({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [city, setCity] = useState('');
  const [cityLabel, setCityLabel] = useState(t('Common', 'search.destinationPlaceholder'));
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string, label: string) => {
    setCity(value);
    setCityLabel(label.replace(' en Colombia', ''));
    setOpen(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    router.push(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className={`relative inline-block w-full ${className}`}>
      <div className="relative w-full">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="elevari-global-search-location-list"
          autoComplete="off"
          value={cityLabel}
          onChange={(e) => {
            const typed = e.target.value;
            setCityLabel(typed);
            // Match typed value against known locations
            const match = LOCATIONS.find((l) => l.label.toLowerCase().includes(typed.toLowerCase()) || typed.toLowerCase().includes(l.label.toLowerCase()));
            if (match) {
              setCity(match.value);
            } else if (!typed) {
              setCity('');
            }
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
          className="w-full min-h-[44px] px-4 py-2 text-left text-white bg-white/10 border border-white/20 rounded-xl placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-elevari-amber-soft focus:border-transparent transition-all"
          placeholder={t('Common', 'search.destinationPlaceholder')}
        />
        {open && (
          <ul
            id="elevari-global-search-location-list"
            role="listbox"
            className="absolute z-50 mt-1 w-full max-h-[240px] overflow-y-auto rounded-xl border border-white/20 bg-white/10 shadow-xl text-white"
          >
            {LOCATIONS.map((loc) => (
              <li key={loc.value || 'all'} role="option">
                <button
                  type="button"
                  onClick={() => handleSelect(loc.value, loc.label)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/20 focus:outline-none focus:bg-white/20 transition-colors"
                >
                  <span className="font-semibold block">{loc.label}</span>
                  <span className="text-xs text-white/70">{loc.detail}</span>
                </button>
              </li>
            ))}
            <li role="separator" className="border-t border-white/10 my-1" aria-hidden="true" />
            <li role="option">
              <button
                type="button"
                onClick={() => {
                  setCity('');
                  setCityLabel(t('Common', 'search.anywhere'));
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-elevari-amber-soft hover:bg-white/10 focus:outline-none focus:bg-white/10 transition-colors"
              >
                {t('Common', 'search.clearSelection')}
              </button>
            </li>
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={handleSearch}
        className="mt-2 w-full min-h-[44px] rounded-xl bg-elevari-amber-soft px-4 py-2 text-sm font-semibold text-elevari-slate hover:bg-elevari-amber focus:outline-none focus:ring-2 focus:ring-elevari-amber focus:ring-offset-2 focus:ring-offset-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('Common', 'search.search')}
      </button>
    </div>
  );
}