import { useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';

export default function HostIndexScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Panel de anfitrión</Text>
      <Text style={styles.subtitle}>Gestiona tus propiedades</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/host/properties')} accessibilityRole="button">
        <Text style={styles.cardTitle}>Mis propiedades</Text>
        <Text style={styles.cardText}>Consulta el estado de tus anuncios.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/host/property/new')} accessibilityRole="button">
        <Text style={styles.cardTitle}>Nueva propiedad</Text>
        <Text style={styles.cardText}>Crea un anuncio en borrador.</Text>
      </TouchableOpacity>

      <View style={[styles.card, styles.cardDisabled]} accessibilityState={{ disabled: true }}>
        <Text style={styles.cardTitle}>Reservas recibidas</Text>
        <Text style={styles.cardText}>Disponible pronto</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.soft },
  cardDisabled: { opacity: 0.6 },
  cardTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  cardText: { fontSize: typography.sizes.caption, color: colors.muted },
});
