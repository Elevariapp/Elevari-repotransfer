import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorBanner, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography, radius } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';
import { formatCop, isValidIsoDate, maskIsoDateInput, toAmenityList, todayIso } from '@/lib/format';
import type { Property } from '@/types';

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.get<Property>(`/properties/${encodeURIComponent(String(slug))}`);
      setProperty(data);
    } catch (err) {
      setProperty(null);
      setLoadError(
        getErrorStatus(err) === 404 ? 'No encontramos esta propiedad.' : getErrorMessage(err, 'No pudimos cargar la propiedad.')
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingView />;
  if (!property) return <ErrorView message={loadError || 'No encontramos esta propiedad.'} onRetry={load} />;

  const images = property.media.filter((m) => m.type === 'image');
  const heroUri = property.cover_image ?? images[0]?.url ?? null;
  const amenities = toAmenityList(property.amenities);

  const handleContinue = () => {
    if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut)) {
      setFormError('Ingresa las fechas con el formato AAAA-MM-DD.');
      return;
    }
    if (checkIn < todayIso()) {
      setFormError('La fecha de entrada no puede ser anterior a hoy.');
      return;
    }
    if (checkOut <= checkIn) {
      setFormError('La fecha de salida debe ser al menos un día después de la entrada.');
      return;
    }
    setFormError('');
    router.push({
      pathname: '/quote',
      params: { propertyId: property.id, slug: property.slug, checkIn, checkOut, guests: String(guests) },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {heroUri ? (
          <Image source={{ uri: heroUri }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.placeholderText}>Sin foto</Text>
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.title}>{property.title}</Text>
          {!!property.city && <Text style={styles.location}>📍 {property.city}</Text>}
          {property.rating != null && (
            <Text style={styles.rating}>
              {property.rating} ★ ({property.review_count} {property.review_count === 1 ? 'reseña' : 'reseñas'})
            </Text>
          )}
          <Text style={styles.meta}>Hasta {property.max_guests} huéspedes</Text>
          {!!property.description && <Text style={styles.description}>{property.description}</Text>}

          {amenities.length > 0 && (
            <View style={styles.amenities}>
              <Text style={styles.amenitiesTitle}>Comodidades</Text>
              <View style={styles.amenitiesList}>
                {amenities.map((item) => (
                  <View key={item} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Precio por noche</Text>
            <Text style={styles.priceValue}>{formatCop(property.price_per_night)}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Fecha de entrada"
              placeholder="AAAA-MM-DD"
              keyboardType="number-pad"
              maxLength={10}
              value={checkIn}
              onChangeText={(text) => setCheckIn(maskIsoDateInput(text))}
            />
            <Input
              label="Fecha de salida"
              placeholder="AAAA-MM-DD"
              keyboardType="number-pad"
              maxLength={10}
              value={checkOut}
              onChangeText={(text) => setCheckOut(maskIsoDateInput(text))}
            />
            <View style={styles.guestsRow}>
              <Text style={styles.guestsLabel}>Huéspedes</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setGuests((g) => Math.max(1, g - 1))}
                  accessibilityLabel="Quitar huésped"
                >
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{guests}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => setGuests((g) => Math.min(property.max_guests, g + 1))}
                  accessibilityLabel="Agregar huésped"
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ErrorBanner message={formError} />

          <Button variant="primary" size="lg" fullWidth onPress={handleContinue}>
            Ver disponibilidad y reservar
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  heroImage: { width: '100%', height: 280 },
  heroPlaceholder: { backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, fontSize: typography.sizes.caption },
  content: { padding: spacing.lg },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.sm },
  location: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.sm },
  rating: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.forest, marginBottom: spacing.sm },
  meta: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.md },
  description: { fontSize: typography.sizes.body, color: colors.slate, lineHeight: 24, marginBottom: spacing.lg },
  amenities: { marginBottom: spacing.lg },
  amenitiesTitle: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.muted, marginBottom: spacing.sm },
  amenitiesList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.freshSoft, borderRadius: radius.full },
  amenityText: { fontSize: typography.sizes.caption, color: colors.forest },
  priceSection: { paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: spacing.lg },
  priceLabel: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  priceValue: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.forest },
  form: { marginBottom: spacing.sm },
  guestsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  guestsLabel: { fontSize: typography.sizes.body, color: colors.slate, fontWeight: typography.weights.medium },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: typography.sizes.heading, color: colors.forest, lineHeight: 28 },
  stepperValue: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, minWidth: 24, textAlign: 'center' },
});
