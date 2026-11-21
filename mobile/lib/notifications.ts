import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { getEasProjectId } from './config';

const PUSH_TOKEN_KEY = 'push_token';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class MobileNotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Remote push needs a real EAS project id; without it skip silently.
    const projectId = getEasProjectId();
    if (!projectId) {
      if (__DEV__) console.warn('[Push] No valid EAS project id configured; skipping push token.');
      return;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.warn('[Push] Notification permissions not granted');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      this.expoPushToken = token.data;
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, this.expoPushToken);

      // TODO: the API has no endpoint to register device push tokens yet. Once one exists
      // (e.g. POST /api/v1/push/register), send `this.expoPushToken` to it here for
      // authenticated users. Until then the token is only stored locally.
    } catch (error) {
      if (__DEV__) console.warn('[Push] Failed to get push token:', error);
    }
  }

  async getStoredPushToken(): Promise<string | null> {
    if (this.expoPushToken) return this.expoPushToken;
    const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    this.expoPushToken = stored;
    return stored;
  }

  async sendLocalNotification(payload: PushNotificationPayload) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
      trigger: null, // immediate
    });
  }

  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  async addNotificationListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  async addResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const mobileNotificationService = new MobileNotificationService();
