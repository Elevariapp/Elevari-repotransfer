import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DateRangePicker, type DateRange } from '@/components/DateRangePicker';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { Screen } from '@/components/Screen';
import { Banner, ErrorState, LoadingState } from '@/components/States';
import { Stepper } from '@/components/Stepper';
import { api, getApiErrorMessage, getApiErrorStatus } from '@/lib/api';
import { addDays, todayISO, type ISODate } from '@/lib/dates';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { formatDateRange, formatMoney, pluralize } from '@/lib/format';
import { firstParam } from '@/lib/routes';
import type { AvailabilityResponse, Property, QuoteResponse } from '@/lib/types';

// How far ahead a stay can be picked in the calendar.
const BOOKING_HORIZON_DAYS = 730;

// Every night that is taken: a block covers [start, end), so its end date is free to check out.
function expandBlockedNights(ranges: AvailabilityResponse['blocked_ranges'], maxDate: ISODate): Set<ISODate> {
  const nights = new Set<ISODate>();
  for (const range of ranges) {
    let night = range.start.slice(0, 10);
    const end = range.end.slice(0, 10);
    for (let guard = 0; night < end && night < maxDate && guard < BOOKING_HORIZON_DAYS + 400; guard += 1) {
      nights.add(night);
      night = addDays(night, 1);
    }
  }
  return nights;
}

export default function QuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = firstParam(params.slug);

  const [property, setProperty] = useState<Property | null>(null);
  const [blockedNights, setBlockedNights] = useState<ReadonlySet<ISODate>>(new Set());
  const [calendarWarning, setCalendarWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [range, setRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const latestQuote = useRef(0);

  const minDate = useMemo(() => todayISO(), []);
  const maxDate = useMemo(() => addDays(minDate, BOOKING_HORIZON_DAYS), [minDate]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) {
        setLoadError('No encontramos esta propiedad.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError('');
      try {
        const found = await api.get<Property>(`/properties/${encodeURIComponent(slug)}`);
        if (cancelled) return;
        setProperty(found);
        setGuests((current) => Math.min(Math.max(current, 1), found.max_guests));

        try {
          // Availability is looked up by the property id (the detail endpoint uses the slug).
          const availability = await api.get<AvailabilityResponse>(`/properties/${found.id}/availability`);
          if (!cancelled) setBlockedNights(expandBlockedNights(availability.blocked_ranges, maxDate));
        } catch {
          // The quote still checks availability on the server, so the calendar is a convenience.
          if (!cancelled) setCalendarWarning(true);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          getApiErrorStatus(err) === 404
            ? 'Esta propiedad ya no está disponible.'
            : getApiErrorMessage(err, 'No pudimos cargar la propiedad.'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, maxDate, reloadKey]);

  useEffect(() => {
    const requestId = ++latestQuote.current;
    if (!property || !range.checkIn || !range.checkOut) {
      setQuote(null);
      setQuoteError('');
      setQuoting(false);
      return;
    }

    setQuoting(true);
    setQuoteError('');
    api
      .post<QuoteResponse>('/bookings/quote', {
        property_id: property.id,
        check_in: range.checkIn,
        check_out: range.checkOut,
        guests,
      })
      .then((result) => {
        if (requestId === latestQuote.current) setQuote(result);
      })
      .catch((err) => {
        if (requestId !== latestQuote.current) return;
        setQuote(null);
        setQuoteError(getApiErrorMessage(err, 'No pudimos calcular el precio. Inténtalo de nuevo.'));
      })
      .finally(() => {
        if (requestId === latestQuote.current) setQuoting(false);
      });
  }, [property, range.checkIn, range.checkOut, guests]);

  if (loading || !property) {
    return (
      <Screen title="Elige tus fechas" back backHref="/(guest)">
        {loading ? (
          <LoadingState label="Cargando disponibilidad…" />
        ) : (
          <ErrorState message={loadError || 'No encontramos esta propiedad.'} onRetry={() => setReloadKey((key) => key + 1)} />
        )}
      </Screen>
    );
  }

  const canContinue = Boolean(quote?.available) && !quoting && range.checkIn !== null && range.checkOut !== null;

  const goToBooking = () => {
    if (!range.checkIn || !range.checkOut) return;
    const query = [
      `slug=${encodeURIComponent(property.slug)}`,
      `checkIn=${range.checkIn}`,
      `checkOut=${range.checkOut}`,
      `guests=${guests}`,
    ].join('&');
    router.push(`/(guest)/booking?${query}`);
  };

  return (
    <Screen
      title="Elige tus fechas"
      back
      backHref="/(guest)"
      footer={
        <Button size="lg" fullWidth disabled={!canContinue} loading={quoting} onPress={goToBooking}>
          Continuar
        </Button>
      }
    >
      <Text style={styles.propertyTitle} numberOfLines={2}>
        {property.title}
      </Text>
      <Text style={styles.propertyMeta}>
        {`${property.city ?? property.country} · ${formatMoney(property.price_per_night)} por noche`}
      </Text>

      {calendarWarning ? (
        <Banner tone="info">
          No pudimos cargar el calendario de disponibilidad. Verificaremos las fechas al calcular el precio.
        </Banner>
      ) : null}

      <Card padded style={styles.card}>
        <Text style={styles.sectionTitle}>Fechas</Text>
        <Text style={styles.hint}>
          {!range.checkIn
            ? 'Elige tu día de entrada.'
            : !range.checkOut
              ? 'Ahora elige tu día de salida.'
              : formatDateRange(range.checkIn, range.checkOut)}
        </Text>
        <DateRangePicker
          value={range}
          onChange={setRange}
          minDate={minDate}
          maxDate={maxDate}
          blockedNights={blockedNights}
        />
      </Card>

      <Card padded style={styles.card}>
        <Stepper
          label="Huéspedes"
          value={guests}
          min={1}
          max={property.max_guests}
          onChange={setGuests}
          hint={`Máximo ${pluralize(property.max_guests, 'huésped', 'huéspedes')}`}
        />
      </Card>

      {quoteError ? <Banner tone="error">{quoteError}</Banner> : null}

      {quote && !quote.available ? (
        <Banner tone="error">Esas fechas ya no están disponibles. Elige otras para continuar.</Banner>
      ) : null}

      {quote && quote.available ? (
        <View style={styles.breakdown}>
          <Text style={styles.sectionTitle}>Resumen del precio</Text>
          <PriceBreakdown
            basePrice={quote.fees.base_amount}
            serviceFee={quote.fees.platform_fee_amount}
            total={quote.fees.total_charge_to_guest}
            currency={quote.currency}
            nights={quote.nights}
            pricePerNight={quote.fees.price_per_night}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  propertyTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.ink },
  propertyMeta: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  hint: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.md },
  breakdown: { marginBottom: spacing.md },
});