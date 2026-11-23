import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, LoadingState } from '@/components/States';
import { api, getApiErrorMessage, getApiErrorStatus } from '@/lib/api';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import { formatMoney, normalizeAmenities, pluralize } from '@/lib/format';
import { firstParam } from '@/lib/routes';
import type { Property } from '@/lib/types';

const MAX_CONTENT_WIDTH = 720;

function Gallery({ images, width }: { images: string[]; width: number }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={[styles.hero, styles.heroPlaceholder, { width }]}>
        <Text style={styles.heroGlyph}>🏡</Text>
      </View>
    );
  }

  return (
    <View style={[styles.galleryFrame, { width }]}>
      <FlatList
        data={images}
        keyExtractor={(url, position) => `${position}-${url}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, position) => ({ length: width, offset: width * position, index: position })}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={[styles.hero, { width }]} resizeMode="cover" accessibilityIgnoresInvertColors />
        )}
      />
      {images.length > 1 ? (
        <View style={styles.counter} accessibilityLabel={`Foto ${index + 1} de ${images.length}`}>
          <Text style={styles.counterText}>{`${index + 1}/${images.length}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  // The file is named [id] but the value is the listing's slug: the API looks listings up by slug.
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const slug = firstParam(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!slug) {
      setError('No encontramos esta propiedad.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setProperty(await api.get<Property>(`/properties/${encodeURIComponent(slug)}`));
    } catch (err) {
      setProperty(null);
      setError(
        getApiErrorStatus(err) === 404
          ? 'Esta propiedad ya no está disponible.'
          : getApiErrorMessage(err, 'No pudimos cargar la propiedad.'),
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const galleryWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH) - spacing.lg * 2;

  if (loading || !property) {
    return (
      <Screen title="Propiedad" back backHref="/(guest)">
        {loading ? (
          <LoadingState label="Cargando propiedad…" />
        ) : (
          <ErrorState message={error || 'No encontramos esta propiedad.'} onRetry={() => void load()} />
        )}
      </Screen>
    );
  }

  const images = property.media.filter((item) => item.type !== 'video').map((item) => item.url);
  if (images.length === 0 && property.cover_image) images.push(property.cover_image);
  const amenities = normalizeAmenities(property.amenities);
  const reviews = property.reviews ?? [];
  const hasRating = property.rating !== null && property.review_count > 0;

  return (
    <Screen
      title="Propiedad"
      back
      backHref="/(guest)"
      footer={
        <View style={styles.footerRow}>
          <View style={styles.footerPrice}>
            <Text style={styles.priceValue}>{formatMoney(property.price_per_night)}</Text>
            <Text style={styles.priceLabel}>por noche</Text>
          </View>
          <View style={styles.footerButton}>
            <Button
              size="lg"
              fullWidth
              onPress={() => router.push(`/(guest)/quote?slug=${encodeURIComponent(property.slug)}`)}
            >
              Ver fechas y reservar
            </Button>
          </View>
        </View>
      }
    >
      <Gallery images={images} width={galleryWidth} />

      <Text style={styles.title} accessibilityRole="header">
        {property.title}
      </Text>
      <Text style={styles.location}>📍 {property.city ?? property.country}</Text>
      <View style={styles.metaRow}>
        {hasRating ? (
          <Text style={styles.rating}>
            {`★ ${(property.rating ?? 0).toFixed(1)} · ${pluralize(property.review_count, 'reseña', 'reseñas')}`}
          </Text>
        ) : (
          <Text style={styles.metaText}>Aún sin reseñas</Text>
        )}
        <Text style={styles.metaText}>{`Hasta ${pluralize(property.max_guests, 'huésped', 'huéspedes')}`}</Text>
      </View>

      {property.description ? <Text style={styles.description}>{property.description}</Text> : null}

      {amenities.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comodidades</Text>
          <View style={styles.chips}>
            {amenities.map((amenity) => (
              <View key={amenity} style={styles.chip}>
                <Text style={styles.chipText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {reviews.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reseñas de huéspedes</Text>
          {reviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.review}>
              <Text style={styles.reviewStars} accessibilityLabel={`${review.rating} de 5 estrellas`}>
                {'★'.repeat(Math.max(0, Math.min(5, Math.round(review.rating))))}
              </Text>
              {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  galleryFrame: { alignSelf: 'center', marginBottom: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  hero: { height: 240, backgroundColor: colors.sand },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderRadius: radius.lg, marginBottom: spacing.md },
  heroGlyph: { fontSize: 56 },
  counter: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  counterText: { color: colors.surface, fontSize: 12, fontWeight: typography.weights.semibold },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink, marginBottom: spacing.xs },
  location: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  rating: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.forest },
  metaText: { fontSize: typography.sizes.caption, color: colors.muted },
  description: { fontSize: typography.sizes.body, color: colors.slate, lineHeight: 24, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.freshSoft, borderRadius: radius.full },
  chipText: { fontSize: typography.sizes.caption, color: colors.forest },
  review: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  reviewStars: { color: colors.amber, fontSize: typography.sizes.body, marginBottom: spacing.xs },
  reviewText: { fontSize: typography.sizes.caption, color: colors.slate, lineHeight: 19 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  footerPrice: { flexShrink: 0 },
  priceValue: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  priceLabel: { fontSize: 12, color: colors.muted },
  footerButton: { flex: 1 },
});
