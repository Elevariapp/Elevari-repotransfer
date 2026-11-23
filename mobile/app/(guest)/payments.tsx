import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { StatusChip } from '@/components/StatusChip';
import { fetchBilling, providerLabel } from '@/lib/billing';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '@/lib/booking';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { formatDate, formatMoney } from '@/lib/format';
import type { BillingPayment } from '@/lib/types';
import { useScreenResource } from '@/lib/use-resource';

function PaymentRow({ payment, onPress }: { payment: BillingPayment; onPress: () => void }) {
  const title = payment.property_title ?? 'Reserva en Elevari';
  const label = PAYMENT_STATUS_LABELS[payment.status] ?? payment.status;
  const amount = formatMoney(payment.amount, payment.currency);
  const date = formatDate(payment.created_at);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${amount}, ${label}, ${date}`}
      accessibilityHint="Abre el detalle de la reserva"
    >
      <Card padded style={styles.card}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <StatusChip label={label} tone={PAYMENT_STATUS_TONES[payment.status] ?? 'neutral'} />
        </View>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.meta}>{`${date} · ${providerLabel(payment.provider)}`}</Text>
        {payment.refunded_amount > 0 ? (
          <Text style={styles.refund}>{`Reembolsado: ${formatMoney(payment.refunded_amount, payment.currency)}`}</Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useScreenResource(
    fetchBilling,
    'No pudimos cargar tus pagos.',
  );
  const payments = data?.payments ?? [];

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Cargando tus pagos…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={reload} />;
  } else {
    emptyState = (
      <EmptyState
        title="Aún no tienes pagos"
        message="Cuando pagues una reserva, verás aquí el historial."
        actionLabel="Explorar propiedades"
        onAction={() => router.replace('/(guest)')}
      />
    );
  }

  return (
    <Screen title="Pagos" back backHref="/(guest)/profile" scroll={false}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaymentRow
            payment={item}
            onPress={() => router.push(`/(guest)/checkout?bookingId=${encodeURIComponent(item.booking_id)}`)}
          />
        )}
        ListHeaderComponent={error && payments.length > 0 ? <Banner tone="error">{error}</Banner> : undefined}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  card: { marginBottom: spacing.md },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  amount: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.forest,
    marginTop: spacing.sm,
  },
  meta: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs },
  refund: { fontSize: typography.sizes.caption, color: colors.slate, marginTop: spacing.xs },
});
