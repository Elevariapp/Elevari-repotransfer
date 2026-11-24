import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import {
  notificationHref,
  refreshUnreadCount,
  registerForPushNotifications,
  subscribeToNotificationTaps,
} from '@/lib/notifications';
import { useAppStore } from '@/lib/store';

// A tap that launches the app can arrive before the navigator is ready: try once more shortly after,
// and otherwise stay where we are instead of crashing.
function openFromPush(type: string | null): void {
  const href = notificationHref(type ?? '');
  try {
    router.push(href);
  } catch {
    setTimeout(() => {
      try {
        router.push(href);
      } catch {
        // The user simply lands on the home screen.
      }
    }, 800);
  }
}

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
    // Host pushes (new or cancelled booking) open the host area; the rest open the traveller's trips.
    const unsubscribeTaps = subscribeToNotificationTaps(({ type }) => openFromPush(type));

    return () => {
      subscription.remove();
      unsubscribeTaps();
    };
  }, [userId]);

  return null;
}
