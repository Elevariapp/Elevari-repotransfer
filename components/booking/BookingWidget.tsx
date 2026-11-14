'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format, addDays, parseISO, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { wanaApi, type BookingQuote } from '@/lib/api-client';
import { analytics } from '@/lib/analytics';
import PriceBreakdown from '@/components/ui/PriceBreakdown';
import { isValidStayRange, stayRangeError } from '@/lib/booking-dates';
import { useAuth } from '@/hooks/useAuth';
import 'react-day-picker/dist/style.css';

interface BookingWidgetProps {
  propertyId: string;
  slug: string;
  pricePerNight: number;
  maxGuests: number;
  currency?: string;
}

function toDateString(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function formatMoney(amount: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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
    <div className="flex items-center justify-between">
      <span className="text-sm text-elevari-slate">Huéspedes</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-elevari-border bg-white text-elevari-forest transition hover:border-elevari-amber disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-elevari-slate">{value}</span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-elevari-border bg-white text-elevari-forest transition hover:border-elevari-amber disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function BookingWidget({
  propertyId,
  slug,
  pricePerNight,
  maxGuests,
  currency = 'COP',
}: BookingWidgetProps) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [blockedRanges, setBlockedRanges] = useState<Array<{ start: string; end: string }>>([]);
  const [showCalendar, setShowCalendar] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const loginRedirect = `${pathname}?book=1`;
  const lastQuoteSignature = useRef<string | null>(null);

  useEffect(() => {
    wanaApi.getAvailability(propertyId)
      .then((data) => setBlockedRanges(data.blocked_ranges))
      .catch(() => setBlockedRanges([]));
  }, [propertyId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('book') === '1') {
      setShowCalendar(true);
      setMobileOpen(true);
    }
  }, []);

  const disabledDays = useMemo(() => {
    const days: Date[] = [];
    for (const block of blockedRanges) {
      try {
        const start = parseISO(block.start);
        const end = parseISO(block.end);
        days.push(...eachDayOfInterval({ start, end: addDays(end, -1) }));
      } catch {
        /* skip */
      }
    }
    return days;
  }, [blockedRanges]);

  const fetchQuote = useCallback(async () => {
    if (!isValidStayRange(range)) {
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    try {
      const result = await wanaApi.quoteBooking({
        property_id: propertyId,
        check_in: toDateString(range.from),
        check_out: toDateString(range.to),
        guests,
      });
      setQuote(result);

      const signature = `${toDateString(range.from)}|${toDateString(range.to)}|${guests}`;
      if (lastQuoteSignature.current !== signature) {
        lastQuoteSignature.current = signature;
        analytics.viewQuote({
          propertyId,
          nights: result.nights,
          total: result.fees?.total_charge_to_guest ?? 0,
          available: result.available,
        });
      }
    } catch (err) {
      setQuote(null);
      toast.error(err instanceof Error ? err.message : 'No se pudo calcular el precio');
    } finally {
      setQuoteLoading(false);
    }
  }, [propertyId, range, guests]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleRangeSelect = (next: DateRange | undefined) => {
    setRange(next);
    const error = stayRangeError(next);
    setDateError(error);
    if (error) setQuote(null);
    if (next?.from && next?.to && !error) {
      analytics.selectDates({
        propertyId,
        checkIn: toDateString(next.from),
        checkOut: toDateString(next.to),
        nights: differenceInCalendarDays(next.to, next.from),
      });
    }
  };

  const handleReserve = async () => {
    if (!isValidStayRange(range) || !quote?.available) return;

    if (authLoading) return;

    if (!user) {
      toast.error('Inicia sesión para reservar');
      window.location.href = `/auth/login?redirect=${encodeURIComponent(loginRedirect)}`;
      return;
    }

    setBookingLoading(true);
    try {
      const { booking, reused } = await wanaApi.createBooking({
        property_id: propertyId,
        check_in: toDateString(range.from),
        check_out: toDateString(range.to),
        guests,
        idempotency_key: crypto.randomUUID(),
      });

      const bookingId = (booking as { id: string }).id;
      toast.success(reused ? 'Reserva existente' : '¡Listo! Continúa al pago');
      window.location.href = `/checkout/${bookingId}?property=${slug}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reservar');
    } finally {
      setBookingLoading(false);
    }
  };

  const nights = quote?.nights ?? 0;
  const canReserve = isValidStayRange(range) && quote?.available && nights > 0 && !quoteLoading && !bookingLoading && !dateError;
  const totalDisplay =
    quote?.available && quote.fees
      ? formatMoney(quote.fees.total_charge_to_guest, currency)
      : formatMoney(pricePerNight, currency);

  const widgetBody = (
    <div className="wana-card-premium p-6 lg:shadow-wana-lg ring-1 ring-elevari-amber/10">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-elevari-slate">{formatMoney(pricePerNight, currency)}</span>
        <span className="text-elevari-muted">/ noche</span>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-elevari-border bg-white/80">
        <button
          type="button"
          onClick={() => setShowCalendar((s) => !s)}
          className="grid w-full grid-cols-2 border-b border-elevari-border text-left"
        >
          <div className="border-r border-elevari-border p-3 hover:bg-elevari-ivory/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-elevari-muted">Entrada</p>
            <p className="text-sm text-elevari-slate">
              {range?.from ? format(range.from, 'd MMM', { locale: es }) : 'Agregar'}
            </p>
          </div>
          <div className="p-3 hover:bg-elevari-ivory/80">
            <p className="text-[10px] font-bold uppercase tracking-wider text-elevari-muted">Salida</p>
            <p className="text-sm text-elevari-slate">
              {range?.to ? format(range.to, 'd MMM', { locale: es }) : 'Agregar'}
            </p>
          </div>
        </button>
        <div className="p-3 hover:bg-elevari-ivory/80">
          <GuestStepper value={guests} min={1} max={maxGuests} onChange={setGuests} />
        </div>
      </div>

      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="wana-calendar mt-4 flex justify-center rounded-xl bg-elevari-sand/50 p-2">
              <DayPicker
                mode="range"
                selected={range}
                onSelect={handleRangeSelect}
                disabled={[{ before: new Date() }, ...disabledDays]}
                numberOfMonths={1}
                locale={es}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {dateError && (
        <p role="alert" className="mt-4 rounded-xl border border-elevari-amber/40 bg-elevari-warning-soft px-4 py-3 text-sm text-elevari-warning">
          {dateError}
        </p>
      )}

      {quote && !quote.available && !dateError && (
        <p role="status" className="mt-4 rounded-xl border border-elevari-amber/40 bg-elevari-warning-soft px-4 py-3 text-sm text-elevari-warning">
          Estas fechas no están disponibles. Prueba otro rango.
        </p>
      )}

      {quote?.available && nights > 0 && (
        <PriceBreakdown
          className="mt-5"
          fees={quote.fees}
          format={(amount) => formatMoney(amount, currency)}
        />
      )}

      <button
        type="button"
        onClick={handleReserve}
        disabled={!canReserve || authLoading}
        className="wana-btn-primary mt-6 w-full min-h-[48px]"
      >
        {!user ? 'Inicia sesión para reservar' : bookingLoading ? 'Reservando…' : quoteLoading ? 'Calculando…' : 'Reservar'}
      </button>
      <p className="mt-3 text-center text-xs text-elevari-muted">No se hará ningún cobro por ahora</p>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">{widgetBody}</div>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-elevari-border wana-glass px-4 py-3 shadow-[0_-8px_30px_rgba(15,31,24,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-elevari-slate">{totalDisplay}</p>
            <p className="text-xs text-elevari-muted">
              {nights > 0 ? `${nights} noches` : 'Selecciona fechas'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="wana-btn-primary !px-6 min-h-[44px]"
          >
            Reservar
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-sheet-title"
              className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-elevari-ivory p-4 pb-8"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 id="booking-sheet-title" className="font-display font-semibold text-elevari-ink">Tu estadía</h3>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="wana-btn-ghost !px-4 !py-2 text-sm min-h-[36px]"
                >
                  Cerrar
                </button>
              </div>
              {widgetBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
