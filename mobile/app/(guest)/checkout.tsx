import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { PriceBreakdown } from '@/components/PriceBreakdown';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import * as WebBrowser from 'expo-web-browser';

export default function CheckoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quoteId = (router as any).query?.quoteId;

  const payWithWompi = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<any>('/payments/wompi/checkout', {
        quoteId,
      });

      const { checkoutUrl } = response;
      if (checkoutUrl) {
        const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'wana://');
        if (result.type === 'success') {
          router.replace('/my-bookings');
        } else {
          setError('El pago no se completó.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pago con Wompi</Text>
      </View>

      <View style={styles.content}>
        <PriceBreakdown basePrice={150000} serviceFee={25000} total={175000} nights={4} />
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
        onPress={payWithWompi}
        disabled={loading}
      >
        Pagar con Wompi
      </Button>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>o</Text>
      </View>

      <Button
        variant="ghost"
        size="lg"
        fullWidth
        onPress={() => router.back()}
      >
        Volver
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  content: { padding: spacing.lg },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerText: { fontSize: typography.sizes.caption, color: colors.muted, marginHorizontal: spacing.sm },
  errorBanner: { backgroundColor: colors.errorSoft, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md },
  errorText: { fontSize: typography.sizes.caption, color: colors.error },
});