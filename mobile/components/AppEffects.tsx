import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import {
  refreshUnreadCount,
  registerForPushNotifications,
  subscribeToNotificationTaps,
} from '@/lib/notifications';
import { useAppStore } from '@/lib/store';

// Background work that only makes sense while signed in: push registration and the unread badge.
export function AppEffects() {
  const userId = useAppStore((state) => (state.isAuthenticated ? (state.user?.id ?? null) : null));

  useEffect(() => {
    if (!userId) return undefined;

    void registerForPushNotifications(userId);
    void refreshUnreadCount(userId);

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void refreshUnreadCount(userId);
    });
    const unsubscribeTaps = subscribeToNotificationTaps(() => router.push('/(guest)/my-bookings'));

    return () => {
      subscription.remove();
      unsubscribeTaps();
    };
  }, [userId]);

  return null;
}
