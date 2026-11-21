import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { propertyStatusLabel } from '@/lib/format';
import type { HostProperty, HostPropertiesResponse } from '@/types';

export default function HostPropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    try {
      const response = await api.get<HostPropertiesResponse>('/host/properties');
      setProperties(response.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar tus propiedades.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );

  if (loading) return <LoadingView />;
  if (error && properties.length === 0) return <ErrorView message={error} onRetry={() => load('initial')} />;

  return (
    <FlatList
      style={styles.container}
      data={properties}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={() => load('refresh')}
      ListHeaderComponent={
        <View style={styles.headerAction}>
          <Button variant="primary" size="md" fullWidth onPress={() => router.push('/host/property/new')}>
            Nueva propiedad
          </Button>
        </View>
      }
      ListEmptyComponent={
        <EmptyView title="Aún no tienes propiedades" subtitle="Crea tu primer anuncio para empezar." />
      }
      renderItem={({ item }) => {
        const published = item.status === 'published';
        return (
          <TouchableOpacity
            style={styles.card}
            disabled={!published}
            onPress={() => router.push(`/property/${encodeURIComponent(item.slug)}`)}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!item.city && <Text style={styles.cardLocation}>📍 {item.city}</Text>}
            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, !published && styles.statusBadgeMuted]}>
                <Text style={[styles.statusText, !published && styles.statusTextMuted]}>
                  {propertyStatusLabel(item.status)}
                </Text>
              </View>
              <Text style={styles.cardMeta}>
                {item.media_count} {item.media_count === 1 ? 'archivo' : 'archivos'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  listContent: { padding: spacing.lg, flexGrow: 1 },
  headerAction: { marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, ...shadows.card, padding: spacing.md, gap: spacing.xs },
  cardTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  cardLocation: { fontSize: typography.sizes.caption, color: colors.muted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  cardMeta: { fontSize: typography.sizes.caption, color: colors.muted },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.freshSoft },
  statusBadgeMuted: { backgroundColor: colors.amberSoft },
  statusText: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.forest },
  statusTextMuted: { color: colors.amberInk },
});
