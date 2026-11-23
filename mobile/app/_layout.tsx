import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppEffects } from '@/components/AppEffects';
import { bootstrapSession } from '@/lib/session';
import { useAppStore } from '@/lib/store';

// Keep the native splash screen up until the saved session has been restored.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const isLoading = useAppStore((state) => state.isLoading);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => undefined);
  }, [isLoading]);

  // Which group a user may see is decided by the guards in each group's layout.
  return (
    <>
      <StatusBar style="dark" />
      <AppEffects />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}