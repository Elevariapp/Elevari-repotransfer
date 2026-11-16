import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { api } from '@/lib/api';

export default function QuoteScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState('');

  const propertyId = router.getQueryParams()?.propertyId as string;

  const createQuote = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<any>('/bookings/quote', {
        propertyId,
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        guests: 2,
      });
      setQuote(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener la cotización.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumen de reserva</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.forest} />
        </View>
      ) : quote ? (
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Fecha de entrada</Text>
            <Text style={styles.value}>{quote.checkIn}</Text>
            <Text style={styles.label}>Fecha de salida</Text>
            <Text style={styles.value}>{quote.checkOut}</Text>
            <Text style={styles.label}>Noches</Text>
            <Text style={styles.value}>{quote.nights}</Text>
            <Text style={styles.label}>Huéspedes</Text>
            <Text style={styles.value}>{quote.guests}</Text>
          </View>

          <PriceBreakdown
            basePrice={quote.basePrice}
            serviceFee={quote.serviceFee}
            total={quote.total}
            currency={quote.currency}
            nights={quote.nights}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push(`/checkout?quoteId=${quote.propertyId}`)}
          >
            Continuar al pago
          </Button>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button variant="ghost" size="md" onPress={createQuote}>Reintentar</Button>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Button variant="primary" size="lg" fullWidth onPress={createQuote}>
            Obtener cotización
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  content: { padding: spacing.lg },
  infoCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg, ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 } },
  label: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  value: { fontSize: typography.sizes.body, color: colors.slate, fontWeight: typography.weights.medium, marginBottom: spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorText: { fontSize: typography.sizes.body, color: colors.error, marginBottom: spacing.md },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
});