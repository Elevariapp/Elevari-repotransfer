import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Banner, EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/lib/design-tokens';
import { formatDateTime } from '@/lib/format';
import {
  fetchNotifications,
  getSeenIds,
  isUnread,
  markNotificationsSeen,
  notificationHref,
} from '@/lib/notifications';
import { useAppStore } from '@/lib/store';
import type { AppNotification } from '@/lib/types';
import { useScreenResource } from '@/lib/use-resource';

function NotificationRow({
  item,
  unread,
  onPress,
}: {
  item: AppNotification;
  unread: boolean;
  onPress?: () => void;
}) {
  const date = formatDateTime(item.created_at);
  const content = (
    <Card padded style={styles.card}>
      <View style={styles.row}>
        <View
          style={[styles.dot, unread ? styles.dotUnread : styles.dotRead]}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <View style={styles.texts}>
          <Text style={[styles.title, unread && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </Card>
  );

  const label = `${unread ? 'Sin leer. ' : ''}${item.title}. ${item.body}. ${date}`;
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Abre la reserva relacionada"
    >
      {content}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const userId = useAppStore((state) => state.user?.id ?? null);
  const { data, loading, refreshing, error, reload, refresh } = useScreenResource(
    fetchNotifications,
    'No pudimos cargar tus notificaciones.',
  );

  // The ids seen before this visit are read once; only the rest get an unread dot.
  const [seen, setSeen] = useState<ReadonlySet<string> | null>(null);
  const seenSnapshot = useRef<Promise<ReadonlySet<string>> | null>(null);

  useEffect(() => {
    if (!data || !userId) return undefined;
    let cancelled = false;

    void (async () => {
      seenSnapshot.current ??= getSeenIds(userId).then((ids) => new Set(ids));
      const previous = await seenSnapshot.current;
      if (cancelled) return;
      setSeen(previous);
      await markNotificationsSeen(userId, data);
      if (!cancelled) useAppStore.getState().setUnreadNotifications(0);
    })();

    return () => {
      cancelled = true;
    };
  }, [data, userId]);

  const items = data ?? [];

  let emptyState;
  if (loading) {
    emptyState = <LoadingState label="Cargando tus notificaciones…" />;
  } else if (error) {
    emptyState = <ErrorState message={error} onRetry={reload} />;
  } else {
    emptyState = (
      <EmptyState
        title="No tienes notificaciones"
        message="Aquí verás el estado de tus reservas, tus pagos y los avisos de tu cuenta."
      />
    );
  }

  return (
    <Screen title="Notificaciones" back backHref="/(guest)/profile" scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow
            item={item}
            unread={seen !== null && isUnread(item, seen)}
            onPress={item.booking_id ? () => router.push(notificationHref(item.type)) : undefined}
          />
        )}
        ListHeaderComponent={error && items.length > 0 ? <Banner tone="error">{error}</Banner> : undefined}
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
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: radius.full, marginTop: 6 },
  dotUnread: { backgroundColor: colors.forest },
  dotRead: { backgroundColor: 'transparent' },
  texts: { flex: 1 },
  title: { fontSize: typography.sizes.body, fontWeight: typography.weights.medium, color: colors.ink },
  titleUnread: { fontWeight: typography.weights.bold },
  body: { fontSize: typography.sizes.caption, lineHeight: 19, color: colors.slate, marginTop: spacing.xs },
  date: { fontSize: 12, color: colors.muted, marginTop: spacing.xs },
  chevron: { fontSize: typography.sizes.heading, color: colors.muted, marginLeft: spacing.xs },
});
