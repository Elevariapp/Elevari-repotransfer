'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/observability';

/**
 * Captures unhandled client errors and unhandled promise rejections and sends
 * them to /api/observability. Render errors are captured by app/global-error.tsx.
 */
export default function ObservabilityProvider() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportError(event.error ?? event.message, {
        level: 'error',
        tags: { source: 'window.error' },
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, {
        level: 'error',
        tags: { source: 'unhandledrejection' },
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
