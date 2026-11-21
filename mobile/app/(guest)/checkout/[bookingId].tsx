import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/Button';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { ErrorBanner, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { CONTACT_EMAIL } from '@/lib/config';
import { getErrorMessage } from '@/lib/errors';
import { formatDateRange } from '@/lib/format';
import { paymentReturnUrl, startPayment, waitForPayment } from '@/lib/payments';
import type { BookingDetailResponse, BookingRecord, PaymentsByBookingResponse } from '@/types';

type Phase = 'review' | 'verifying' | 'success' | 'failed' | 'unconfirmed' | 'cancelled';

export default function CheckoutScreen() {
  const router = useRouter();
  const { bookingId, resume } = useLocalSearchParams<{ bookingId: string; resume?: string }>();
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [phase, setPhase] = useState<Phase>('review');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [refundRequired, setRefundRequired] = useState(false);
  const paymentIdRef = useRef<string | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const verify = useCallback(async (paymentId: string, attempts = 10) => {
    setPhase('verifying');
    setError('');
    const result = await waitForPayment(paymentId, { attempts, isCancelled: () => unmounted.current });
    if (unmounted.current) return;
    if (result?.status === 'succeeded') {
      setRefundRequired(!!result.refund_required);
      setPhase('success');
    } else if (result && ['failed', 'cancelled'].includes(result.status)) {
      setPhase('failed');
    } else {
      setPhase('unconfirmed');
    }
  }, []);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setLoadError('');
    try {
      const { booking: data } = await api.get<BookingDetailResponse>(`/bookings/${bookingId}`);
      setBooking(data);
      if (data.status === 'confirmed' || data.status === 'checked_in' || data.status === 'completed') {
        setPhase('success');
      } else if (data.status === 'cancelled') {
        setPhase('cancelled');
      } else {
        // Pick up a payment that was started earlier (e.g. the app was closed at Wompi).
        const { payments } = await api.get<PaymentsByBookingResponse>(`/payments/by-booking/${bookingId}`);
        const active = payments.find((p) => p.status === 'pending' || p.status === 'processing');
        if (active) {
          paymentIdRef.current = active.id;
          verify(active.id, resume ? 10 : 1);
        } else {
          setPhase('review');
        }
      }
    } catch (err) {
      setLoadError(getErrorMessage(err, 'No pudimos cargar tu reserva.'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, resume, verify]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async () => {
    if (!bookingId) return;
    setPaying(true);
    setError('');
    try {
      const start = await startPayment(bookingId);
      if (start.alreadyPaid) {
        await load();
        return;
      }
      paymentIdRef.current = start.paymentId;
      // Resolves when the user comes back from Wompi (deep link or closing the browser).
      await WebBrowser.openAuthSessionAsync(start.checkoutUrl!, paymentReturnUrl(bookingId));
      if (paymentIdRef.current) await verify(paymentIdRef.current);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al procesar el pago.'));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingView />;
  if (!booking) return <ErrorView message={loadError || 'No encontramos esta reserva.'} onRetry={load} />;

  const fees = booking.feesBreakdown;

  if (phase === 'verifying') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text style={styles.statusTitle}>Confirmando tu pago…</Text>
        <Text style={styles.statusBody}>Esto puede tardar unos segundos. No cierres la app.</Text>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={styles.center}>
        <Text style={styles.statusIcon}>✓</Text>
        <Text style={styles.statusTitle}>
          {refundRequired ? 'Pago recibido' : '¡Reserva confirmada!'}
        </Text>
        <Text style={styles.statusBody}>
          {refundRequired
            ? `Recibimos tu pago, pero no pudimos confirmar la reserva porque las fechas ya no están disponibles. Escríbenos a ${CONTACT_EMAIL} para gestionar tu reembolso.`
            : 'Recibimos tu pago. Te enviaremos los detalles por correo.'}
        </Text>
        <Button variant="primary" size="lg" fullWidth onPress={() => router.replace('/my-bookings')}>
          Ver mis reservas
        </Button>
      </View>
    );
  }

  if (phase === 'cancelled') {
    return (
      <View style={styles.center}>
        <Text style={styles.statusTitle}>Reserva cancelada</Text>
        <Text style={styles.statusBody}>Esta reserva ya no se puede pagar.</Text>
        <Button variant="primary" size="lg" fullWidth onPress={() => router.replace('/')}>
          Explorar propiedades
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pago con Wompi</Text>

        {booking.property && (
          <View style={styles.infoCard}>
            <Text style={styles.propertyTitle}>{booking.property.title}</Text>
            <Text style={styles.infoText}>
              {formatDateRange(booking.checkIn, booking.checkOut)} · {booking.guests}{' '}
              {booking.guests === 1 ? 'huésped' : 'huéspedes'}
            </Text>
          </View>
        )}

        {fees && (
          <PriceBreakdown
            basePrice={fees.base_amount}
            serviceFee={fees.platform_fee_amount}
            total={fees.total_amount}
            currency="COP"
            nights={fees.nights}
          />
        )}

        {phase === 'failed' && (
          <ErrorBanner message="El pago no fue aprobado. Puedes intentarlo de nuevo con otro medio de pago." />
        )}
        {phase === 'unconfirmed' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Aún no recibimos la confirmación de tu pago. Si ya pagaste, espera un momento y verifica de nuevo;
              tu reserva se confirmará automáticamente.
            </Text>
          </View>
        )}
        <ErrorBanner message={error} />

        <View style={styles.actions}>
          {phase === 'unconfirmed' && paymentIdRef.current && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => verify(paymentIdRef.current!, 3)}
            >
              Verificar pago
            </Button>
          )}
          <Button variant="primary" size="lg" fullWidth loading={paying} disabled={paying} onPress={handlePay}>
            {phase === 'failed' ? 'Intentar de nuevo' : 'Pagar con Wompi'}
          </Button>
          <Button variant="ghost" size="lg" fullWidth onPress={() => router.replace('/my-bookings')}>
            Pagar más tarde
          </Button>
        </View>
        <Text style={styles.footnote}>
          Pagos seguros con Wompi: tarjetas, PSE, Nequi y Bancolombia. Los pagos se procesan en pesos colombianos (COP).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.ivory },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.lg },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.soft },
  propertyTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  infoText: { fontSize: typography.sizes.caption, color: colors.muted },
  notice: { backgroundColor: colors.warningSoft, borderRadius: 8, padding: spacing.md, marginTop: spacing.md },
  noticeText: { fontSize: typography.sizes.caption, color: colors.warning },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  footnote: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.lg, textAlign: 'center' },
  statusIcon: { fontSize: 48, color: colors.forest, marginBottom: spacing.md },
  statusTitle: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.sm, textAlign: 'center' },
  statusBody: { fontSize: typography.sizes.body, color: colors.muted, textAlign: 'center', marginBottom: spacing.lg },
});
