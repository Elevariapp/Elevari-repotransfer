import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';
import { useAppStore } from './store';
import type { AppNotification, NotificationsResponse } from './types';

type NotificationsModule = typeof import('expo-notifications');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERMISSION_ASKED_KEY = 'push_permission_asked';
const ANDROID_CHANNEL_ID = 'default';

let notificationsModule: Promise<NotificationsModule | null> | null = null;
let handlerInstalled = false;
let lastRegistration: string | null = null;

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
    const registrationKey = `${userId}:${token}`;
    if (!token || registrationKey === lastRegistration) return;

    await api.post('/notifications/push-token', { token, platform: Platform.OS });
    lastRegistration = registrationKey;
  } catch {
    // Push registration must never surface errors to the user.
  }
}

// Calls `onOpen` with the related booking id (if any) when the user taps a push notification.
export function subscribeToNotificationTaps(onOpen: (bookingId: string | null) => void): () => void {
  if (!getEasProjectId()) return () => undefined;

  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  loadNotifications()
    .then((Notifications) => {
      if (!Notifications || cancelled) return;
      const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data: unknown = response.notification.request.content.data;
        const raw =
          data && typeof data === 'object'
            ? (data as { booking_id?: unknown; bookingId?: unknown }).booking_id ??
              (data as { bookingId?: unknown }).bookingId
            : null;
        onOpen(typeof raw === 'string' ? raw : null);
      });
      unsubscribe = () => subscription.remove();
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