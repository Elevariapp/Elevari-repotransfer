import { NextResponse } from 'next/server';

/**
 * Error ingestion endpoint (same-origin, allowed by CSP connect-src 'self').
 *
 * Forwards to OBSERVABILITY_WEBHOOK_URL when configured (Sentry relay, log
 * drain, Slack…). Otherwise emits a structured log line so errors are never
 * silently lost.
 */
export const dynamic = 'force-dynamic';

const MAX_BODY = 16_000;

export async function POST(request: Request) {
  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payload = {
    source: 'web',
    receivedAt: new Date().toISOString(),
    ...(typeof body === 'object' && body !== null ? body : { message: String(body) }),
  };

  const target = process.env.OBSERVABILITY_WEBHOOK_URL;
  if (target) {
    const token = process.env.OBSERVABILITY_WEBHOOK_TOKEN;
    try {
      await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      console.error('[observability] forward failed', JSON.stringify({ receivedAt: payload.receivedAt }));
    }
  } else {
    console.error('[observability]', JSON.stringify(payload));
  }

  return NextResponse.json({ ok: true });
}
