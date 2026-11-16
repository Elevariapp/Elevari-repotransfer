import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { Property } from '@/types';

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { params } = router;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = String(params.id);
    api.get<Property>(`/properties/${id}`)
      .then(setProperty)
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.forest} style={styles.loading} />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Propiedad no encontrada</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: property.images[0] || '' }} style={styles.heroImage} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.location}>📍 {property.location}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>{property.rating} ★ ({property.reviewCount} reseñas)</Text>
        </View>
        <Text style={styles.description}>{property.description}</Text>
        <View style={styles.amenities}>
          <Text style={styles.amenitiesTitle}>Comodidades</Text>
          <FlatList
            data={property.amenities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.amenityChip}>
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.amenitiesList}
          />
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Precio por noche</Text>
          <Text style={styles.priceValue}>
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(property.pricePerNight)}
          </Text>
        </View>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push(`/quote?propertyId=${property.id}`)}
        >
          Ver disponibilidad y reservar
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  heroImage: { width: '100%', height: 300 },
  content: { padding: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm },
  location: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.md },
  ratingRow: { marginBottom: spacing.md },
  rating: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.forest },
  description: { fontSize: typography.sizes.body, color: colors.slate, lineHeight: 24, marginBottom: spacing.lg },
  amenities: { marginBottom: spacing.lg },
  amenitiesTitle: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.muted, marginBottom: spacing.sm },
  amenitiesList: { gap: spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.freshSoft, borderRadius: radius.full },
  amenityText: { fontSize: typography.sizes.caption, color: colors.forest },
  priceSection: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  priceLabel: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  priceValue: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.forest },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center', color: colors.error },
});