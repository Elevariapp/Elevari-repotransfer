/**
 * Firebase Cloud Messaging (HTTP v1) transport.
 *
 * Expo push only reaches devices through Expo's service; a bare APK/AAB (what `Mobile APK`
 * builds) needs a direct FCM send. This module mints a Google access token from the service
 * account in `FIREBASE_SERVICE_ACCOUNT_JSON` / `FIREBASE_SERVICE_ACCOUNT_BASE64` and posts to
 * `https://fcm.googleapis.com/v1/projects/<project>/messages:send`.
 *
 * No npm dependency: the assertion is an RS256 JWT signed with `node:crypto`.
 * When no service account is configured, `fcmConfigured()` is false and push falls back to Expo.
 */
import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const REQUEST_TIMEOUT_MS = 10_000;

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  private_key_id?: string;
}

let cachedAccount: ServiceAccount | null | undefined;
let cachedToken: { value: string; expiresAt: number } | null = null;

export function loadServiceAccount(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount;

  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim(), 'base64').toString('utf8')
      : '');

  if (!raw) {
    cachedAccount = null;
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      cachedAccount = null;
      return null;
    }
    cachedAccount = parsed;
    return parsed;
  } catch {
    console.warn('[fcm] service account JSON is not valid; push falls back to Expo');
    cachedAccount = null;
    return null;
  }
}

export function fcmConfigured(): boolean {
  return loadServiceAccount() !== null;
}

const base64url = (value: unknown) =>
  Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

/** Exposed for tests: builds the signed JWT Google exchanges for an access token. */
export function buildAssertion(account: ServiceAccount, now = Math.floor(Date.now() / 1000)): string {
  const header = { alg: 'RS256', typ: 'JWT', ...(account.private_key_id ? { kid: account.private_key_id } : {}) };
  const payload = { iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const unsigned = `${base64url(header)}.${base64url(payload)}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url');
  return `${unsigned}.${signature}`;
}

async function accessToken(account: ServiceAccount): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: buildAssertion(account),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
    if (!response.ok || !body?.access_token) {
      console.warn('[fcm] token request failed', { status: response.status });
      return null;
    }
    cachedToken = {
      value: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };
    return cachedToken.value;
  } catch (err) {
    console.warn('[fcm] token request unreachable', { error: err instanceof Error ? err.name : 'unknown' });
    return null;
  }
}

export interface FcmMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FcmResult {
  sent: number;
  /** Tokens FCM reported as no longer valid (uninstalled app, wiped device). */
  gone: string[];
  failed: boolean;
}

/** Sends one notification to every given FCM device token. Never throws. */
export async function sendFcm(
  tokens: string[],
  message: FcmMessage,
  account = loadServiceAccount(),
): Promise<FcmResult> {
  if (!account || tokens.length === 0) return { sent: 0, gone: [], failed: false };

  const token = await accessToken(account);
  if (!token) return { sent: 0, gone: [], failed: true };

  const url = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
  let sent = 0;
  let failed = false;
  const gone: string[] = [];

  for (const deviceToken of tokens) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: deviceToken,
            notification: { title: message.title, body: message.body },
            data: message.data,
            android: { priority: 'HIGH', notification: { channel_id: 'default' } },
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        sent += 1;
        continue;
      }

      const body = (await response.json().catch(() => null)) as { error?: { status?: string } } | null;
      const status = body?.error?.status ?? '';
      if (status === 'NOT_FOUND' || status === 'INVALID_ARGUMENT') gone.push(deviceToken);
      else failed = true;
    } catch (err) {
      failed = true;
      console.warn('[fcm] send unreachable', { error: err instanceof Error ? err.name : 'unknown' });
    }
  }

  return { sent, gone, failed };
}
