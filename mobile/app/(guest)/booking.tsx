import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { api, getApiErrorMessage, getApiErrorStatus } from '@/lib/api';
import { newIdempotencyKey } from '@/lib/booking';
import { diffDays, parseISODate, toDateOnly } from '@/lib/dates';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { formatDateRange, pluralize } from '@/lib/format';
import { firstParam } from '@/lib/routes';
import { useAppStore } from '@/lib/store';
import type { CreateBookingResponse, Property, QuoteResponse } from '@/lib/types';

export default function BookingScreen() {
  const router = useRouter();
  const userName = useAppStore((state) => state.user?.name ?? null);
  const params = useLocalSearchParams<{
    slug?: string | string[];
    checkIn?: string | string[];
    checkOut?: string | string[];
    guests?: string | string[];
  }>();
  const slug = firstParam(params.slug);
  const checkIn = toDateOnly(firstParam(params.checkIn));
  const checkOut = toDateOnly(firstParam(params.checkOut));
  const guests = Number.parseInt(firstParam(params.guests) ?? '', 10);

  const validRequest =
    Boolean(slug) &&
    parseISODate(checkIn) !== null &&
    parseISODate(checkOut) !== null &&
    diffDays(checkIn, checkOut) >= 1 &&
    Number.isInteger(guests) &&
    guests >= 1;

  const [property, setProperty] = useState<Property | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(validRequest);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [datesTaken, setDatesTaken] = useState(false);
  // Same key for retries of the same request, so a lost response never creates a second booking.
  const keyRef = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    if (!validRequest || !slug) return undefined;
    let cancelled = false;

    async function load(listingSlug: string) {
      setLoading(true);
      setLoadError('');
      try {
        const found = await api.get<Property>(`/properties/${encodeURIComponent(listingSlug)}`);
        const fresh = await api.post<QuoteResponse>('/bookings/quote', {
          property_id: found.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
        });
        if (cancelled) return;
        setProperty(found);
        setQuote(fresh);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          getApiErrorStatus(err) === 404
            ? 'Esta propiedad ya no está disponible.'
            : getApiErrorMessage(err, 'No pudimos preparar tu reserva. Inténtalo de nuevo.'),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load(slug);
    return () => {
      cancelled = true;
    };
  }, [validRequest, slug, checkIn, checkOut, guests, reloadKey]);

  if (!validRequest) {
    return (
      <Screen title="Confirmar reserva" back backHref="/(guest)">
        <EmptyState
          title="Faltan datos de la reserva"
          message="Vuelve a elegir tus fechas para continuar."
          actionLabel="Ir a explorar"
          onAction={() => router.replace('/(guest)')}
        />
      </Screen>
    );
  }

  if (loading || !property || !quote) {
    return (
      <Screen title="Confirmar reserva" back backHref="/(guest)">
        {loading ? (
          <LoadingState label="Calculando tu reserva…" />
        ) : (
          <ErrorState message={loadError || 'No pudimos preparar tu reserva.'} onRetry={() => setReloadKey((key) => key + 1)} />
        )}
      </Screen>
    );
  }

  const createBooking = async () => {
    if (submitting) return;

    const signature = `${property.id}|${checkIn}|${checkOut}|${guests}`;
    if (keyRef.current?.signature !== signature) {
      keyRef.current = { signature, key: newIdempotencyKey('bk') };
    }

    setSubmitting(true);
    setSubmitError('');
    setDatesTaken(false);
    try {
      const { booking } = await api.post<CreateBookingResponse>('/bookings', {
        property_id: property.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        idempotency_key: keyRef.current.key,
        ...(userName ? { guest_name: userName } : {}),
      });
      router.replace(`/(guest)/checkout?bookingId=${encodeURIComponent(booking.id)}`);
    } catch (err) {
      setDatesTaken(getApiErrorStatus(err) === 409);
      setSubmitError(getApiErrorMessage(err, 'No pudimos crear tu reserva. Inténtalo de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      title="Confirmar reserva"
      back
      backHref="/(guest)"
      footer={
        <Button size="lg" fullWidth loading={submitting} disabled={!quote.available} onPress={createBooking}>
          Confirmar y pagar
        </Button>
      }
    >
      <Text style={styles.subtitle}>Revisa los detalles antes de pagar</Text>

      <Card padded style={styles.card}>
        <Text style={styles.label}>Propiedad</Text>
        <Text style={styles.value}>{property.title}</Text>
        <Text style={styles.label}>Ubicación</Text>
        <Text style={styles.value}>{property.city ?? property.country}</Text>
        <Text style={styles.label}>Fechas</Text>
        <Text style={styles.value}>{`${formatDateRange(checkIn, checkOut)} · ${pluralize(quote.nights, 'noche', 'noches')}`}</Text>
        <Text style={styles.label}>Huéspedes</Text>
        <Text style={[styles.value, styles.lastValue]}>{pluralize(guests, 'persona', 'personas')}</Text>
      </Card>

      {!quote.available ? (
        <Banner tone="error">Esas fechas ya no están disponibles. Vuelve atrás y elige otras.</Banner>
      ) : (
        <View style={styles.breakdown}>
          <PriceBreakdown
            basePrice={quote.fees.base_amount}
            serviceFee={quote.fees.platform_fee_amount}
            total={quote.fees.total_charge_to_guest}
            currency={quote.currency}
            nights={quote.nights}
            pricePerNight={quote.fees.price_per_night}
          />
        </View>
      )}

      {submitError ? <Banner tone="error">{submitError}</Banner> : null}
      {datesTaken ? (
        <View style={styles.breakdown}>
          <Text style={styles.note}>
            Si ya iniciaste una reserva para estas fechas, puedes terminarla desde «Mis reservas».
          </Text>
          <Button variant="secondary" fullWidth onPress={() => router.push('/(guest)/my-bookings')}>
            Ver mis reservas
          </Button>
        </View>
      ) : null}

      <Text style={styles.note}>
        Tu reserva queda pendiente hasta completar el pago. Si no pagas, las fechas se liberan automáticamente.
      </Text>
      <Text
        style={styles.link}
        accessibilityRole="link"
        onPress={() => router.push('/(guest)/legal/refund')}
      >
        Ver política de reembolso
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  label: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  value: { fontSize: typography.sizes.body, color: colors.slate, fontWeight: typography.weights.medium, marginBottom: spacing.md },
  lastValue: { marginBottom: 0 },
  breakdown: { marginBottom: spacing.md },
  note: { fontSize: typography.sizes.caption, color: colors.muted, lineHeight: 19, marginBottom: spacing.sm },
  link: { fontSize: typography.sizes.caption, color: colors.forest, fontWeight: typography.weights.semibold },
});