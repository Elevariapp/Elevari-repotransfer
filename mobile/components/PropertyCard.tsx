import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '@/lib/design-tokens';
import { formatMoney, pluralize } from '@/lib/format';
import type { Property } from '@/lib/types';

// Cover photo of a listing: the explicit cover first, then the first uploaded photo.
export function propertyImageUrl(property: Pick<Property, 'cover_image' | 'media'>): string | null {
  return property.cover_image ?? property.media?.[0]?.url ?? null;
}

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const image = propertyImageUrl(property);
  const place = property.city ?? property.country;
  const price = formatMoney(property.price_per_night);
  const rating = property.rating !== null && property.review_count > 0 ? property.rating : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${place}, ${price} por noche`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderGlyph}>🏡</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          📍 {place}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>
            {price}
            <Text style={styles.perNight}> / noche</Text>
          </Text>
          <Text style={styles.meta}>
            {rating !== null ? `★ ${rating.toFixed(1)} · ` : ''}
            {`${pluralize(property.max_guests, 'huésped', 'huéspedes')} máx.`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  pressed: { opacity: 0.9 },
  image: { width: '100%', height: 200, backgroundColor: colors.sand },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderGlyph: { fontSize: 42 },
  content: { padding: spacing.md },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  location: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  price: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  perNight: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.muted },
  meta: { fontSize: typography.sizes.caption, color: colors.muted },
});
