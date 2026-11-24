'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/cx';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_ID = 'elevari-turnstile-api';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const LOAD_TIMEOUT_MS = 12_000;
// The 300px widget does not fit inside the auth card on the narrowest phones.
const COMPACT_BELOW_PX = 340;

type Status = 'loading' | 'ready' | 'error';

let pendingLoad: Promise<void> | null = null;

/** Loads Cloudflare's script once. A failed attempt leaves nothing behind, so retrying injects a fresh tag. */
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile?.render) return Promise.resolve();
  if (pendingLoad) return pendingLoad;

  document.getElementById(SCRIPT_ID)?.remove();
  const attempt = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    let timer = 0;
    const fail = (reason: string) => {
      window.clearTimeout(timer);
      script.remove();
      reject(new Error(reason));
    };
    timer = window.setTimeout(() => fail('timeout'), LOAD_TIMEOUT_MS);
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.turnstile?.render) resolve();
      else fail('unavailable');
    };
    script.onerror = () => fail('network');
    document.head.appendChild(script);
  });
  pendingLoad = attempt;
  attempt.catch(() => {
    if (pendingLoad === attempt) pendingLoad = null;
  });
  return attempt;
}

export default function TurnstileWidget({
  onToken,
  onExpire,
  resetKey = 0,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  }, [onToken, onExpire]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    let widgetId: string | null = null;
    setStatus('loading');
    onTokenRef.current('');

    const render = () => {
      const container = containerRef.current;
      if (cancelled || !container || !window.turnstile) return;
      try {
        widgetId = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
          appearance: 'always',
          size: window.innerWidth < COMPACT_BELOW_PX ? 'compact' : 'normal',
          callback: (token: string) => {
            setStatus('ready');
            onTokenRef.current(token);
          },
          'expired-callback': () => {
            onExpireRef.current?.();
            onTokenRef.current('');
          },
          'error-callback': () => {
            setStatus('error');
            onTokenRef.current('');
            // Handled here: stops Cloudflare from also printing the failure to the console.
            return true;
          },
        });
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    };

    loadTurnstileScript()
      .then(() => {
        if (typeof window.turnstile?.ready === 'function') window.turnstile.ready(render);
        else render();
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          /* the widget is already gone */
        }
      }
    };
  }, [resetKey, attempt]);

  if (!SITE_KEY) return null;

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-medium text-elevari-muted">Verificación de seguridad</p>
      <div className={cx('relative', status !== 'error' && 'min-h-[65px]')}>
        <div ref={containerRef} className="flex justify-center" />
        {status === 'loading' && (
          <p
            role="status"
            className="absolute inset-0 flex items-center justify-center rounded-xl border border-elevari-border bg-elevari-ivory/60 px-3 text-center text-xs text-elevari-muted"
          >
            Cargando verificación…
          </p>
        )}
      </div>
      {status === 'error' && (
        <div className="space-y-2">
          <p
            role="alert"
            className="rounded-xl border border-elevari-amber/40 bg-elevari-warning-soft px-3 py-2 text-center text-xs text-elevari-amber-ink"
          >
            No pudimos cargar la verificación de seguridad. Revisa tu conexión o desactiva el bloqueador de
            contenido para este sitio y vuelve a intentarlo.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="elevari-btn-ghost min-h-[44px] w-full text-xs"
          >
            Reintentar verificación
          </button>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void;
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}
