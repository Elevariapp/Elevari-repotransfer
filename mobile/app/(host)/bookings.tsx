import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { StatusChip } from '@/components/StatusChip';
import { getApiErrorMessage } from '@/lib/api';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import { formatDate, formatDateRange, formatMoney, pluralize } from '@/lib/format';
import { fetchHostBookings } from '@/lib/host';
import {
  HOST_BOOKING_SCOPES,
  HOST_BOOKINGS_EMPTY,
  hostBookingStatus,
  hostReceivesLabel,
} from '@/lib/host-bookings';
import type { HostBookingRow, HostBookingScope } from '@/lib/types';

type LoadMode = 'initial' | 'refresh' | 'silent';

interface ListState {
  rows: HostBookingRow[];
  total: number;
  page: number;
  hasMore: boolean;
}

function BookingRow({ booking, scope }: { booking: HostBookingRow; scope: HostBookingScope }) {
  const status = hostBookingStatus(scope, booking.status);
  const dates = formatDateRange(booking.check_in, booking.check_out);
  const guest = booking.guest_name ?? 'Huésped';
  const stay = `${dates} · ${pluralize(booking.nights, 'noche', 'noches')}`;
  const receives =
    booking.host_receives == null
      ? null
      : `${hostReceivesLabel(booking.status)} ${formatMoney(booking.host_receives, booking.currency)}`;

  return (
    <Card
      padded
      style={styles.card}
      accessible
      accessibilityLabel={[booking.property.title, `${guest}, ${pluralize(booking.guests, 'huésped', 'huéspedes')}`, stay, status.label, receives]
        .filter(Boolean)
        .join('. ')}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {booking.property.title}
        </Text>
        <StatusChip label={status.label} tone={status.tone} />
      </View>
      <Text style={styles.cardMeta}>{`${guest} · ${pluralize(booking.guests, 'huésped', 'huéspedes')}`}</Text>
      <Text style={styles.cardMeta}>{stay}</Text>
      {receives ? <Text style={styles.cardReceives}>{receives}</Text> : null}
      <Text style={styles.cardCreated}>{`Reservada el ${formatDate(booking.created_at)}`}</Text>
    </Card>
  );
}

function ScopeTabs({ scope, onSelect }: { scope: HostBookingScope; onSelect: (scope: HostBookingScope) => void }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {HOST_BOOKING_SCOPES.map((option) => {
        const selected = option.value === scope;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[styles.tab, selected && styles.tabSelected]}
          >
            <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HostBookingsScreen() {
  const [scope, setScope] = useState<HostBookingScope>('upcoming');
  const [list, setList] = useState<ListState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [moreError, setMoreError] = useState('');
  const latestRequest = useRef(0);
  const hasLoaded = useRef(false);
  const pageRef = useRef(1);

  const load = useCallback(
    async (mode: LoadMode) => {
      // Coming back to the screen must not collapse a list the host already expanded.
      if (mode === 'silent' && pageRef.current > 1) return;

      const requestId = ++latestRequest.current;
      setLoadingMore(false);
      setMoreError('');
      if (mode === 'initial') {
        setLoading(true);
        setList(null);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      }

      try {
        const result = await fetchHostBookings(scope, 1);
        if (requestId !== latestRequest.current) return;
        hasLoaded.current = true;
        pageRef.current = 1;
        setList({
          rows: result.data,
          total: result.pagination.total,
          page: 1,
          hasMore: result.pagination.has_more,
        });
        setError('');
      } catch (err) {
        if (requestId !== latestRequest.current) return;
        // A silent reload keeps what is already on display.
        if (mode !== 'silent') setError(getApiErrorMessage(err, 'No pudimos cargar tus reservas.'));
      } finally {
        if (requestId === latestRequest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [scope],
  );

  useFocusEffect(
    useCallback(() => {
      void load(hasLoaded.current ? 'silent' : 'initial');
    }, [load]),
  );

  const selectScope = (next: HostBookingScope) => {
    if (next === scope) return;
    // The new tab starts from its own first page, never from another tab's rows.
    hasLoaded.current = false;
    pageRef.current = 1;
    setError('');
    setScope(next);
  };

  const loadMore = async () => {
    if (!list || !list.hasMore || loadingMore) return;
    const requestId = ++latestRequest.current;
    const nextPage = list.page + 1;
    setLoadingMore(true);
    setMoreError('');

    try {
      const result = await fetchHostBookings(scope, nextPage);
      if (requestId !== latestRequest.current) return;
      const known = new Set(list.rows.map((row) => row.id));
      pageRef.current = nextPage;
      setList({
        rows: [...list.rows, ...result.data.filter((row) => !known.has(row.id))],
        total: result.pagination.total,
        page: nextPage,
        hasMore: result.pagination.has_more,
      });
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      // The rows already loaded stay; only the button reports the failure.
      setMoreError(getApiErrorMessage(err, 'No pudimos cargar más reservas.'));
    } finally {
      if (requestId === latestRequest.current) setLoadingMore(false);
    }
  };

  const rows = list?.rows ?? [];

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Cargando tus reservas…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={() => void load('initial')} />;
  } else {
    emptyState = <EmptyState title={HOST_BOOKINGS_EMPTY[scope].title} message={HOST_BOOKINGS_EMPTY[scope].message} />;
  }

  return (
    <Screen title="Reservas" tabbed scroll={false}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingRow booking={item} scope={scope} />}
        ListHeaderComponent={
          <View>
            <ScopeTabs scope={scope} onSelect={selectScope} />
            {error && rows.length > 0 ? <Banner tone="error">{error}</Banner> : null}
            {list && rows.length > 0 ? (
              <Text style={styles.count} accessibilityLiveRegion="polite">
                {pluralize(list.total, 'reserva', 'reservas')}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={emptyState}
        ListFooterComponent={
          list && rows.length > 0 ? (
            <View style={styles.footer}>
              {moreError ? <Banner tone="error">{moreError}</Banner> : null}
              {list.hasMore ? (
                <Button variant="secondary" fullWidth loading={loadingMore} onPress={() => void loadMore()}>
                  Ver más reservas
                </Button>
              ) : null}
            </View>
          ) : undefined
        }
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
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  tabText: { fontSize: typography.sizes.caption, fontWeight: typography.weights.semibold, color: colors.ink },
  tabTextSelected: { color: colors.surface },
  count: { fontSize: typography.sizes.caption, color: colors.slate, marginBottom: spacing.sm, marginLeft: spacing.xs },
  card: { marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: typography.sizes.body, fontWeight: typography.weights.semibold, color: colors.ink },
  cardMeta: { fontSize: typography.sizes.caption, color: colors.muted, marginTop: spacing.xs },
  cardReceives: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.forest,
    marginTop: spacing.sm,
  },
  cardCreated: { fontSize: 12, color: colors.muted, marginTop: spacing.xs },
  footer: { gap: spacing.sm, paddingTop: spacing.xs },
});
