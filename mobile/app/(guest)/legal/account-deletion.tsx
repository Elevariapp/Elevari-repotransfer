import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography } from '@/lib/design-tokens';

export default function AccountDeletionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Eliminar mi cuenta</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Esta acción es permanente y no se puede deshacer.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué se eliminará?</Text>
          <Text style={styles.body}>
            Al eliminar tu cuenta se borrarán tu perfil, historial de reservas, listados (si eres
            anfitrión), mensajes y datos personales asociados, salvo los que debamos conservar por
            obligaciones legales o fiscales en Colombia.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Antes de continuar</Text>
          <Text style={styles.body}>
            Asegúrate de no tener reservas pendientes ni pagos pendientes por recibir. Descarga
            cualquier factura o comprobante que necesites antes de eliminar tu cuenta.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo solicitar la eliminación</Text>
          <Text style={styles.body}>
            Si estás seguro, presiona el botón de abajo para confirmar la eliminación de tu cuenta.
            También puedes escribirnos a privacidad@elevari.live para solicitarla por correo
            electrónico.
          </Text>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={() => router.push('/(guest)/legal/account-deletion/confirm')}>
          <Text style={styles.dangerText}>Eliminar mi cuenta permanentemente</Text>
        </TouchableOpacity>
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
  dangerButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  dangerText: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.body,
  },
});