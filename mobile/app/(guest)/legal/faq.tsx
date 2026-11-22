import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function FAQScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Preguntas frecuentes</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Última actualización: 19 de noviembre de 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ¿Cómo hago una reserva?</Text>
          <Text style={styles.body}>
            Elige un espacio, selecciona las fechas y confirma el pago a través de Wompi. Recibirás
            una confirmación por correo electrónico.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. ¿Cómo funciona el reembolso?</Text>
          <Text style={styles.body}>
            Consulta nuestra Política de reembolso. Los tiempos de procesamiento varían entre 5 y 10
            días hábiles según la entidad financiera.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ¿Cómo elimino mi cuenta?</Text>
          <Text style={styles.body}>
            Ve a Perfil > Eliminar mi cuenta. La acción es permanente y no se puede deshacer.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. ¿Cómo contacto con soporte?</Text>
          <Text style={styles.body}>
            Escríbenos a soporte@eleveri.app. También puedes usar la sección Contacto en la app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. ¿Soy anfitrión, cómo publico mi espacio?</Text>
          <Text style={styles.body}>
            Regístrate como anfitrión, completa los datos de tu propiedad y súbela para revisión.
            Nuestro equipo la aprobará en pocos días.
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