import { Stack } from 'expo-router';
import { colors } from '@/lib/design-tokens';

export default function HostLayout() {
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
      <Stack.Screen options={{ title: 'Panel de anfitrión' }} name="index" />
      <Stack.Screen options={{ title: 'Mis propiedades' }} name="properties" />
      <Stack.Screen options={{ title: 'Nueva propiedad' }} name="property/new" />
    </Stack>
  );
}
