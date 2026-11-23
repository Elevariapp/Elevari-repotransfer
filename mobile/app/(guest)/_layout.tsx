import { Redirect, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BottomNav } from '@/components/BottomNav';
import { LOGIN_HREF } from '@/lib/routes';
import { useAppStore } from '@/lib/store';

export default function GuestLayout() {
  const isLoading = useAppStore((state) => state.isLoading);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const unread = useAppStore((state) => state.unreadNotifications);

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href={LOGIN_HREF} />;

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="my-bookings" options={{ animation: 'none' }} />
        <Stack.Screen name="profile" options={{ animation: 'none' }} />
      </Stack>
      <BottomNav
        group="(guest)"
        items={[
          { key: 'index', label: 'Explorar', glyph: '🔎', href: '/(guest)' },
          { key: 'my-bookings', label: 'Reservas', glyph: '🧳', href: '/(guest)/my-bookings' },
          { key: 'profile', label: 'Perfil', glyph: '👤', href: '/(guest)/profile', badge: unread },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});