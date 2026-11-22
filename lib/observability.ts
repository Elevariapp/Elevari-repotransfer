/**
 * Client-side error reporting (vendor-neutral).
 *
 * Sends a compact payload to the same-origin ingestion endpoint
 * `/api/observability`, which forwards it to the configured provider
 * (Sentry relay, log drain, Slack webhook…) or logs it structured.
 *
 * No-op on the server and never throws: telemetry must not break the product.
 */

export type ObservabilityContext = {
  level?: 'error' | 'warn' | 'info';
  route?: string;
  tags?: Record<string, string | number | boolean | undefined>;
};

type Payload = {
  message: string;
  stack?: string;
  name?: string;
  route: string;
  level: 'error' | 'warn' | 'info';
  tags: Record<string, string | number | boolean | undefined>;
  userAgent: string;
  timestamp: string;
};

let sent = 0;
const MAX_PER_PAGE = 20;

export function reportError(error: unknown, context: ObservabilityContext = {}): void {
  if (typeof window === 'undefined') return;
  if (sent >= MAX_PER_PAGE) return;
  sent += 1;

  const err = error instanceof Error ? error : new Error(String(error));
  const payload: Payload = {
    message: err.message.slice(0, 500),
    stack: err.stack?.slice(0, 4000),
    name: err.name,
    route: context.route ?? window.location.pathname,
    level: context.level ?? 'error',
    tags: context.tags ?? {},
    userAgent: navigator.userAgent.slice(0, 200),
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/observability', blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  void fetch('/api/observability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* never surface telemetry failures */
  });
}
