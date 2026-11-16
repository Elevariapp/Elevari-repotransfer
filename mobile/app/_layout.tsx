import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '@/lib/store';
import { authStorage } from '@/lib/auth';
import { colors } from '@/lib/design-tokens';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { isLoading, setLoading, user, setUser, setAuthenticated } = useAppStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await authStorage.getToken();
        const storedUser = await authStorage.getUser();
        if (token && storedUser) {
          setUser(storedUser);
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
        setIsReady(true);
      }
    };
    bootstrap();
  }, []);

  if (!isReady) {
    return (
      <Stack.Screen
        options={{ headerShown: false, statusBarStyle: 'auto' }}
      >
        <StatusBar style="auto" backgroundColor={colors.forest} />
      </Stack.Screen>
    );
  }

  return (
    <Stack>
      {isAuthenticated ? (
        <Stack.Screen
          options={{ headerShown: false }}
          name="(guest)"
        />
      ) : (
        <Stack.Screen
          options={{ headerShown: false }}
          name="(auth)"
        />
      )}
    </Stack>
  );
}