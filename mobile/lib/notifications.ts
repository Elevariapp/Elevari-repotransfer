import Constants from 'expo-constants';
import type { NotificationResponse } from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';
import { useAppStore } from './store';
import type {
  AppNotification,
  NotificationPreferences,
  NotificationPreferencesPatch,
  NotificationsResponse,
} from './types';

type NotificationsModule = typeof import('expo-notifications');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERMISSION_ASKED_KEY = 'push_permission_asked';
const PUSH_TOKEN_KEY = 'push_token_registered';
const ANDROID_CHANNEL_ID = 'default';
// Signing out must never feel stuck because the server is slow to answer.
const UNREGISTER_TIMEOUT_MS = 3000;

let notificationsModule: Promise<NotificationsModule | null> | null = null;
let handlerInstalled = false;
let lastRegistration: string | null = null;
let lastHandledTap: string | null = null;

// The native module is loaded lazily so that a missing/broken push setup can never break app start.
function loadNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  notificationsModule ??= import('expo-notifications').then(
    (module) => module,
    () => null,
  );
  return notificationsModule;
}

// Push tokens can only be issued for a real EAS project id (a UUID).
export function getEasProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined;
  const candidates: unknown[] = [extra?.eas?.projectId, Constants.easConfig?.projectId];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && UUID.test(candidate)) return candidate;
  }
  return null;
}

function installHandler(Notifications: NotificationsModule): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      // `shouldShowAlert` is the legacy flag, `shouldShowBanner`/`shouldShowList` its replacements.
      const behavior = {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
      return behavior;
    },
  });
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;

  // Ask at most once; a denial is respected and never nagged about.
  const alreadyAsked = await SecureStore.getItemAsync(PERMISSION_ASKED_KEY).catch(() => null);
  if (alreadyAsked) return false;
  await SecureStore.setItemAsync(PERMISSION_ASKED_KEY, '1').catch(() => undefined);

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Registers this device for push notifications. Every failure is silent: push is optional.
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    const projectId = getEasProjectId();
    if (!projectId || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;

    const Notifications = await loadNotifications();
    if (!Notifications) return;

    installHandler(Notifications);

    // Android 13+ needs the channel to exist before the permission prompt is shown.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Elevari',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C2410C',
      });
    }

    if (!(await ensurePermission(Notifications))) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    // Register BOTH transports. Expo push covers Expo Go and store builds; the bare APK built in
    // CI is served by our own FCM transport (api/src/lib/fcm.ts), which needs the native device
    // token. Whichever path delivers first wins, so a device never silently has no notifications.
    const tokens = new Set<string>([token]);
    if (Platform.OS === 'android') {
      try {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        if (typeof deviceToken?.data === 'string' && deviceToken.data) tokens.add(deviceToken.data);
      } catch {
        // Firebase missing from this build: Expo push remains the transport.
      }
    }

    const registrationKey = `${userId}:${[...tokens].sort().join(',')}`;
    if (registrationKey === lastRegistration) return;

    for (const value of tokens) {
      await api.post('/notifications/push-token', { token: value, platform: Platform.OS });
    }
    lastRegistration = registrationKey;
    // Remembered so that signing out can stop pushes for this device.
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, JSON.stringify([...tokens])).catch(() => undefined);
  } catch {
    // Push registration must never surface errors to the user.
  }
}

// Stops pushes for this device before the session ends: they would otherwise keep arriving for the
// account that just signed out. Best effort and bounded: offline or already-expired sessions skip it,
// and the next sign-in simply moves the token to its new owner.
export async function unregisterPushToken(): Promise<void> {
  lastRegistration = null;
  try {
    const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!stored) return;
    // Stored as a JSON array (Expo token + native FCM token); tolerate the old single-token value.
    const tokens: string[] = (() => {
      try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
      } catch {
        return [stored];
      }
    })();
    for (const token of tokens) {
      await api.post('/notifications/push-token/unregister', { token }, { timeout: UNREGISTER_TIMEOUT_MS });
    }
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch {
    // Non-critical.
  }
}

export interface NotificationTapTarget {
  bookingId: string | null;
  type: string | null;
}

function tapTarget(response: NotificationResponse): NotificationTapTarget {
  const data: unknown = response.notification.request.content.data;
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const bookingId = record.booking_id ?? record.bookingId;
  return {
    bookingId: typeof bookingId === 'string' ? bookingId : null,
    type: typeof record.type === 'string' ? record.type : null,
  };
}

// Calls `onOpen` when the user taps a push notification, including the tap that launched the app.
// Each tap is delivered once, even if the screen that listens is remounted.
export function subscribeToNotificationTaps(onOpen: (target: NotificationTapTarget) => void): () => void {
  if (!getEasProjectId()) return () => undefined;

  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  const deliver = (response: NotificationResponse) => {
    const key = `${response.notification.request.identifier}:${response.notification.date}`;
    if (key === lastHandledTap) return;
    lastHandledTap = key;
    onOpen(tapTarget(response));
  };

  loadNotifications()
    .then((Notifications) => {
      if (!Notifications || cancelled) return;
      const subscription = Notifications.addNotificationResponseReceivedListener(deliver);
      unsubscribe = () => subscription.remove();
      const launchedBy = Notifications.getLastNotificationResponse();
      if (launchedBy) deliver(launchedBy);
    })
    .catch(() => undefined);

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

// --- In-app notification feed: the ids the user has already seen are remembered on the device ---

const HOST_NOTIFICATION_TYPES = new Set(['host_new_booking', 'host_booking_cancelled']);

// Host events open the host bookings tab; everything else relates to the user's own trips.
export function notificationHref(type: string): string {
  return HOST_NOTIFICATION_TYPES.has(type) ? '/(host)/bookings' : '/(guest)/my-bookings';
}

const SEEN_KEY_PREFIX = 'notifications_seen_';
const MAX_SEEN_IDS = 150;

// SecureStore values are limited to ~2 KB and feed ids are long (`event:<uuid>`), so ids are kept
// as short hashes (32-bit FNV-1a in base 36). A collision would at worst hide one unread dot.
function hashId(id: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function seenKey(userId: string): string {
  return `${SEEN_KEY_PREFIX}${userId}`;
}

// Hashes of the seen ids, newest first.
export async function getSeenIds(userId: string): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(seenKey(userId));
    return raw ? raw.split(',').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isUnread(item: AppNotification, seen: ReadonlySet<string>): boolean {
  return !seen.has(hashId(item.id));
}

// Marks everything currently in the feed as seen.
export async function markNotificationsSeen(userId: string, items: AppNotification[]): Promise<void> {
  try {
    const previous = await getSeenIds(userId);
    const merged = Array.from(new Set([...items.map((item) => hashId(item.id)), ...previous]));
    await SecureStore.setItemAsync(seenKey(userId), merged.slice(0, MAX_SEEN_IDS).join(','));
  } catch {
    // The dots simply stay until the next successful save.
  }
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const response = await api.get<NotificationsResponse>('/notifications');
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await api.get<{ preferences: NotificationPreferences }>('/notifications/preferences');
  return response.preferences;
}

export async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
): Promise<NotificationPreferences> {
  const response = await api.patch<{ preferences: NotificationPreferences }>('/notifications/preferences', patch);
  return response.preferences;
}

// Updates the unread badge shown in the profile. Errors (e.g. offline) leave the count untouched.
export async function refreshUnreadCount(userId: string): Promise<void> {
  try {
    const [items, seen] = await Promise.all([fetchNotifications(), getSeenIds(userId)]);
    const seenSet = new Set(seen);
    useAppStore.getState().setUnreadNotifications(items.filter((item) => isUnread(item, seenSet)).length);
  } catch {
    // Non-critical.
  }
}