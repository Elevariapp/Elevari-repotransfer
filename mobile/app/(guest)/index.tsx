import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { Property } from '@/types';

export default function GuestIndexScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Property[]>('/properties')
      .then(setProperties)
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.forest} style={styles.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.subtitle}>Descubre escapes excepcionales</Text>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/property/${item.id}`)}>
            <Image
              source={{ uri: item.images[0] || '' }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardLocation}>📍 {item.location}</Text>
              <Text style={styles.cardPrice}>
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.pricePerNight)} / noche
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.card },
  image: { width: '100%', height: 200 },
  cardContent: { padding: spacing.md },
  cardTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  cardLocation: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.sm },
  cardPrice: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});