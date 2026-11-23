import { Redirect, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BottomNav } from '@/components/BottomNav';
import { isHostRole } from '@/lib/auth';
import { LOGIN_HREF } from '@/lib/routes';
import { useAppStore } from '@/lib/store';

export default function HostLayout() {
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);
  const unread = useAppStore((state) => state.unreadNotifications);

  if (isLoading) return null;
  if (!user) return <Redirect href={LOGIN_HREF} />;
  // Only hosts and admins may use the host area.
  if (!isHostRole(user.role)) return <Redirect href="/(guest)" />;

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="properties" options={{ animation: 'none' }} />
        <Stack.Screen name="bookings" options={{ animation: 'none' }} />
        <Stack.Screen name="profile" options={{ animation: 'none' }} />
      </Stack>
      <BottomNav
        group="(host)"
        items={[
          { key: 'index', label: 'Panel', glyph: '📊', href: '/(host)' },
          { key: 'properties', label: 'Propiedades', glyph: '🏡', href: '/(host)/properties' },
          { key: 'bookings', label: 'Reservas', glyph: '📅', href: '/(host)/bookings' },
          { key: 'profile', label: 'Perfil', glyph: '👤', href: '/(host)/profile', badge: unread },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});