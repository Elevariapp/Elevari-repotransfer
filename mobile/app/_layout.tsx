import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/lib/store';
import { authStorage } from '@/lib/auth';
import { api } from '@/lib/api';
import { endSession } from '@/lib/session';
import type { User } from '@/types';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { setLoading, setUser, isAuthenticated, user } = useAppStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await authStorage.getToken();
        const storedUser = await authStorage.getUser();
        if (token && storedUser) {
          setUser(storedUser);
          // Refresh the profile in the background; a 401 clears the session (see lib/api.ts).
          api
            .get<{ user: User | null }>('/auth/me')
            .then(async ({ user: freshUser }) => {
              if (freshUser) {
                await authStorage.setUser(freshUser);
                setUser(freshUser);
              } else {
                await endSession();
              }
            })
            .catch(() => {});
        } else if (token || storedUser) {
          await endSession();
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }
    bootstrap();
  }, [setLoading, setUser]);

  if (!isReady) return null;

  const canHost = user?.role === 'host' || user?.role === 'admin';

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(guest)" />
          <Stack.Protected guard={canHost}>
            <Stack.Screen name="host" />
          </Stack.Protected>
        </Stack.Protected>
      </Stack>
    </>
  );
}
