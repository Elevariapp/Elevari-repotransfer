'use client';

import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';

/** Shared loading / error / empty states for the lists under /account. */
export function ListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Cargando">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-elevari-sand" />
      ))}
    </div>
  );
}

export function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="elevari-card p-6 text-center">
      <p className="text-sm text-elevari-error">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
        Reintentar
      </Button>
    </div>
  );
}

export function ListNote({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 rounded-xl border border-elevari-border bg-elevari-ivory/60 px-4 py-3 text-sm leading-relaxed text-elevari-muted">
      {children}
    </p>
  );
}
