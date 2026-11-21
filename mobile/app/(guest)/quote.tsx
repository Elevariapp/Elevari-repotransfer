import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { ErrorBanner, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import type { CreateBookingBody, CreateBookingResponse, QuoteRequest, QuoteResponse } from '@/types';

function newIdempotencyKey(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export default function QuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ propertyId: string; checkIn: string; checkOut: string; guests: string }>();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  // One key per quote screen so retrying a failed/timeouts request never creates a second booking.
  const idempotencyKey = useRef(newIdempotencyKey());

  const request: QuoteRequest | null =
    params.propertyId && params.checkIn && params.checkOut
      ? {
          property_id: String(params.propertyId),
          check_in: String(params.checkIn),
          check_out: String(params.checkOut),
          guests: Math.max(1, Number(params.guests) || 1),
        }
      : null;

  const requestKey = request ? JSON.stringify(request) : '';

  const loadQuote = useCallback(async () => {
    if (!requestKey) {
      setLoading(false);
      setLoadError('Faltan datos de la reserva. Vuelve atrás e inténtalo de nuevo.');
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.post<QuoteResponse>('/bookings/quote', JSON.parse(requestKey));
      setQuote(response);
    } catch (err) {
      setQuote(null);
      setLoadError(getErrorMessage(err, 'No pudimos obtener la cotización.'));
    } finally {
      setLoading(false);
    }
  }, [requestKey]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  const handleBook = async () => {
    if (!request) return;
    setBooking(true);
    setBookingError('');
    try {
      const body: CreateBookingBody = { ...request, idempotency_key: idempotencyKey.current };
      const response = await api.post<CreateBookingResponse>('/bookings', body);
      router.replace({ pathname: '/checkout', params: { bookingId: response.booking.id } });
    } catch (err) {
      setBookingError(getErrorMessage(err, 'No pudimos crear la reserva.'));
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <LoadingView />;
  if (!quote) return <ErrorView message={loadError} onRetry={request ? loadQuote : () => router.back()} />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resumen de reserva</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Fecha de entrada</Text>
          <Text style={styles.value}>{formatDate(quote.check_in)}</Text>
          <Text style={styles.label}>Fecha de salida</Text>
          <Text style={styles.value}>{formatDate(quote.check_out)}</Text>
          <Text style={styles.label}>Noches</Text>
          <Text style={styles.value}>{quote.nights}</Text>
          <Text style={styles.label}>Huéspedes</Text>
          <Text style={[styles.value, styles.lastValue]}>{quote.guests}</Text>
        </View>

        <PriceBreakdown
          basePrice={quote.fees.base_amount}
          serviceFee={quote.fees.platform_fee_amount}
          total={quote.fees.total_amount}
          currency={quote.currency}
          nights={quote.nights}
        />

        {!quote.available && (
          <View style={styles.unavailable}>
            <Text style={styles.unavailableText}>
              Estas fechas no están disponibles. Vuelve atrás y elige otro rango.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <ErrorBanner message={bookingError} />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={booking}
            disabled={!quote.available || booking}
            onPress={handleBook}
          >
            Reservar y pagar
          </Button>
          <Button variant="ghost" size="lg" fullWidth onPress={() => router.back()}>
            Cambiar fechas
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.lg },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.soft },
  label: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  value: { fontSize: typography.sizes.body, color: colors.slate, fontWeight: typography.weights.medium, marginBottom: spacing.md },
  lastValue: { marginBottom: 0 },
  unavailable: { backgroundColor: colors.warningSoft, borderRadius: 8, padding: spacing.md, marginTop: spacing.md },
  unavailableText: { fontSize: typography.sizes.caption, color: colors.warning },
  actions: { marginTop: spacing.lg },
});
