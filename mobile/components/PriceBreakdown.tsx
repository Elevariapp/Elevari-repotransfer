import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/lib/design-tokens';

interface PriceBreakdownProps {
  basePrice: number;
  serviceFee: number;
  total: number;
  currency?: string;
  nights?: number;
}

export function PriceBreakdown({ basePrice, serviceFee, total, currency = 'COP', nights }: PriceBreakdownProps) {
  const formatPrice = (amount: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Precio base</Text>
        <Text style={styles.value}>{formatPrice(basePrice)}</Text>
      </View>
      {nights !== undefined && (
        <View style={styles.row}>
          <Text style={styles.label}>Tarifa de servicio Elevari</Text>
          <Text style={styles.value}>{formatPrice(serviceFee)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
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