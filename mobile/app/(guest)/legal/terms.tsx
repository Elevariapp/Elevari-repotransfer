import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Términos y condiciones</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Última actualización: 19 de noviembre de 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceptación</Text>
          <Text style={styles.body}>
            Al usar Eleveri aceptas estos términos. Si no estás de acuerdo, no utilices la
            plataforma. El uso de la plataforma implica la aceptación plena y sin reservas de todas
            las disposiciones incluidas en este documento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Servicio</Text>
          <Text style={styles.body}>
            Eleveri conecta huéspedes con anfitriones de espacios de glamping y refugios. Eleveri no
            es propietario de los alojamientos salvo que se indique expresamente. La plataforma
            funciona como intermediario para facilitar reservas y pagos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Reservas y pagos</Text>
          <Text style={styles.body}>
            El precio total mostrado antes del pago incluye el desglose de tarifas aplicables. El
            pago confirma la solicitud de reserva según la política de cada propiedad. Los reembolsos
            dependen de la cancelación y las políticas publicadas en el espacio. Todos los pagos se
            procesan en pesos colombianos (COP) a través de Wompi.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Tarifa de servicio de Elevari</Text>
          <Text style={styles.body}>
            Eleveri aplica una tarifa de servicio del 15% sobre el precio del alojamiento. Esta
            tarifa se muestra desglosada antes de confirmar el pago y no es reembolsable salvo en
            casos de cancelación por el anfitrión o fuerza mayor.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Anfitriones</Text>
          <Text style={styles.body}>
            Los anfitriones deben proporcionar información veraz, mantener calendarios actualizados y
            cumplir normas locales de turismo y seguridad. Eleveri puede suspender listados que
            incumplan estándares de calidad o legalidad.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Huéspedes</Text>
          <Text style={styles.body}>
            Los huéspedes deben respetar las reglas del espacio, el entorno natural y las comunidades
            locales. Conductas dañinas pueden resultar en cancelación sin reembolso.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitación de responsabilidad</Text>
          <Text style={styles.body}>
            Eleveri facilita la conexión entre partes. No garantizamos disponibilidad continua del
            servicio ni ausencia de errores. La responsabilidad directa de Eleveri se limita al valor
            de la reserva correspondiente cuando la ley lo permita.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cambios a los términos</Text>
          <Text style={styles.body}>
            Podemos actualizar estos términos. Los cambios relevantes se comunicarán en la
            plataforma. El uso continuado implica aceptación de la versión vigente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Ley aplicable</Text>
          <Text style={styles.body}>
            Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se
            resolverá en los tribunales competentes de Colombia.
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