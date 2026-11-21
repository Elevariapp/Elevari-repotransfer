import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function ContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Información de contacto</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Última actualización: 19 de noviembre de 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Canales de contacto</Text>
          <Text style={styles.body}>
            Para soporte, reservas, privacidad y protección de datos, moderación de contenido,
            anfitriones y accesibilidad escríbenos a reserve@elevari.live.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Datos del responsable</Text>
          <Text style={styles.body}>
            Elevari opera la plataforma de reservas de experiencias de glamping y refugios en
            Colombia. Correo de contacto: reserve@elevari.live. Sede: Colombia.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Enlaces relacionados</Text>
          <Text style={styles.body}>
            Términos y condiciones, Política de privacidad, Política de reembolso, Eliminar mi
            cuenta, Moderación de contenido y Accesibilidad están disponibles en la sección Legal de
            la aplicación.
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