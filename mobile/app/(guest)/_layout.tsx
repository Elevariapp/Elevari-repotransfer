import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { mobileNotificationService } from '@/lib/notifications';
import { colors } from '@/lib/design-tokens';

export default function GuestLayout() {
  useEffect(() => {
    mobileNotificationService.initialize().catch(() => {});
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.ivory },
        headerTintColor: colors.forest,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.ivory },
      }}
    >
      <Stack.Screen options={{ headerShown: false }} name="index" />
      <Stack.Screen options={{ title: 'Propiedad' }} name="property/[slug]" />
      <Stack.Screen options={{ title: 'Cotización' }} name="quote" />
      <Stack.Screen options={{ title: 'Pago' }} name="checkout/[bookingId]" />
      <Stack.Screen options={{ headerShown: false }} name="checkout/[bookingId]/success" />
      <Stack.Screen options={{ title: 'Mis reservas' }} name="my-bookings" />
      <Stack.Screen options={{ title: 'Perfil' }} name="profile" />
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
