import { useRouter } from 'expo-router';
import { Alert, Linking, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { CONTACT_EMAIL } from '@/lib/config';

export default function AccountDeletionConfirmScreen() {
  const router = useRouter();

  const handleRequest = async () => {
    const subject = encodeURIComponent('Solicitud de eliminación de cuenta');
    const body = encodeURIComponent('Solicito la eliminación de mi cuenta de Elevari.');
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('No se pudo abrir el correo', `Escríbenos a ${CONTACT_EMAIL} para solicitar la eliminación.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Solicitar eliminación</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Esta acción es permanente. No podrás recuperar tu cuenta ni tus datos.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué ocurrirá?</Text>
          <Text style={styles.body}>
            Tu perfil, reservas, listados y datos personales se eliminarán de forma permanente.
            Algunos datos podrán conservarse de forma anonimizada o por obligaciones legales y
            fiscales en Colombia.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enviar solicitud</Text>
          <Text style={styles.body}>
            Si estás seguro, abriremos tu aplicación de correo con la solicitud lista para enviar a
            reserve@elevari.live. Tu cuenta no se elimina hasta que nuestro equipo la procese.
          </Text>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleRequest}>
          <Text style={styles.dangerText}>Enviar solicitud por correo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
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
    color: colors.surface,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.body,
  },
  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelText: {
    color: colors.muted,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.body,
  },
});