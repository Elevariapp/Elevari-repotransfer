import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';

export default function HostBookingsScreen() {
  const bookings = [
    { id: '1', guestName: 'María García', property: 'Cabaña en el bosque', checkIn: '1 dic', checkOut: '5 dic', total: 600000, status: 'confirmada' },
    { id: '2', guestName: 'Carlos Ruiz', property: 'Apartamento moderno', checkIn: '10 dic', checkOut: '12 dic', total: 240000, status: 'pendiente' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reservas</Text>
        <Text style={styles.subtitle}>Gestiona las reservas de tus propiedades</Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardGuest}>{item.guestName}</Text>
                <Text style={styles.cardProperty}>{item.property}</Text>
                <Text style={styles.cardDates}>{item.checkIn} → {item.checkOut}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTotal}>
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.total)}
                </Text>
                <Text style={styles.cardStatus}>{item.status}</Text>
              </View>
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
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardGuest: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  cardProperty: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  cardDates: { fontSize: typography.sizes.caption, color: colors.muted },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest, marginBottom: spacing.xs },
  cardStatus: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.slate },
});