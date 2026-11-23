import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { formatMoney, pluralize } from '@/lib/format';

interface PriceBreakdownProps {
  basePrice: number;
  serviceFee: number;
  total: number;
  currency?: string;
  nights?: number;
  pricePerNight?: number;
}

export function PriceBreakdown({
  basePrice,
  serviceFee,
  total,
  currency = 'COP',
  nights,
  pricePerNight,
}: PriceBreakdownProps) {
  const baseLabel =
    nights && pricePerNight
      ? `${formatMoney(pricePerNight, currency)} × ${pluralize(nights, 'noche', 'noches')}`
      : 'Precio base';

  return (
    <View style={styles.container} accessible accessibilityLabel={`Total a pagar ${formatMoney(total, currency)}`}>
      <View style={styles.row}>
        <Text style={styles.label}>{baseLabel}</Text>
        <Text style={styles.value}>{formatMoney(basePrice, currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tarifa de servicio Elevari</Text>
        <Text style={styles.value}>{formatMoney(serviceFee, currency)}</Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatMoney(total, currency)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.ivory,
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
  },
  value: {
    fontSize: typography.sizes.body,
    color: colors.slate,
    fontWeight: typography.weights.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  totalValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.forest,
  },
});