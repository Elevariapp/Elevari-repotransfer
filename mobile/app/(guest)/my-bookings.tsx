import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { colors, spacing, typography, radius, shadows } from '@/lib/design-tokens';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { bookingStatusLabel, formatCop, formatDateRange } from '@/lib/format';
import type { MyBooking, MyBookingsResponse } from '@/types';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    try {
      const response = await api.get<MyBookingsResponse>('/bookings/me');
      setBookings(response.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cargar tus reservas.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever the screen regains focus (e.g. after paying).
  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load])
  );

  if (loading) return <LoadingView />;
  if (error && bookings.length === 0) return <ErrorView message={error} onRetry={() => load('initial')} />;

  return (
    <FlatList
      style={styles.container}
      data={bookings}
      keyExtractor={(item) => item.id}
      refreshing={refreshing}
      onRefresh={() => load('refresh')}
      ListEmptyComponent={
        <EmptyView
          title="No tienes reservas"
          subtitle="Empieza a explorar propiedades"
          actionLabel="Explorar"
          onAction={() => router.replace('/')}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => router.push(`/property/${encodeURIComponent(item.property_slug)}`)}
            accessibilityRole="button"
          >
            <Text style={styles.cardTitle}>{item.property_title}</Text>
          </TouchableOpacity>
          {!!item.property_city && <Text style={styles.cardSubtitle}>📍 {item.property_city}</Text>}
          <Text style={styles.cardSubtitle}>{formatDateRange(item.check_in, item.check_out)}</Text>
          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, item.status === 'cancelled' && styles.statusBadgeMuted]}>
              <Text style={[styles.statusText, item.status === 'cancelled' && styles.statusTextMuted]}>
                {bookingStatusLabel(item.status)}
              </Text>
            </View>
            {item.total != null && <Text style={styles.cardTotal}>{formatCop(item.total)}</Text>}
          </View>
          {item.status === 'pending_payment' && (
            <View style={styles.payButton}>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onPress={() => router.push(`/checkout/${item.id}`)}
              >
                Pagar ahora
              </Button>
            </View>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  listContent: { padding: spacing.lg, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.lg, ...shadows.card, padding: spacing.md },
  cardTitle: { fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink, marginBottom: spacing.xs },
  cardSubtitle: { fontSize: typography.sizes.caption, color: colors.muted, marginBottom: spacing.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.freshSoft },
  statusBadgeMuted: { backgroundColor: colors.sand },
  statusText: { fontSize: typography.sizes.caption, fontWeight: typography.weights.medium, color: colors.forest },
  statusTextMuted: { color: colors.muted },
  cardTotal: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  payButton: { marginTop: spacing.md },
});
