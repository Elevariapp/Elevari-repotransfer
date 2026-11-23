import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { api } from '@/lib/api';

export default function BookingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quoteId = (router as any).query?.quoteId;

  const createBooking = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<any>('/bookings', {
        quoteId,
      });
      router.replace(`/my-bookings`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirmar reserva</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Revisa los detalles antes de pagar</Text>
        <View style={styles.infoCard}>
          <Text style={styles.label}>Propiedad</Text>
          <Text style={styles.value}>Cabaña en el bosque</Text>
          <Text style={styles.label}>Fechas</Text>
          <Text style={styles.value}>1 dic - 5 dic, 2026</Text>
          <Text style={styles.label}>Huéspedes</Text>
          <Text style={styles.value}>2 personas</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        fullWidth
        onPress={createBooking}
        disabled={loading}
      >
        Reservar ahora
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  content: { padding: spacing.lg },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.lg },
  infoCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, ...{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 } },
  label: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  value: { fontSize: typography.sizes.body, color: colors.slate, fontWeight: typography.weights.medium, marginBottom: spacing.md },
  errorBanner: { backgroundColor: colors.errorSoft, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  errorText: { fontSize: typography.sizes.caption, color: colors.error },
});