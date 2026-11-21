import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatCop } from '@/lib/format';
import type { PropertiesResponse, Property } from '@/types';

const PAGE_SIZE = 24;

export default function GuestIndexScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (offset: number, mode: 'initial' | 'more' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'more') setLoadingMore(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const response = await api.get<PropertiesResponse>('/properties', {
        params: { limit: PAGE_SIZE, offset },
      });
      setProperties((current) => (offset === 0 ? response.data : [...current, ...response.data]));
      setTotal(response.meta.total);
      setError('');
    } catch (err) {
      if (mode === 'more') return;
      setError(getErrorMessage(err, 'No pudimos cargar las propiedades.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(0, 'initial');
  }, [load]);

  const handleEndReached = () => {
    if (loading || loadingMore || refreshing || properties.length >= total) return;
    load(properties.length, 'more');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Explorar</Text>
          <Text style={styles.subtitle}>Descubre escapes excepcionales</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => router.push('/my-bookings')} accessibilityRole="button">
            <Text style={styles.topLink}>Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')} accessibilityRole="button">
            <Text style={styles.topLink}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <LoadingView />
      ) : error && properties.length === 0 ? (
        <ErrorView message={error} onRetry={() => load(0, 'initial')} />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => load(0, 'refresh')}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyView title="Aún no hay propiedades" subtitle="Vuelve pronto para descubrir nuevos espacios." />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.forest} style={styles.footer} /> : undefined}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/property/${encodeURIComponent(item.slug)}`)}
              accessibilityRole="button"
            >
              {item.cover_image ? (
                <Image source={{ uri: item.cover_image }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>Sin foto</Text>
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!!item.city && <Text style={styles.cardLocation}>📍 {item.city}</Text>}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{formatCop(item.price_per_night)} / noche</Text>
                  {item.rating != null && <Text style={styles.cardRating}>★ {item.rating}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.lg },
  topActions: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.xs },
  topLink: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.forest },
  title: { fontSize: typography.sizes.heading, fontWeight: typography.weights.bold, color: colors.ink },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginTop: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.card },
  image: { width: '100%', height: 200 },
  imagePlaceholder: { backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, fontSize: typography.sizes.caption },
  cardContent: { padding: spacing.md },
  cardTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  cardLocation: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  cardRating: { fontSize: typography.sizes.caption, color: colors.slate, fontWeight: typography.weights.medium },
  footer: { paddingVertical: spacing.md },
});
