import { prisma } from './prisma.js';
import { resolveNotificationPreferences, type PushPreferenceKey } from './notification-prefs.js';

/** Tokens the mobile app gets from Expo: ExponentPushToken[...] on older SDKs, ExpoPushToken[...] on newer ones. */
export const EXPO_PUSH_TOKEN_PATTERN = /^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$/;

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

    const tokens = user.pushTokens.map((entry) => entry.token).filter((token) => EXPO_PUSH_TOKEN_PATTERN.test(token));
    if (tokens.length === 0) return { sent: 0, reason: 'no_devices' };

    return await deliver(tokens, message);
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
