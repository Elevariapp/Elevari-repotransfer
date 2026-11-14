'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const LOAD_TIMEOUT_MS = 15_000;

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
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const [widgetReady, setWidgetReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const destroyWidget = useCallback(() => {
    if (widgetIdRef.current && window.turnstile?.remove) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        /* ignore */
      }
    }
    widgetIdRef.current = null;
    setWidgetReady(false);
    onTokenRef.current('');
  }, []);

  const mountWidget = useCallback((): boolean => {
    if (!SITE_KEY || !containerRef.current || widgetIdRef.current || !window.turnstile?.render) {
      return Boolean(widgetIdRef.current);
    }

    const run = () => {
      if (!containerRef.current || widgetIdRef.current) return;
      try {
        widgetIdRef.current = window.turnstile!.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          appearance: 'always',
          size: 'normal',
          callback: (token: string) => {
            setLoadError(false);
            onTokenRef.current(token);
          },
          'expired-callback': () => {
            onExpireRef.current?.();
            onTokenRef.current('');
          },
          'error-callback': () => {
            setLoadError(true);
            onTokenRef.current('');
          },
        });
        setWidgetReady(true);
        setLoadError(false);
      } catch {
        setLoadError(true);
      }
    };

    try {
      if (typeof window.turnstile.ready === 'function') {
        window.turnstile.ready(run);
      } else {
        run();
      }
    } catch {
      run();
    }

    return Boolean(widgetIdRef.current);
  }, []);

  useEffect(() => {
    setLoadError(false);
    destroyWidget();

    const started = Date.now();
    const poll = window.setInterval(() => {
      if (mountWidget()) {
        window.clearInterval(poll);
        return;
      }
      if (Date.now() - started >= LOAD_TIMEOUT_MS) {
        window.clearInterval(poll);
        setLoadError(true);
      }
    }, 100);

    return () => window.clearInterval(poll);
  }, [resetKey, destroyWidget, mountWidget]);

  useEffect(() => () => destroyWidget(), [destroyWidget]);

  const handleRetry = () => {
    setLoadError(false);
    destroyWidget();
    window.setTimeout(() => mountWidget(), 50);
  };

  if (!SITE_KEY) return null;

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-medium text-elevari-muted">Verificación de seguridad</p>
      {!widgetReady && !loadError && (
        <p className="rounded-xl border border-elevari-border bg-elevari-ivory/60 px-3 py-2 text-center text-xs text-elevari-muted">
          Cargando verificación…
        </p>
      )}
      <Script
        src={TURNSTILE_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => mountWidget()}
        onError={() => setLoadError(true)}
      />
      <div ref={containerRef} className="flex min-h-[65px] justify-center" />
      {loadError && (
        <div className="space-y-2">
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
            No se pudo cargar la verificación. En Cloudflare Turnstile añade{' '}
            <strong>eleveri.app</strong> y <strong>www.eleveri.app</strong>.
          </p>
          <button type="button" onClick={handleRetry} className="wana-btn-ghost w-full min-h-[44px] text-xs">
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
