import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { authStorage } from '@/lib/auth';
import { mobileNotificationService } from '@/lib/notifications';

export default function GuestLayout() {
  const { isAuthenticated, logout } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      authStorage.logout();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    mobileNotificationService.initialize();
  }, []);

  return (
    <Stack>
      <Stack.Screen options={{ headerShown: false }} name="index" />
      <Stack.Screen options={{ headerShown: false }} name="property/[id]" />
      <Stack.Screen options={{ headerShown: false }} name="quote" />
      <Stack.Screen options={{ headerShown: false }} name="booking" />
      <Stack.Screen options={{ headerShown: false }} name="checkout" />
      <Stack.Screen options={{ headerShown: false }} name="my-bookings" />
      <Stack.Screen options={{ headerShown: false }} name="profile" />
      <Stack.Screen options={{ headerShown: false }} name="legal/terms" />
      <Stack.Screen options={{ headerShown: false }} name="legal/privacy" />
      <Stack.Screen options={{ headerShown: false }} name="legal/refund" />
      <Stack.Screen options={{ headerShown: false }} name="legal/account-deletion" />
      <Stack.Screen options={{ headerShown: false }} name="legal/account-deletion/confirm" />
      <Stack.Screen options={{ headerShown: false }} name="legal/content-moderation" />
      <Stack.Screen options={{ headerShown: false }} name="legal/contact" />
      <Stack.Screen options={{ headerShown: false }} name="legal/accessibility" />
      <Stack.Screen options={{ headerShown: false }} name="legal/faq" />
    </Stack>
  );
}