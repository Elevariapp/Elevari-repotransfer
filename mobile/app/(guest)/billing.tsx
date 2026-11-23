import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { StatusChip } from '@/components/StatusChip';
import { fetchBilling, INVOICE_STATUS_LABELS, INVOICE_STATUS_TONES } from '@/lib/billing';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { formatDate, formatMoney } from '@/lib/format';
import type { BillingInvoice } from '@/lib/types';
import { useScreenResource } from '@/lib/use-resource';

function InvoiceRow({ invoice, onPress }: { invoice: BillingInvoice; onPress: () => void }) {
  const title = invoice.property_title ?? 'Reserva en Elevari';
  const label = INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status;
  // `total` and `invoice_number` can be null: show a fallback instead of formatting them.
  const total = typeof invoice.total === 'number' ? formatMoney(invoice.total, invoice.currency) : null;
  const number = invoice.invoice_number
    ? `Factura ${invoice.invoice_number}`
    : invoice.status === 'issued'
      ? 'Factura electrónica'
      : 'Factura en proceso';
  const date = formatDate(invoice.created_at);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[number, title, total, label, date].filter(Boolean).join(', ')}
      accessibilityHint="Abre el detalle de la reserva"
    >
      <Card padded style={styles.card}>
        <View style={styles.top}>
          <Text style={styles.number}>{number}</Text>
          <StatusChip label={label} tone={INVOICE_STATUS_TONES[invoice.status] ?? 'neutral'} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.bottom}>
          {total ? <Text style={styles.total}>{total}</Text> : <View />}
          <Text style={styles.meta}>{date}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function BillingScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useScreenResource(
    fetchBilling,
    'No pudimos cargar tus facturas.',
  );
  const invoices = data?.invoices ?? [];

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Cargando tus facturas…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={reload} />;
  } else {
    emptyState = (
      <EmptyState
        title="Aún no tienes facturas"
        message="Emitimos una factura por cada reserva pagada. La verás aquí y te llegará a tu correo."
      />
    );
  }

  return (
    <Screen title="Facturación" back backHref="/(guest)/profile" scroll={false}>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InvoiceRow
            invoice={item}
            onPress={() => router.push(`/(guest)/checkout?bookingId=${encodeURIComponent(item.booking_id)}`)}
          />
        )}
        ListHeaderComponent={error && invoices.length > 0 ? <Banner tone="error">{error}</Banner> : undefined}
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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  number: { flex: 1, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  title: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  total: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  meta: { fontSize: typography.sizes.caption, color: colors.muted },
});
