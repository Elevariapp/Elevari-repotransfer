import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { StatusChip } from '@/components/StatusChip';
import { colors, radius, shadows, spacing, typography } from '@/lib/design-tokens';
import { pluralize } from '@/lib/format';
import { fetchHostProperties, HOST_STATUS_LABELS, HOST_STATUS_TONES } from '@/lib/host';
import type { HostProperty } from '@/lib/types';
import { useScreenResource } from '@/lib/use-resource';

function HostPropertyCard({ property, onPress }: { property: HostProperty; onPress?: () => void }) {
  const label = HOST_STATUS_LABELS[property.status] ?? property.status;
  const pending = property.pending_media_count ?? 0;
  const photos = pluralize(property.media_count, 'foto', 'fotos');
  const summary = [property.city, photos, pending > 0 ? `${pending} en revisión` : null].filter(Boolean).join(' · ');

  const content = (
    <View style={styles.card}>
      {property.cover_image ? (
        <Image
          source={{ uri: property.cover_image }}
          style={styles.image}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderGlyph}>🏡</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.title} numberOfLines={2}>
            {property.title}
          </Text>
          <StatusChip label={label} tone={HOST_STATUS_TONES[property.status] ?? 'neutral'} />
        </View>
        <Text style={styles.meta}>{summary}</Text>
        {property.status === 'draft' ? (
          <Text style={styles.note}>Nuestro equipo revisará tu propiedad antes de publicarla.</Text>
        ) : null}
        {onPress ? <Text style={styles.link}>Ver como huésped →</Text> : null}
      </View>
    </View>
  );

  const accessibilityLabel = `${property.title}, ${summary}, ${label}`;
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Abre la propiedad como la ven los huéspedes"
    >
      {content}
    </Pressable>
  );
}

export default function HostPropertiesScreen() {
  const router = useRouter();
  const { data, loading, refreshing, error, reload, refresh } = useScreenResource(
    fetchHostProperties,
    'No pudimos cargar tus propiedades.',
  );
  const properties = data ?? [];
  const addProperty = () => router.push('/(host)/property/new');

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Cargando tus propiedades…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={reload} />;
  } else {
    emptyState = (
      <EmptyState
        title="Aún no tienes propiedades"
        message="Crea tu primer anuncio. Nuestro equipo lo revisará antes de publicarlo."
        actionLabel="Agregar propiedad"
        onAction={addProperty}
      />
    );
  }

  return (
    <Screen
      title="Propiedades"
      tabbed
      scroll={false}
      headerRight={
        <Button size="sm" onPress={addProperty} accessibilityLabel="Agregar propiedad">
          + Agregar
        </Button>
      }
    >
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HostPropertyCard
            property={item}
            onPress={item.status === 'published' ? () => router.push(`/(guest)/property/${item.slug}`) : undefined}
          />
        )}
        ListHeaderComponent={error && properties.length > 0 ? <Banner tone="error">{error}</Banner> : undefined}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  image: { width: '100%', height: 150, backgroundColor: colors.sand },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderGlyph: { fontSize: 36 },
  content: { padding: spacing.md },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  meta: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs },
  note: { fontSize: typography.sizes.caption, color: colors.amberInk, marginTop: spacing.sm },
  link: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.forest,
    marginTop: spacing.sm,
  },
});