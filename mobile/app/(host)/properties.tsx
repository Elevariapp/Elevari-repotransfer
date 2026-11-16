import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';

export default function HostPropertiesScreen() {
  const properties = [
    { id: '1', title: 'Cabaña en el bosque', location: 'Guatapé, Colombia', price: 150000, image: '' },
    { id: '2', title: 'Apartamento moderno', location: 'Medellín, Colombia', price: 120000, image: '' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis propiedades</Text>
        <Text style={styles.subtitle}>Gestiona tus anuncios activos</Text>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardLocation}>📍 {item.location}</Text>
              <Text style={styles.cardPrice}>
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price)} / noche
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginTop: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.lg, ...shadows.card, padding: spacing.md },
  cardContent: { gap: spacing.sm },
  cardTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  cardLocation: { fontSize: typography.sizes.caption, color: colors.muted },
  cardPrice: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
});