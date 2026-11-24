import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { Screen } from '@/components/Screen';
import { Banner, ErrorState, LoadingState } from '@/components/States';
import { StatusChip } from '@/components/StatusChip';
import { WhatsAppLink } from '@/components/WhatsAppLink';
import { api, getApiErrorMessage, getApiErrorStatus } from '@/lib/api';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES, isPaidBooking, newIdempotencyKey } from '@/lib/booking';
import { toDateOnly } from '@/lib/dates';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { currencyForCountry, formatDateRange, formatMoney, pluralize } from '@/lib/format';
import { firstParam } from '@/lib/routes';
import { WEBSITE_URL, openExternalUrl } from '@/lib/support';
import type {
  Booking,
  BookingPayment,
  BookingResponse,
  CancelBookingResponse,
  PaymentIntentResponse,
  PaymentSyncResponse,
} from '@/lib/types';

const POLL_INTERVAL_MS = 4000;
// About four minutes of waiting before asking the guest to verify manually.
const MAX_POLLS = 60;

type Phase = 'idle' | 'starting' | 'waiting';
type Outcome = 'paid' | 'failed' | 'cancelled' | 'pending';
type Notice = { tone: 'error' | 'success' | 'info'; text: string };

const PAID_TITLES: Partial<Record<Booking['status'], string>> = {
  confirmed: '¡Reserva confirmada!',
  checked_in: 'Estadía en curso',
  completed: 'Estadía completada',
};

// Payments come newest first; the open one is the checkout the guest may still finish.
function findOpenPayment(booking: Booking | null): BookingPayment | undefined {
  return booking?.payments?.find((payment) => payment.status === 'pending' || payment.status === 'processing');
}

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string | string[] }>();
  const bookingId = firstParam(params.bookingId);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const mounted = useRef(true);
  const bookingRef = useRef<Booking | null>(null);
  const trackedPaymentId = useRef<string | null>(null);
  // Reused while an attempt is open so a lost response never opens a second checkout.
  const attemptKey = useRef<string | null>(null);
  const starting = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applyBooking = useCallback((next: Booking) => {
    bookingRef.current = next;
    setBooking(next);
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setLoadError('No encontramos esta reserva.');
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    api
      .get<BookingResponse>(`/bookings/${encodeURIComponent(bookingId)}`)
      .then(({ booking: fresh }) => {
        if (!cancelled) applyBooking(fresh);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getApiErrorMessage(err, 'No pudimos cargar tu reserva.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, applyBooking, reloadKey]);

  // Asks the provider about the payment (the webhook can be slower than the guest), then reloads the booking.
  const checkPayment = useCallback(async (): Promise<Outcome> => {
    if (!bookingId) return 'pending';
    const paymentId = trackedPaymentId.current ?? findOpenPayment(bookingRef.current)?.id ?? null;
    if (paymentId) {
      trackedPaymentId.current = paymentId;
      await api.post<PaymentSyncResponse>(`/payments/${paymentId}/sync`).catch(() => undefined);
    }

    const { booking: fresh } = await api.get<BookingResponse>(`/bookings/${encodeURIComponent(bookingId)}`);
    if (!mounted.current) return 'pending';
    applyBooking(fresh);

    if (isPaidBooking(fresh.status)) return 'paid';
    if (fresh.status === 'cancelled') return 'cancelled';
    const tracked = paymentId ? fresh.payments?.find((payment) => payment.id === paymentId) : undefined;
    if (tracked && (tracked.status === 'failed' || tracked.status === 'cancelled')) return 'failed';
    return 'pending';
  }, [bookingId, applyBooking]);

  const handleOutcome = useCallback((outcome: Outcome) => {
    if (outcome === 'pending') return;
    setPhase('idle');
    if (outcome === 'paid') {
      setNotice({ tone: 'success', text: '¡Pago recibido! Tu reserva quedó confirmada.' });
      if (Platform.OS === 'ios') {
        try {
          WebBrowser.dismissBrowser();
        } catch {
          // The browser may already be closed.
        }
      }
    } else if (outcome === 'failed') {
      trackedPaymentId.current = null;
      attemptKey.current = null;
      setNotice({ tone: 'error', text: 'El pago no se completó. Puedes intentarlo de nuevo.' });
    }
  }, []);

  useEffect(() => {
    if (phase !== 'waiting') return undefined;
    let stopped = false;
    let inFlight = false;
    let attempts = 0;

    const giveUp = () => {
      setPhase('idle');
      setNotice({
        tone: 'info',
        text: 'Todavía no recibimos la confirmación de tu pago. Si ya pagaste, toca «Ya pagué, verificar» en unos minutos.',
      });
    };

    const tick = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      attempts += 1;
      try {
        const outcome = await checkPayment();
        if (stopped) return;
        if (outcome !== 'pending') handleOutcome(outcome);
        else if (attempts >= MAX_POLLS) giveUp();
      } catch {
        // A dropped connection must not end the wait; the next tick tries again.
        if (!stopped && attempts >= MAX_POLLS) giveUp();
      } finally {
        inFlight = false;
      }
    };

    const timer = setInterval(() => void tick(), POLL_INTERVAL_MS);
    // Coming back from the payment page: check right away instead of waiting for the next tick.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void tick();
    });
    return () => {
      stopped = true;
      clearInterval(timer);
      subscription.remove();
    };
  }, [phase, checkPayment, handleOutcome]);

  const openCheckout = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.forest,
        showTitle: true,
        createTask: false,
      });
    } catch {
      await openExternalUrl(url, 'No pudimos abrir la página de pago. Inténtalo de nuevo.');
    }
  }, []);

  const startPayment = useCallback(async () => {
    const current = bookingRef.current;
    if (!current || starting.current) return;
    starting.current = true;
    setPhase('starting');
    setNotice(null);

    try {
      const openPayment = findOpenPayment(current);
      const key = openPayment?.idempotencyKey ?? attemptKey.current ?? newIdempotencyKey(`pay_${current.id}`);
      attemptKey.current = key;

      const intent = await api.post<PaymentIntentResponse>('/payments/intent', {
        booking_id: current.id,
        idempotency_key: key,
        return_url: `${WEBSITE_URL}/checkout/${current.id}/success`,
        // Charges are always made in COP; other display currencies require a legal disclosure flow.
        display_currency: 'COP',
      });

      const paymentId = intent.payment_id ?? intent.payment?.id ?? null;
      trackedPaymentId.current = paymentId;

      if (intent.already_paid) {
        handleOutcome(await checkPayment());
        setPhase('idle');
        return;
      }

      if (intent.mode === 'mock') {
        if (!paymentId) throw new Error('missing_payment_id');
        await api.post(`/payments/${paymentId}/mock-complete`);
        const outcome = await checkPayment();
        setPhase('idle');
        handleOutcome(outcome);
        return;
      }

      if (!intent.checkout_url) {
        setPhase('idle');
        setNotice({ tone: 'error', text: 'No pudimos abrir la página de pago. Inténtalo de nuevo.' });
        return;
      }

      setPhase('waiting');
      await openCheckout(intent.checkout_url);
    } catch (err) {
      // After a server answer the old key may point at a dead payment; a lost response keeps it for the retry.
      if (getApiErrorStatus(err) !== undefined) attemptKey.current = null;
      setPhase('idle');
      setNotice({ tone: 'error', text: getApiErrorMessage(err, 'No pudimos iniciar el pago. Inténtalo de nuevo.') });
    } finally {
      starting.current = false;
    }
  }, [checkPayment, handleOutcome, openCheckout]);

  const verifyNow = useCallback(async () => {
    setVerifying(true);
    setNotice(null);
    try {
      const outcome = await checkPayment();
      if (outcome === 'pending') {
        setNotice({ tone: 'info', text: 'Todavía no vemos el pago. Si ya pagaste, puede tardar unos minutos.' });
      } else {
        handleOutcome(outcome);
      }
    } catch (err) {
      setNotice({ tone: 'error', text: getApiErrorMessage(err, 'No pudimos verificar tu pago. Inténtalo de nuevo.') });
    } finally {
      if (mounted.current) setVerifying(false);
    }
  }, [checkPayment, handleOutcome]);

  const cancelBooking = useCallback(async () => {
    const current = bookingRef.current;
    if (!current || cancelling) return;
    setCancelling(true);
    setNotice(null);
    try {
      const result = await api.post<CancelBookingResponse>(`/bookings/${encodeURIComponent(current.id)}/cancel`);
      if (!mounted.current) return;
      applyBooking({ ...current, status: result.booking.status });
      const refund = result.cancellation.refund_eligible && result.cancellation.refund_amount > 0
        ? ` Se reembolsarán ${formatMoney(result.cancellation.refund_amount, currencyForCountry(current.property?.country))}.`
        : '';
      Alert.alert('Reserva cancelada', `${result.cancellation.reason}${refund}`);
    } catch (err) {
      setNotice({ tone: 'error', text: getApiErrorMessage(err, 'No pudimos cancelar la reserva. Inténtalo de nuevo.') });
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }, [applyBooking, cancelling]);

  const confirmCancel = () => {
    if (!booking) return;
    const message =
      booking.status === 'confirmed'
        ? 'Se aplicará la política de reembolso a tu pago. Esta acción no se puede deshacer.'
        : 'Se liberarán las fechas y no se te cobrará nada. Esta acción no se puede deshacer.';
    Alert.alert('¿Cancelar esta reserva?', message, [
      { text: 'Conservar', style: 'cancel' },
      { text: 'Cancelar reserva', style: 'destructive', onPress: () => void cancelBooking() },
    ]);
  };

  if (loading || !booking) {
    return (
      <Screen title="Tu reserva" back backHref="/(guest)/my-bookings">
        {loading ? (
          <LoadingState label="Cargando tu reserva…" />
        ) : (
          <ErrorState message={loadError || 'No pudimos cargar tu reserva.'} onRetry={() => setReloadKey((key) => key + 1)} />
        )}
      </Screen>
    );
  }

  const property = booking.property;
  const currency = currencyForCountry(property?.country);
  const fees = booking.feesBreakdown;
  const checkIn = toDateOnly(booking.checkIn);
  const checkOut = toDateOnly(booking.checkOut);
  const paid = isPaidBooking(booking.status);
  const payable = booking.status === 'pending_payment';
  const openPayment = findOpenPayment(booking);
  const busy = phase !== 'idle' || verifying || cancelling;
  const total = fees ? Number(fees.total_charge_to_guest) : null;

  let footer: ReactNode = null;
  if (paid) {
    footer = (
      <View style={styles.actions}>
        <Button size="lg" fullWidth onPress={() => router.replace('/(guest)/my-bookings')}>
          Ver mis reservas
        </Button>
        <Button variant="ghost" fullWidth onPress={() => router.replace('/(guest)')}>
          Explorar más propiedades
        </Button>
      </View>
    );
  } else if (payable) {
    footer = (
      <View style={styles.actions}>
        {phase === 'waiting' ? (
          <>
            <Button size="lg" fullWidth variant="secondary" loading={verifying} onPress={verifyNow}>
              Ya pagué, verificar
            </Button>
            <Button variant="ghost" fullWidth onPress={startPayment}>
              Abrir el pago de nuevo
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" fullWidth loading={phase === 'starting'} disabled={busy} onPress={startPayment}>
              {openPayment
                ? 'Continuar con el pago'
                : total !== null && total > 0
                  ? `Pagar ${formatMoney(total, currency)}`
                  : 'Pagar con Wompi'}
            </Button>
            {openPayment ? (
              <Button variant="secondary" fullWidth loading={verifying} disabled={busy} onPress={verifyNow}>
                Ya pagué, verificar
              </Button>
            ) : null}
          </>
        )}
      </View>
    );
  }

  const canCancel = (payable || booking.status === 'confirmed') && phase === 'idle';

  return (
    <Screen title={paid ? 'Tu reserva' : 'Pago'} back backHref="/(guest)/my-bookings" footer={footer}>
      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}

      {paid ? (
        <Card padded style={styles.heroCard}>
          <Text style={styles.heroTitle}>{PAID_TITLES[booking.status] ?? 'Reserva confirmada'}</Text>
          <Text style={styles.heroText}>
            Te enviamos los detalles por correo. Puedes consultar tu reserva cuando quieras en «Mis reservas».
          </Text>
        </Card>
      ) : null}

      {phase === 'waiting' ? (
        <View style={styles.waiting} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.forest} />
          <Text style={styles.waitingText}>
            Esperando la confirmación de tu pago. Completa el pago en la página de Wompi y vuelve a la app.
          </Text>
        </View>
      ) : null}

      {!paid && payable && phase === 'idle' && openPayment && !notice ? (
        <Banner tone="info">
          Tienes un pago en proceso para esta reserva. Si ya pagaste, toca «Ya pagué, verificar»; si no, continúa con el pago.
        </Banner>
      ) : null}

      {booking.status === 'cancelled' ? (
        <Banner tone="error">
          Esta reserva está cancelada. Si tienes dudas sobre un cobro o reembolso, escríbenos por WhatsApp.
        </Banner>
      ) : null}

      {booking.status === 'draft' ? (
        <Banner tone="info">Esta reserva todavía no está lista para pagar.</Banner>
      ) : null}

      <Card padded style={styles.card}>
        <View style={styles.statusRow}>
          <Text style={styles.propertyTitle} numberOfLines={2}>
            {property?.title ?? 'Tu reserva'}
          </Text>
          <StatusChip label={BOOKING_STATUS_LABELS[booking.status]} tone={BOOKING_STATUS_TONES[booking.status]} />
        </View>
        {property?.city ? <Text style={styles.meta}>{property.city}</Text> : null}
        <Text style={styles.label}>Fechas</Text>
        <Text style={styles.value}>
          {fees ? `${formatDateRange(checkIn, checkOut)} · ${pluralize(fees.nights, 'noche', 'noches')}` : formatDateRange(checkIn, checkOut)}
        </Text>
        <Text style={styles.label}>Huéspedes</Text>
        <Text style={[styles.value, styles.lastValue]}>{pluralize(booking.guests, 'persona', 'personas')}</Text>
      </Card>

      {fees ? (
        <View style={styles.breakdown}>
          <PriceBreakdown
            basePrice={Number(fees.base_amount)}
            serviceFee={Number(fees.platform_fee_amount)}
            total={Number(fees.total_charge_to_guest)}
            currency={currency}
            nights={fees.nights}
            pricePerNight={fees.price_per_night}
          />
        </View>
      ) : null}

      {payable && phase !== 'waiting' ? (
        <Text style={styles.note}>
          Pagarás de forma segura en la página de Wompi. Si no completas el pago, las fechas se liberan automáticamente.
        </Text>
      ) : null}

      <View style={styles.links}>
        <Text style={styles.link} accessibilityRole="link" onPress={() => router.push('/(guest)/legal/refund')}>
          Política de reembolso
        </Text>
        <WhatsAppLink
          size="sm"
          label="Ayuda por WhatsApp"
          message={`Hola, necesito ayuda con mi reserva ${booking.id}.`}
          style={styles.whatsappLink}
        />
        {canCancel ? (
          <Text
            style={[styles.link, styles.dangerLink]}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            onPress={busy ? undefined : confirmCancel}
          >
            Cancelar reserva
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  card: { marginBottom: spacing.md },
  heroCard: { marginBottom: spacing.md, backgroundColor: colors.freshSoft },
  heroTitle: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.forest, marginBottom: spacing.xs },
  heroText: { fontSize: typography.sizes.caption, color: colors.slate, lineHeight: 19 },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  waitingText: { flex: 1, fontSize: typography.sizes.caption, color: colors.slate, lineHeight: 19 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  propertyTitle: { flex: 1, fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.ink },
  meta: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.md },
  label: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xs },
  value: { fontSize: typography.sizes.body, color: colors.slate, fontWeight: typography.weights.medium },
  lastValue: { marginBottom: 0 },
  breakdown: { marginBottom: spacing.md },
  note: { fontSize: typography.sizes.caption, color: colors.muted, lineHeight: 19, marginBottom: spacing.md },
  links: { gap: spacing.md, marginTop: spacing.sm },
  link: { fontSize: typography.sizes.caption, color: colors.forest, fontWeight: typography.weights.semibold },
  // The 44pt touch row would widen the gaps of this list, so it borrows the extra height from its margins.
  whatsappLink: { marginVertical: -13 },
  dangerLink: { color: colors.error },
});