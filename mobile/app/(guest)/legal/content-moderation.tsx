import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function ContentModerationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Moderación de contenido</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>Última actualización: 19 de noviembre de 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Propósito</Text>
          <Text style={styles.body}>
            Eleveri revisa el contenido publicado en la plataforma (descripciones, fotos, reseñas y
            mensajes) para garantizar que cumpla con nuestros estándares de calidad, seguridad y
            legalidad.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Contenido prohibido</Text>
          <Text style={styles.body}>
            No se permite contenido que promueva discriminación, violencia, actividades ilegales,
            desinformación, spam o material sexual explícito. Los listados deben describir
            fielmente el espacio y sus comodidades.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Revisión y acciones</Text>
          <Text style={styles.body}>
            El contenido reportado o detectado puede ser revisado por nuestro equipo. Las acciones
            posibles incluyen advertencia, edición, eliminación del contenido o suspensión de la
            cuenta, según la gravedad de la infracción.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Apelaciones</Text>
          <Text style={styles.body}>
            Si consideras que tu contenido fue moderado por error, puedes apelar la decisión
            escribiendo a moderacion@elevari.live. Responderemos en un plazo de 5 días hábiles.
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