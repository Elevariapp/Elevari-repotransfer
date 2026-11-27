import { prisma } from './prisma.js';
import { resolveNotificationPreferences, type PushPreferenceKey } from './notification-prefs.js';
import { fcmConfigured, sendFcm } from './fcm.js';

/** Tokens the mobile app gets from Expo: ExponentPushToken[...] on older SDKs, ExpoPushToken[...] on newer ones. */
export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$/;

/**
 * Native FCM registration tokens (`getDevicePushTokenAsync` on Android in a bare/prebuild APK).
 * They are long and contain `:` separators, which the Expo pattern never does.
 */
export const FCM_TOKEN_PATTERN = /^[A-Za-z0-9_:\-]{100,}$/;

const DEFAULT_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_MESSAGES_PER_REQUEST = 100;
const REQUEST_TIMEOUT_MS = 10_000;

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  sent: number;
  reason?: 'no_recipient' | 'opted_out' | 'no_devices' | 'provider_error';
}

interface ExpoTicket {
  status?: string;
  details?: { error?: string };
}

/**
 * Sends one push notification to every device the user registered, if they did not switch that
 * category off. Best effort by design: e-mail is the reliable channel, so this never throws, never
 * retries and never logs a token. Devices Expo reports as gone are forgotten.
 */
export async function sendPushToUser(
  userId: string,
  category: PushPreferenceKey,
  message: PushMessage,
): Promise<PushResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true, notificationPrefs: true, pushTokens: { select: { token: true } } },
    });
    if (!user || user.deletedAt) return { sent: 0, reason: 'no_recipient' };
    if (!resolveNotificationPreferences(user.notificationPrefs).push[category]) {
      return { sent: 0, reason: 'opted_out' };
    }

    const allTokens = user.pushTokens.map((entry) => entry.token);
    const expoTokens = allTokens.filter((token) => EXPO_PUSH_TOKEN_PATTERN.test(token));
    const nativeTokens = allTokens.filter((token) => FCM_TOKEN_PATTERN.test(token));
    if (expoTokens.length === 0 && nativeTokens.length === 0) return { sent: 0, reason: 'no_devices' };

    // Expo covers Expo Go and store builds; FCM covers the bare Android APK/AAB built in CI.
    const [expoResult, fcmResult] = await Promise.all([
      expoTokens.length > 0 ? deliver(expoTokens, message) : Promise.resolve<PushResult>({ sent: 0 }),
      nativeTokens.length > 0 && fcmConfigured()
        ? sendFcm(nativeTokens, message)
        : Promise.resolve({ sent: 0, gone: [] as string[], failed: false }),
    ]);

    if (fcmResult.gone.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: fcmResult.gone } } });
    }

    const sent = expoResult.sent + fcmResult.sent;
    if (sent === 0 && (expoResult.reason === 'provider_error' || fcmResult.failed)) {
      return { sent: 0, reason: 'provider_error' };
    }
    return { sent };
  } catch (err) {
    console.error('[push] unexpected failure', { error: err instanceof Error ? err.name : 'unknown' });
    return { sent: 0, reason: 'provider_error' };
  }
}

async function deliver(tokens: string[], message: PushMessage): Promise<PushResult> {
  const url = process.env.EXPO_PUSH_API_URL?.trim() || DEFAULT_PUSH_URL;
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let sent = 0;
  let failed = false;
  const gone: string[] = [];

  for (let offset = 0; offset < tokens.length; offset += MAX_MESSAGES_PER_REQUEST) {
    const chunk = tokens.slice(offset, offset + MAX_MESSAGES_PER_REQUEST);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(
          chunk.map((to) => ({
            to,
            title: message.title,
            body: message.body,
            data: message.data,
            sound: 'default',
            channelId: 'default',
            priority: 'high',
          })),
        ),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        failed = true;
        console.warn('[push] Expo rejected the request', { status: response.status });
        continue;
      }

      const payload = (await response.json().catch(() => null)) as { data?: ExpoTicket[] } | null;
      const tickets = Array.isArray(payload?.data) ? payload.data : [];
      chunk.forEach((token, index) => {
        const ticket = tickets[index];
        if (ticket?.status === 'ok') sent += 1;
        else if (ticket?.details?.error === 'DeviceNotRegistered') gone.push(token);
      });
    } catch (err) {
      failed = true;
      console.warn('[push] Expo unreachable', { error: err instanceof Error ? err.name : 'unknown' });
    }
  }

  if (gone.length > 0) {
    await prisma.pushToken.deleteMany({ where: { token: { in: gone } } });
  }

  return sent === 0 && failed ? { sent, reason: 'provider_error' } : { sent };
}
