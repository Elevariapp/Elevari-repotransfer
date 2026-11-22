import { Stack } from 'expo-router';

export default function HostLayout() {
  return (
    <Stack>
      <Stack.Screen options={{ headerShown: false }} name="index" />
      <Stack.Screen options={{ headerShown: false }} name="properties" />
      <Stack.Screen options={{ headerShown: false }} name="property/new" />
      <Stack.Screen options={{ headerShown: false }} name="bookings" />
      <Stack.Screen options={{ headerShown: false }} name="profile" />
    </Stack>
  );
}