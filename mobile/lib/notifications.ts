import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authStorage } from './auth';
import { api } from './api';

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
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Notification permissions not granted');
      return;
    }

    // Get and register push token
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'wana-mobile',
      });
      this.expoPushToken = token.data;
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, this.expoPushToken);

      // Register token with backend if authenticated
      const tokenStored = await authStorage.getToken();
      if (tokenStored && this.expoPushToken) {
        await this.registerPushToken(this.expoPushToken);
      }
    } catch (error) {
      console.error('[Push] Failed to get push token:', error);
    }
  }

  async getStoredPushToken(): Promise<string | null> {
    if (this.expoPushToken) return this.expoPushToken;
    const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    this.expoPushToken = stored;
    return stored;
  }

  async registerPushToken(pushToken: string) {
    try {
      await api.post('/mobile/push/register', { pushToken });
    } catch (error) {
      console.error('[Push] Failed to register token with backend:', error);
    }
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