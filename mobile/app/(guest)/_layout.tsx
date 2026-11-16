import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { authStorage } from '@/lib/auth';

export default function GuestLayout() {
  const { isAuthenticated, logout } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      authStorage.logout();
    }
  }, [isAuthenticated]);

  return (
    <Stack>
      <Stack.Screen options={{ headerShown: false }} name="index" />
      <Stack.Screen options={{ headerShown: false }} name="property/[id]" />
      <Stack.Screen options={{ headerShown: false }} name="quote" />
      <Stack.Screen options={{ headerShown: false }} name="booking" />
      <Stack.Screen options={{ headerShown: false }} name="checkout" />
      <Stack.Screen options={{ headerShown: false }} name="my-bookings" />
      <Stack.Screen options={{ headerShown: false }} name="profile" />
    </Stack>
  );
}