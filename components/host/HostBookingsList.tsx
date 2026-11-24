'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi, type HostBookingRow, type HostBookingScope } from '@/lib/api-client';
import { cx } from '@/lib/cx';
import { formatInstantDate, formatMoney, formatStayDate } from '@/lib/format';
import { hostErrorMessage, isUnauthorized } from './errors';
import HostGate, { SessionExpiredNotice } from './HostGate';

type Tone = Parameters<typeof Badge>[0]['tone'];

const PAGE_SIZE = 20;

const SCOPES: Array<{ value: HostBookingScope; label: string }> = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Pasadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

const EMPTY: Record<HostBookingScope, { title: string; text: string }> = {
  upcoming: {
    title: 'Aún no tienes reservas próximas',
    text: 'Cuando un huésped reserve y pague, la verás aquí y te avisaremos por correo y en la app.',
  },
  past: {
    title: 'Todavía no hay estadías finalizadas',
    text: 'Aquí quedará el historial de las estadías que ya terminaron.',
  },
  cancelled: {
    title: 'No tienes reservas canceladas',
    text: 'Si un huésped cancela una reserva que ya había pagado, la verás aquí.',
  },
};

type ListState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'session-expired' }
  | { kind: 'ready'; rows: HostBookingRow[]; total: number; page: number; hasMore: boolean };

/** Bookings that already ended are "finalizadas" even if the stay was never marked completed. */
export function bookingStatusLabel(scope: HostBookingScope, status: string): { label: string; tone: Tone } {
  if (status === 'cancelled') return { label: 'Cancelada', tone: 'error' };
  if (scope === 'past' || status === 'completed') return { label: 'Finalizada', tone: 'neutral' };
  if (status === 'checked_in') return { label: 'En curso', tone: 'brand' };
  return { label: 'Confirmada', tone: 'success' };
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export default function HostBookingsList() {
  return (
    <HostGate redirectTo="/host/bookings">
      <Bookings />
    </HostGate>
  );
}

function Bookings() {
  const { user } = useAuth();
  const [scope, setScope] = useState<HostBookingScope>('upcoming');
  const [state, setState] = useState<ListState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const activeScope = useRef<HostBookingScope>(scope);

  useEffect(() => {
    let active = true;
    wanaApi
      .listHostBookings({ scope, page: 1, page_size: PAGE_SIZE })
      .then((res) => {
        if (active) {
          setState({
            kind: 'ready',
            rows: res.data,
            total: res.pagination.total,
            page: 1,
            hasMore: res.pagination.has_more,
          });
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState(
          isUnauthorized(err)
            ? { kind: 'session-expired' }
            : { kind: 'error', message: hostErrorMessage(err, 'No pudimos cargar tus reservas.') },
        );
      });
    return () => {
      active = false;
    };
  }, [scope, attempt]);

  const selectScope = (next: HostBookingScope) => {
    if (next === scope) return;
    activeScope.current = next;
    setMoreError(null);
    setLoadingMore(false);
    setState({ kind: 'loading' });
    setScope(next);
  };

  const retry = () => {
    setState({ kind: 'loading' });
    setAttempt((n) => n + 1);
  };

  const loadMore = async () => {
    if (state.kind !== 'ready' || loadingMore) return;
    const requested = scope;
    const page = state.page + 1;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await wanaApi.listHostBookings({ scope: requested, page, page_size: PAGE_SIZE });
      // The tab may have changed while this page was on its way.
      if (activeScope.current !== requested) return;
      setState((current) => {
        if (current.kind !== 'ready') return current;
        const known = new Set(current.rows.map((row) => row.id));
        return {
          kind: 'ready',
          rows: [...current.rows, ...res.data.filter((row) => !known.has(row.id))],
          total: res.pagination.total,
          page,
          hasMore: res.pagination.has_more,
        };
      });
    } catch (err) {
      if (activeScope.current !== requested) return;
      if (isUnauthorized(err)) setState({ kind: 'session-expired' });
      else setMoreError(hostErrorMessage(err, 'No pudimos cargar más reservas.'));
    } finally {
      if (activeScope.current === requested) setLoadingMore(false);
    }
  };

  if (user?.role === 'admin') {
    return (
      <div className="elevari-card p-8 text-center">
        <p className="text-elevari-muted">
          Esta lista muestra las reservas de los espacios de un anfitrión. Como administrador, consulta todas las
          reservas de la plataforma en el panel de administración.
        </p>
        <Link href="/admin" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Ir al panel de administración
        </Link>
      </div>
    );
  }

  if (state.kind === 'session-expired') return <SessionExpiredNotice redirectTo="/host/bookings" />;

  let body;
  if (state.kind === 'loading') {
    body = (
      <div role="status" aria-busy="true" className="space-y-3">
        <span className="sr-only">Cargando tus reservas…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="h-28 animate-pulse rounded-2xl bg-elevari-sand" />
        ))}
      </div>
    );
  } else if (state.kind === 'error') {
    body = (
      <div role="alert" className="elevari-card p-8 text-center">
        <p className="text-elevari-error">{state.message}</p>
        <button type="button" onClick={retry} className="elevari-btn-ghost mt-6 min-h-[44px]">
          Reintentar
        </button>
      </div>
    );
  } else if (state.rows.length === 0) {
    body = (
      <div className="elevari-card p-8 text-center">
        <p className="font-semibold text-elevari-slate">{EMPTY[scope].title}</p>
        <p className="mt-2 text-elevari-muted">{EMPTY[scope].text}</p>
      </div>
    );
  } else {
    body = (
      <>
        <p role="status" className="mb-3 px-1 text-sm text-elevari-muted">
          {plural(state.total, 'reserva', 'reservas')}
        </p>
        <ul className="space-y-3">
          {state.rows.map((row) => {
            const status = bookingStatusLabel(scope, row.status);
            return (
              <li key={row.id} className="elevari-card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-elevari-slate">{row.property.title}</p>
                    <p className="text-sm text-elevari-muted">
                      {row.guest_name ?? 'Huésped'} · {plural(row.guests, 'huésped', 'huéspedes')}
                    </p>
                  </div>
                  <Badge tone={status.tone} className="shrink-0">
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-elevari-muted">
                  {formatStayDate(row.check_in, false)} → {formatStayDate(row.check_out)} ·{' '}
                  {plural(row.nights, 'noche', 'noches')}
                </p>
                {row.host_receives != null && (
                  <p className="mt-1 text-sm font-semibold text-elevari-slate">
                    {row.status === 'cancelled' ? 'Habrías recibido' : 'Recibes'}{' '}
                    {formatMoney(row.host_receives, row.currency)}
                  </p>
                )}
                <p className="mt-1 text-xs text-elevari-muted">Reservada el {formatInstantDate(row.created_at)}</p>
              </li>
            );
          })}
        </ul>
        {moreError && (
          <p role="alert" className="mt-4 text-center text-sm text-elevari-error">
            {moreError}
          </p>
        )}
        {state.hasMore && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              aria-busy={loadingMore || undefined}
              className={cx('elevari-btn-ghost min-h-[44px]', loadingMore && 'opacity-70')}
            >
              {loadingMore ? 'Cargando…' : 'Ver más reservas'}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div>
      <div role="group" aria-label="Filtrar reservas" className="mb-6 flex flex-wrap gap-2">
        {SCOPES.map((option) => {
          const selected = option.value === scope;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => selectScope(option.value)}
              className={cx(
                'min-h-[44px] rounded-full border px-5 text-sm font-semibold transition',
                selected
                  ? 'border-transparent bg-elevari-action text-white'
                  : 'border-elevari-border bg-elevari-surface text-elevari-slate hover:border-elevari-forest',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {body}
    </div>
  );
}
