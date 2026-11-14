'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '@/lib/cx';

/**
 * Accessible modal: role=dialog, aria-modal, Escape to close, focus moved on open,
 * background scroll locked. Visual tokens come from the design system.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-elevari-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="elevari-modal-title"
        tabIndex={-1}
        className={cx(
          'relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--elevari-radius-xl)] bg-elevari-surface p-6 shadow-[var(--elevari-shadow-modal)] outline-none sm:max-w-lg sm:rounded-[var(--elevari-radius-xl)]',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="elevari-modal-title" className="font-display text-xl font-semibold text-elevari-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-elevari-border text-elevari-muted transition hover:border-elevari-forest hover:text-elevari-forest"
          >
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}
