import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { StatusChip } from '@/components/StatusChip';
import { api, getApiErrorMessage } from '@/lib/api';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES } from '@/lib/booking';
import { colors, spacing, typography } from '@/lib/design-tokens';
import { formatDateRange, formatMoney, pluralize } from '@/lib/format';
import type { BookingsMeResponse, BookingSummary } from '@/lib/types';

type LoadMode = 'initial' | 'refresh' | 'silent';

function BookingRow({ booking, onPress }: { booking: BookingSummary; onPress: () => void }) {
  const label = BOOKING_STATUS_LABELS[booking.status] ?? booking.status;
  const dates = formatDateRange(booking.check_in, booking.check_out);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${booking.property_title}, ${dates}, ${label}`}
    >
      <Card padded style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {booking.property_title}
          </Text>
          <StatusChip label={label} tone={BOOKING_STATUS_TONES[booking.status] ?? 'neutral'} />
        </View>
        {booking.property_city ? <Text style={styles.cardMeta}>{booking.property_city}</Text> : null}
        <Text style={styles.cardMeta}>{`${dates} · ${pluralize(booking.guests, 'huésped', 'huéspedes')}`}</Text>
        <View style={styles.cardBottom}>
          {typeof booking.total === 'number' ? <Text style={styles.cardTotal}>{formatMoney(booking.total)}</Text> : <View />}
          {booking.status === 'pending_payment' ? <Text style={styles.cardAction}>Completar pago →</Text> : null}
        </View>
      </Card>
    </Pressable>
  );
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);

  const load = useCallback(async (mode: LoadMode) => {
    const requestId = ++latestRequest.current;
    if (mode === 'initial') setLoading(true);
    else if (mode === 'refresh') setRefreshing(true);

    try {
      const response = await api.get<BookingsMeResponse>('/bookings/me');
      if (requestId !== latestRequest.current) return;
      hasLoaded.current = true;
      setBookings(response.data);
      setError('');
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      // A silent refresh (coming back to the screen) keeps what is already on display.
      if (mode !== 'silent') setError(getApiErrorMessage(err, 'No pudimos cargar tus reservas.'));
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload on every visit: a booking paid in the checkout changes status while this screen stays mounted.
  useFocusEffect(
    useCallback(() => {
      void load(hasLoaded.current ? 'silent' : 'initial');
    }, [load]),
  );

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Cargando tus reservas…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={() => void load('initial')} />;
  } else {
    emptyState = (
      <EmptyState
        title="Aún no tienes reservas"
        message="Cuando reserves una propiedad, aparecerá aquí."
        actionLabel="Explorar propiedades"
        onAction={() => router.replace('/(guest)')}
      />
    );
  }

  return (
    <Screen title="Mis reservas" tabbed scroll={false}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingRow
            booking={item}
            onPress={() => router.push(`/(guest)/checkout?bookingId=${encodeURIComponent(item.id)}`)}
          />
        )}
        ListHeaderComponent={error && bookings.length > 0 ? <Banner tone="error">{error}</Banner> : undefined}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => void load('refresh')}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  card: { marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  cardMeta: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  cardTotal: { fontSize: typography.sizes.body, fontWeight: typography.weights.bold, color: colors.forest },
  cardAction: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.forest },
});