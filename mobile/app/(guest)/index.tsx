import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { PropertyCard } from '@/components/PropertyCard';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { api, getApiErrorMessage } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/design-tokens';
import type { Property, PropertyListResponse } from '@/lib/types';

const PAGE_SIZE = 20;

type LoadMode = 'initial' | 'refresh' | 'more';

function mergeById(current: Property[], incoming: Property[]): Property[] {
  const known = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !known.has(item.id))];
}

export default function GuestIndexScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);

  const load = useCallback(async (filter: string, mode: LoadMode, offset: number) => {
    const requestId = ++latestRequest.current;
    if (mode === 'initial') {
      setItems([]);
      setTotal(0);
      setLoading(true);
    } else if (mode === 'refresh') setRefreshing(true);
    else setLoadingMore(true);

    try {
      const response = await api.get<PropertyListResponse>('/properties', {
        params: { limit: PAGE_SIZE, offset, ...(filter ? { city: filter } : {}) },
      });
      // A newer search/refresh started meanwhile: drop this answer.
      if (requestId !== latestRequest.current) return;
      setItems((current) => (mode === 'more' ? mergeById(current, response.data) : response.data));
      setTotal(response.meta.total);
      setError('');
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(getApiErrorMessage(err, 'No pudimos cargar las propiedades.'));
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(city, 'initial', 0);
  }, [city, load]);

  const applySearch = () => setCity(search.trim());
  const clearSearch = () => {
    setSearch('');
    setCity('');
  };

  const loadMore = () => {
    if (loading || refreshing || loadingMore || error || items.length >= total) return;
    void load(city, 'more', items.length);
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.subtitle}>Descubre escapes excepcionales en Colombia</Text>
      <Input
        placeholder="Buscar por ciudad (ej. Medellín)"
        accessibilityLabel="Buscar por ciudad"
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={applySearch}
        style={styles.search}
      />
      <View style={styles.searchActions}>
        <View style={styles.searchButton}>
          <Button size="sm" onPress={applySearch} accessibilityLabel="Buscar propiedades">
            Buscar
          </Button>
        </View>
        {city ? (
          <View style={styles.searchButton}>
            <Button size="sm" variant="secondary" onPress={clearSearch}>
              Quitar filtro
            </Button>
          </View>
        ) : null}
      </View>
      {error && items.length > 0 ? <Banner tone="error">{error}</Banner> : null}
    </View>
  );

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Buscando propiedades…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={() => void load(city, 'initial', 0)} />;
  } else {
    emptyState = (
      <EmptyState
        title="No encontramos propiedades"
        message={
          city
            ? `No hay propiedades publicadas en «${city}» por ahora.`
            : 'Aún no hay propiedades publicadas. Vuelve pronto.'
        }
        actionLabel={city ? 'Quitar filtro' : undefined}
        onAction={city ? clearSearch : undefined}
      />
    );
  }

  return (
    <Screen title="Explorar" tabbed scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // The route param carries the slug: the API looks a listing up by slug.
          <PropertyCard property={item} onPress={() => router.push(`/(guest)/property/${item.slug}`)} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        ListFooterComponent={loadingMore ? <LoadingState label="Cargando más…" /> : undefined}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={() => void load(city, 'refresh', 0)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md },
  subtitle: { fontSize: typography.sizes.body, color: colors.muted, marginBottom: spacing.md },
  search: { marginBottom: spacing.sm },
  searchActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  searchButton: { minWidth: 120 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
});
