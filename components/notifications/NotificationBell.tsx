'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  markAllNotificationsRead,
  markNotificationsRead,
  refreshNotifications,
  useNotifications,
} from '@/hooks/useNotifications';
import type { AppNotification } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/format';

const PANEL_ID = 'elevari-notifications-panel';

function destinationFor(item: AppNotification): string {
  switch (item.type) {
    case 'booking_confirmed':
      return item.booking_id ? `/checkout/${item.booking_id}/success` : '/account';
    case 'payment_failed':
      return item.booking_id ? `/checkout/${item.booking_id}` : '/account/payments';
    case 'host_new_booking':
    case 'host_booking_cancelled':
      return '/host';
    case 'password_changed':
      return '/account/security';
    default:
      return '/account';
  }
}

/** Account notifications for signed-in users. Renders nothing for visitors. */
export default function NotificationBell() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { items, seen, unread, status } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!userId) return null;

  const toggle = () => {
    if (!open) void refreshNotifications(userId);
    setOpen((value) => !value);
  };

  const label = unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones';

  return (
    // Below sm the panel anchors to the header itself so it can span the screen width.
    <div ref={wrapperRef} className="sm:relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        className="elevari-header-menu-btn relative"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5zM10 19a2 2 0 004 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-elevari-amber px-1 text-[10px] font-bold leading-none text-elevari-forest-deep ring-2 ring-[#9a340e]"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          id={PANEL_ID}
          aria-label="Notificaciones"
          className="elevari-dropdown-panel absolute inset-x-3 top-full z-50 mt-2 flex max-h-[min(70dvh,32rem)] flex-col !p-0 sm:inset-x-auto sm:right-0 sm:mt-3 sm:w-[22rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-elevari-border px-4 py-3">
            <h2 className="text-sm font-semibold text-elevari-slate">Notificaciones</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="min-h-[44px] text-xs font-semibold text-elevari-forest hover:text-elevari-forest-deep"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {status === 'loading' && items.length === 0 && (
              <div className="space-y-3 p-4 animate-pulse" aria-busy="true" aria-label="Cargando notificaciones">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-elevari-sand" />
                ))}
              </div>
            )}

            {status === 'error' && items.length === 0 && (
              <div role="alert" className="px-4 py-8 text-center">
                <p className="text-sm text-elevari-muted">No pudimos cargar tus notificaciones.</p>
                <button
                  type="button"
                  onClick={() => void refreshNotifications(userId, true)}
                  className="mt-3 min-h-[44px] text-sm font-semibold text-elevari-forest"
                >
                  Reintentar
                </button>
              </div>
            )}

            {status === 'ready' && items.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-elevari-slate">Estás al día</p>
                <p className="mt-1 text-sm leading-relaxed text-elevari-muted">
                  Aquí verás avisos de tus reservas, pagos y cambios en tu cuenta.
                </p>
              </div>
            )}

            {items.length > 0 && (
              <ul className="divide-y divide-elevari-border">
                {items.map((item) => {
                  const isUnread = !seen.has(item.id);
                  return (
                    <li key={item.id}>
                      <Link
                        href={destinationFor(item)}
                        onClick={() => {
                          markNotificationsRead([item.id]);
                          setOpen(false);
                        }}
                        className="flex min-h-[56px] gap-3 px-4 py-3 transition hover:bg-elevari-ivory/60 focus-visible:bg-elevari-ivory/60"
                      >
                        <span
                          aria-hidden
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? 'bg-elevari-forest' : 'bg-transparent'}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm text-elevari-slate ${isUnread ? 'font-semibold' : 'font-medium'}`}
                          >
                            {item.title}
                            {isUnread && <span className="sr-only"> (sin leer)</span>}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-elevari-muted">
                            {item.body}
                          </span>
                          <span className="mt-1 block text-xs text-elevari-muted">
                            {formatRelativeTime(item.created_at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
