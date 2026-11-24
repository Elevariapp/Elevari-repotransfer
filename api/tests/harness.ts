/**
 * Integration harness: the real Fastify app against a real PostgreSQL database, with a local
 * HTTP server standing in for Resend so every e-mail the API sends can be inspected.
 *
 *   TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/elevari_test npm test
 *
 * The migrations must already be applied (`DATABASE_URL=... npx prisma migrate deploy`). Without
 * TEST_DATABASE_URL the integration suites are skipped. Only a local database is accepted: these
 * tests create and modify users, so they must never run against a shared or production database.
 */
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

const rawUrl = process.env.TEST_DATABASE_URL ?? '';

function isLocalDatabase(url: string): boolean {
  try {
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

export const hasTestDatabase = isLocalDatabase(rawUrl);
export const skipReason = rawUrl
  ? 'TEST_DATABASE_URL must point to a local database'
  : 'set TEST_DATABASE_URL to run the integration tests';

export interface CapturedEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  headers: Record<string, unknown>;
}

export type MailMode = 'ok' | 'fail' | 'slow';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: 'guest' | 'host';
}

export interface TestStack {
  app: FastifyInstance;
  prisma: typeof import('../src/lib/prisma.js').prisma;
  emails: CapturedEmail[];
  setMailMode(mode: MailMode): void;
  call<T = any>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    options?: { token?: string; body?: unknown; ip?: string },
  ): Promise<{ status: number; body: T; headers: Record<string, unknown>; ms: number }>;
  registerUser(options?: { role?: 'guest' | 'host'; name?: string; password?: string }): Promise<TestUser>;
  waitForEmail(predicate: (email: CapturedEmail) => boolean, timeoutMs?: number): Promise<CapturedEmail>;
  stop(): Promise<void>;
}

let ipCounter = 1;
/** Every request gets its own client address, so the per-IP rate limits never couple tests together. */
export function freshIp(): string {
  ipCounter += 1;
  return `10.${Math.floor(ipCounter / 65000) % 250}.${Math.floor(ipCounter / 250) % 250}.${(ipCounter % 250) + 1}`;
}

export async function startStack(): Promise<TestStack> {
  const emails: CapturedEmail[] = [];
  let mode: MailMode = 'ok';

  const resend: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      const send = (status: number, payload: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(payload));
      };
      if (req.method !== 'POST' || req.url !== '/emails') return send(404, { message: 'not found' });
      if (mode === 'fail') return send(500, { name: 'application_error', message: 'mock failure' });
      if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 1500));
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as CapturedEmail;
      emails.push(payload);
      return send(200, { id: `mock_${emails.length}` });
    });
  });
  await new Promise<void>((resolve) => resend.listen(0, '127.0.0.1', resolve));
  const resendPort = (resend.address() as AddressInfo).port;

  process.env.DATABASE_URL = rawUrl;
  process.env.JWT_SECRET ??= 'integration_test_jwt_secret_with_32_plus_chars';
  process.env.RESEND_API_KEY = 're_integration_test_key';
  process.env.RESEND_API_URL = `http://127.0.0.1:${resendPort}`;
  process.env.PUBLIC_SITE_URL = 'https://elevari.test';
  process.env.TURNSTILE_DISABLED = '1';
  process.env.PAYMENTS_MODE = 'mock';
  process.env.LOG_LEVEL = 'silent';
  process.env.NODE_ENV = 'test';

  const { buildApp } = await import('../src/app.js');
  const { prisma } = await import('../src/lib/prisma.js');
  const app = await buildApp();
  await app.ready();

  const call: TestStack['call'] = async (method, path, options = {}) => {
    const started = performance.now();
    const response = await app.inject({
      method,
      url: `/api/v1${path}`,
      headers: {
        'x-forwarded-for': options.ip ?? freshIp(),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      payload: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    let body: any = null;
    try {
      body = response.json();
    } catch {
      body = response.body;
    }
    return {
      status: response.statusCode,
      body,
      headers: response.headers as Record<string, unknown>,
      ms: Math.round(performance.now() - started),
    };
  };

  const waitForEmail: TestStack['waitForEmail'] = async (predicate, timeoutMs = 4000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const found = emails.find(predicate);
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error('Timed out waiting for an e-mail');
  };

  const registerUser: TestStack['registerUser'] = async ({ role = 'guest', name = 'Test User', password } = {}) => {
    const chosenPassword = password ?? 'ClaveSegura#2026';
    const email = `it.${randomUUID()}@example.test`;
    const response = await call<{ token: string; user: { id: string } }>('POST', '/auth/register', {
      body: { email, password: chosenPassword, name, role },
    });
    if (response.status !== 201) throw new Error(`register failed: ${response.status} ${JSON.stringify(response.body)}`);
    return { id: response.body.user.id, email, password: chosenPassword, token: response.body.token, role };
  };

  return {
    app,
    prisma,
    emails,
    setMailMode(next) {
      mode = next;
    },
    call,
    registerUser,
    waitForEmail,
    async stop() {
      await app.close();
      await prisma.$disconnect();
      resend.closeAllConnections();
      await new Promise<void>((resolve) => resend.close(() => resolve()));
    },
  };
}

/** Pulls the `token` query parameter out of the first link in an e-mail that points at `pathname`. */
export function linkToken(email: CapturedEmail, pathname: string): string | null {
  const match = email.html.match(new RegExp(`href="([^"]*${pathname}[^"]*)"`));
  if (!match) return null;
  return new URL(match[1].replace(/&amp;/g, '&')).searchParams.get('token');
}
