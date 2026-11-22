import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function RefundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Política de reembolso</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Última actualización: 19 de noviembre de 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Reembolsos por cancelación del huésped</Text>
          <Text style={styles.body}>
            Las cancelaciones realizadas antes de la fecha de entrada pueden ser elegibles para
            reembolso total o parcial según la política de cancelación publicada en cada espacio.
            Revisa los términos antes de confirmar tu reserva.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Reembolsos por cancelación del anfitrión</Text>
          <Text style={styles.body}>
            Si el anfitrión cancela tu reserva, recibirás un reembolso completo del monto pagado,
            incluida la tarifa de servicio de Eleveri.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Tarifa de servicio</Text>
          <Text style={styles.body}>
            La tarifa de servicio del 15% no es reembolsable salvo que la cancelación sea por parte
            del anfitrión o por fuerza mayor.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Tiempo de procesamiento</Text>
          <Text style={styles.body}>
            Los reembolsos aprobados se procesan a través de Wompi y pueden tardar entre 5 y 10 días
            hábiles en reflejarse en tu método de pago original, según la entidad financiera.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Solicitar un reembolso</Text>
          <Text style={styles.body}>
            Para solicitar un reembolso, contacta a reserve@elevari.live con los detalles de tu
            reserva y el motivo de la solicitud.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  backButton: { padding: spacing.sm },
  backText: { fontSize: typography.sizes.body, color: colors.muted },
  title: {
    flex: 1,
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: {
    fontSize: typography.sizes.caption,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.slate,
    lineHeight: 22,
  },
});