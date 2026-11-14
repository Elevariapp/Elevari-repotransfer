'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import SearchDropdown from '@/components/ui/SearchDropdown';
import { stayRangeError } from '@/lib/booking-dates';
import 'react-day-picker/dist/style.css';

/** Calendar is loaded only when the guest opens the dates panel (keeps home JS small). */
const DayPicker = dynamic(() => import('react-day-picker').then((mod) => mod.DayPicker), {
  ssr: false,
  loading: () => <div className="h-[320px] w-[300px] animate-pulse rounded-xl bg-elevari-sand" aria-hidden />,
});

const HERO_COVER = '/properties/glamping-wana/01-cover.jpeg';
const HERO_SLIDES = [
  '/properties/glamping-wana/02.webp',
  '/properties/glamping-wana/04.webp',
  '/properties/glamping-wana/05.webp',
  '/properties/glamping-wana/06.webp',
];

const LOCATIONS = [
  { label: 'Cualquier lugar en Colombia', value: '', detail: 'Toda la colección Eleveri' },
  { label: 'Sutatausa', value: 'Sutatausa', detail: 'Sabana, montañas y domos' },
  { label: 'Cucunubá', value: 'Cucunubá', detail: 'Paisaje rural y cielo abierto' },
  { label: 'Cundinamarca', value: 'Cundinamarca', detail: 'Cerca de Bogotá' },
  { label: 'Sabana de Bogotá', value: 'Sabana', detail: 'Escapadas de fin de semana' },
];

type Panel = 'location' | 'guests' | 'dates' | null;

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`ml-auto shrink-0 text-elevari-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GuestStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className="wana-stepper-btn" aria-label="Menos huéspedes">−</button>
      <span className="min-w-[2ch] text-center text-lg font-semibold text-elevari-slate">{value}</span>
      <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} className="wana-stepper-btn" aria-label="Más huéspedes">+</button>
    </div>
  );
}

function LocationPanel({
  city,
  onSelect,
}: {
  city: string;
  onSelect: (value: string, label: string) => void;
}) {
  return (
    <>
      <p className="wana-dropdown-title">¿Dónde quieres ir?</p>
      <ul className="mt-3 max-h-[240px] space-y-1 overflow-y-auto sm:max-h-[280px]">
        {LOCATIONS.map((loc) => (
          <li key={loc.value || 'all'}>
            <button
              type="button"
              onClick={() => onSelect(loc.value, loc.label.replace(' en Colombia', ''))}
              className={`wana-dropdown-option ${city === loc.value ? 'wana-dropdown-option-active' : ''}`}
            >
              <span className="font-semibold text-elevari-slate">{loc.label}</span>
              <span className="text-xs text-elevari-muted">{loc.detail}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function DatesPanel({
  range,
  onSelect,
  onClear,
  onDone,
}: {
  range: DateRange | undefined;
  onSelect: (r: DateRange | undefined) => void;
  onClear: () => void;
  onDone: () => void;
}) {
  const dateError = stayRangeError(range);

  return (
    <>
      <p className="wana-dropdown-title">Selecciona tu estadía</p>
      <p className="mt-1 text-xs text-elevari-muted">Mínimo 1 noche — la salida debe ser después de la entrada.</p>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={onSelect}
        disabled={{ before: new Date() }}
        numberOfMonths={1}
        locale={es}
        className="mx-auto mt-3 wana-calendar"
      />
      {range?.from && !range?.to && (
        <p className="mt-2 text-center text-xs text-elevari-muted">Selecciona la fecha de salida</p>
      )}
      {dateError && (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
          {dateError}
        </p>
      )}
      <div className="mt-3 flex gap-2 border-t border-elevari-border pt-3">
        <button type="button" onClick={onClear} className="wana-btn-ghost min-h-[44px] flex-1 !py-2 text-sm">
          Limpiar
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={Boolean(dateError)}
          className="wana-btn-primary min-h-[44px] flex-1 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Listo
        </button>
      </div>
    </>
  );
}

function GuestsPanel({
  guests,
  onChange,
  onDone,
}: {
  guests: number;
  onChange: (n: number) => void;
  onDone: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-elevari-slate">Huéspedes</p>
          <p className="text-xs text-elevari-muted">Máximo 20 por reserva</p>
        </div>
        <GuestStepper value={guests} min={1} max={20} onChange={onChange} />
      </div>
      <button type="button" onClick={onDone} className="wana-btn-primary mt-4 w-full min-h-[44px] text-sm">
        Listo
      </button>
    </>
  );
}

export default function SearchHero() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [cityLabel, setCityLabel] = useState('Cualquier lugar');
  const [guests, setGuests] = useState(2);
  const [range, setRange] = useState<DateRange | undefined>();
  const [panel, setPanel] = useState<Panel>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideshowReady, setSlideshowReady] = useState(false);

  const closePanel = useCallback(() => setPanel(null), []);
  const openPanel = useCallback((p: Panel) => setPanel((cur) => (cur === p ? null : p)), []);

  useEffect(() => {
    const start = () => setSlideshowReady(true);
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!slideshowReady || HERO_SLIDES.length === 0) return;
    const id = setInterval(() => setSlideIndex((i) => (i + 1) % HERO_SLIDES.length), 8000);
    return () => clearInterval(id);
  }, [slideshowReady]);

  const handleRangeSelect = (next: DateRange | undefined) => {
    setRange(next);
    if (next?.from && next?.to && !stayRangeError(next)) {
      closePanel();
    }
  };

  const handleSearch = () => {
    closePanel();
    const dateError = stayRangeError(range);
    if (dateError) {
      toast.error(dateError);
      setPanel('dates');
      return;
    }

    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (guests > 0) params.set('guests', String(guests));
    if (range?.from) params.set('check_in', format(range.from, 'yyyy-MM-dd'));
    if (range?.to) params.set('check_out', format(range.to, 'yyyy-MM-dd'));
    const q = params.toString();
    router.push(`/properties${q ? `?${q}` : ''}`);
  };

  const dateLabel =
    range?.from && range?.to
      ? `${format(range.from, 'd MMM', { locale: es })} – ${format(range.to, 'd MMM', { locale: es })}`
      : 'Agregar fechas';

  const guestsLabel = guests === 1 ? '1 huésped' : `${guests} huéspedes`;

  const fieldClass = (active: boolean) =>
    `wana-search-field w-full text-left ${active ? 'wana-search-field-active' : ''}`;

  const panelButtonA11y = (name: Exclude<Panel, null>) => ({
    'aria-expanded': panel === name,
    'aria-controls': `elevari-search-${name}-panel`,
  });

  return (
    <section id="buscar" className="relative flex min-h-[85vh] flex-col justify-end lg:min-h-[92vh]">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={HERO_COVER}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={60}
          className="object-cover object-center"
          aria-hidden
        />
        {slideshowReady &&
          HERO_SLIDES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-[2s] ease-in-out ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image src={src} alt="" fill sizes="100vw" quality={60} className="object-cover scale-105 animate-hero-kenburns" />
            </div>
          ))}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/90" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/25" />
      </div>

      <div className="relative z-20 wana-container pb-8 pt-14 sm:pb-12 sm:pt-28 lg:pb-16 lg:pt-32">
        <div className="max-w-3xl animate-slide-up">
          <p className="wana-eyebrow wana-eyebrow-lux !text-elevari-amber-soft">Colección curada · Sabana de Bogotá</p>
          <h1 className="wana-display-hero wana-display-hero--light mt-3 sm:mt-4">
            Escapes naturales, sin complicaciones
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/95 sm:mt-5 sm:text-lg">
            Domos, cabañas y refugios elegidos uno a uno en Sutatausa, Cucunubá y la sabana.
            <span className="hidden sm:inline"> Precio total antes de pagar y confirmación clara.</span>
          </p>
          <ul className="mt-5 hidden flex-wrap gap-2 text-xs font-semibold text-white sm:flex sm:gap-3 sm:text-sm">
            <li className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              ✓ Anfitriones verificados
            </li>
            <li className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              ✓ Precio transparente
            </li>
            <li className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              ✓ Reserva segura
            </li>
          </ul>
        </div>

        <div className="relative z-30 mt-6 max-w-4xl animate-slide-up sm:mt-8 lg:mt-10" style={{ animationDelay: '80ms' }}>
          <div className="wana-search-luxury overflow-visible">
            {/* Mobile: stacked fields + inline expand */}
            <div className="flex flex-col gap-1.5 p-1.5 md:hidden">
              <button type="button" onClick={() => openPanel('location')} className={fieldClass(panel === 'location')} {...panelButtonA11y('location')}>
                <span className="flex w-full flex-col items-start gap-0.5">
                  <span className="wana-search-label">Destino</span>
                  <span className="wana-search-value">{cityLabel}</span>
                </span>
                <Chevron open={panel === 'location'} />
              </button>
              {panel === 'location' && (
                <div
                  id="elevari-search-location-panel"
                  className="wana-dropdown-panel !static !mt-0 shadow-none ring-1 ring-elevari-border"
                >
                  <LocationPanel
                    city={city}
                    onSelect={(value, label) => {
                      setCity(value);
                      setCityLabel(label);
                      closePanel();
                    }}
                  />
                </div>
              )}

              <button type="button" onClick={() => openPanel('dates')} className={fieldClass(panel === 'dates')} {...panelButtonA11y('dates')}>
                <span className="flex w-full flex-col items-start gap-0.5">
                  <span className="wana-search-label">Fechas</span>
                  <span className="wana-search-value">{dateLabel}</span>
                </span>
                <Chevron open={panel === 'dates'} />
              </button>
              {panel === 'dates' && (
                <div
                  id="elevari-search-dates-panel"
                  className="wana-dropdown-panel !static !mt-0 shadow-none ring-1 ring-elevari-border"
                >
                  <DatesPanel
                    range={range}
                    onSelect={handleRangeSelect}
                    onClear={() => {
                      setRange(undefined);
                      closePanel();
                    }}
                    onDone={closePanel}
                  />
                </div>
              )}

              <button type="button" onClick={() => openPanel('guests')} className={fieldClass(panel === 'guests')} {...panelButtonA11y('guests')}>
                <span className="flex w-full flex-col items-start gap-0.5">
                  <span className="wana-search-label">Huéspedes</span>
                  <span className="wana-search-value">{guestsLabel}</span>
                </span>
                <Chevron open={panel === 'guests'} />
              </button>
              {panel === 'guests' && (
                <div
                  id="elevari-search-guests-panel"
                  className="wana-dropdown-panel !static !mt-0 shadow-none ring-1 ring-elevari-border"
                >
                  <GuestsPanel guests={guests} onChange={setGuests} onDone={closePanel} />
                </div>
              )}

              <button type="button" onClick={handleSearch} className="wana-btn-primary mt-1 min-h-[52px] w-full !rounded-2xl">
                <span className="flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Buscar
                </span>
              </button>
            </div>

            {/* Desktop: horizontal bar + floating dropdowns */}
            <div className="hidden md:grid md:grid-cols-[1.35fr_1fr_1fr_auto] md:divide-x md:divide-elevari-border/70">
              <div className="relative">
                <button type="button" onClick={() => openPanel('location')} className={fieldClass(panel === 'location')} {...panelButtonA11y('location')}>
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="wana-search-label">Destino</span>
                    <span className="wana-search-value">{cityLabel}</span>
                  </span>
                  <Chevron open={panel === 'location'} />
                </button>
                <SearchDropdown open={panel === 'location'} onClose={closePanel} className="w-[min(100vw-3rem,360px)]">
                  <LocationPanel
                    city={city}
                    onSelect={(value, label) => {
                      setCity(value);
                      setCityLabel(label);
                      closePanel();
                    }}
                  />
                </SearchDropdown>
              </div>

              <div className="relative">
                <button type="button" onClick={() => openPanel('dates')} className={fieldClass(panel === 'dates')} {...panelButtonA11y('dates')}>
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="wana-search-label">Fechas</span>
                    <span className="wana-search-value">{dateLabel}</span>
                  </span>
                  <Chevron open={panel === 'dates'} />
                </button>
                <SearchDropdown open={panel === 'dates'} onClose={closePanel} align="center" className="w-[360px]">
                  <DatesPanel
                    range={range}
                    onSelect={handleRangeSelect}
                    onClear={() => {
                      setRange(undefined);
                      closePanel();
                    }}
                    onDone={closePanel}
                  />
                </SearchDropdown>
              </div>

              <div className="relative">
                <button type="button" onClick={() => openPanel('guests')} className={fieldClass(panel === 'guests')} {...panelButtonA11y('guests')}>
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="wana-search-label">Huéspedes</span>
                    <span className="wana-search-value">{guestsLabel}</span>
                  </span>
                  <Chevron open={panel === 'guests'} />
                </button>
                <SearchDropdown open={panel === 'guests'} onClose={closePanel} align="right" className="w-[300px]">
                  <GuestsPanel guests={guests} onChange={setGuests} onDone={closePanel} />
                </SearchDropdown>
              </div>

              <div className="flex items-center p-2 pl-1">
                <button type="button" onClick={handleSearch} className="wana-btn-primary min-h-[52px] !rounded-2xl !px-6">
                  <span className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Buscar
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 hidden justify-center sm:mt-10 sm:flex sm:justify-start">
          <a href="#coleccion" className="group flex flex-col items-center gap-2 text-white/70 transition hover:text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Descubre</span>
            <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/35 p-1 group-hover:border-elevari-amber-light">
              <span className="h-2 w-1 rounded-full bg-elevari-amber-soft animate-scroll-hint" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
