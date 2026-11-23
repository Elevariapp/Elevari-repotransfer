import { Redirect, Stack } from 'expo-router';
import { homeHref } from '@/lib/routes';
import { useAppStore } from '@/lib/store';

export default function AuthLayout() {
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);

  if (isLoading) return null;
  // Signed-in users never see the login screens.
  if (user) return <Redirect href={homeHref(user.role)} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}