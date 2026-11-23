'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { wanaApi, type GuestBookingRow } from '@/lib/api-client';
import { formatCop, formatStayDate } from '@/lib/format';

type Tone = Parameters<typeof Badge>[0]['tone'];

const STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  pending_payment: { label: 'Pendiente de pago', tone: 'warning' },
  confirmed: { label: 'Confirmada', tone: 'success' },
  checked_in: { label: 'En curso', tone: 'brand' },
  completed: { label: 'Completada', tone: 'neutral' },
  cancelled: { label: 'Cancelada', tone: 'error' },
};

const INITIAL_VISIBLE = 5;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: GuestBookingRow[] };

export default function GuestBookingsList() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [showAll, setShowAll] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<GuestBookingRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    wanaApi
      .myBookings()
      .then((res) => setState({ status: 'ready', rows: res.data }))
      .catch((err: unknown) =>
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'No pudimos cargar tus reservas.',
        }),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeDialog = useCallback(() => {
    if (!cancelling) setPendingCancel(null);
  }, [cancelling]);

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const id = pendingCancel.id;
    setCancelling(true);
    try {
      const res = await wanaApi.cancelBooking(id);
      setState((prev) =>
        prev.status === 'ready'
          ? { status: 'ready', rows: prev.rows.map((row) => (row.id === id ? { ...row, status: 'cancelled' } : row)) }
          : prev,
      );
      const refund = res.cancellation?.refund_amount ?? 0;
      toast.success(
        refund > 0
          ? `Reserva cancelada. Reembolso estimado: ${formatCop(refund)}`
          : (res.cancellation?.reason ?? 'Reserva cancelada'),
      );
      setPendingCancel(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pudimos cancelar la reserva.');
    } finally {
      setCancelling(false);
    }
  };

  let content;
  if (state.status === 'loading') {
    content = (
      <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Cargando reservas">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-elevari-sand" />
        ))}
      </div>
    );
  } else if (state.status === 'error') {
    content = (
      <div role="alert" className="elevari-card p-6 text-center">
        <p className="text-sm text-elevari-error">{state.message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => {
            setState({ status: 'loading' });
            load();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  } else if (state.rows.length === 0) {
    content = (
      <EmptyState
        emoji="🌄"
        title="Aún no tienes reservas"
        description="Explora glampings únicos en Colombia y reserva tu próxima escapada en minutos."
        actionLabel="Explorar espacios"
        actionHref="/properties"
      />
    );
  } else {
    const { rows } = state;
    const visible = showAll ? rows : rows.slice(0, INITIAL_VISIBLE);
    content = (
      <>
        <ul className="space-y-3">
          {visible.map((row) => {
            const status = STATUS[row.status] ?? { label: row.status, tone: 'neutral' as Tone };
            const canPay = row.status === 'pending_payment';
            const canCancel = row.status === 'pending_payment' || row.status === 'confirmed';
            return (
              <li key={row.id} className="elevari-card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/properties/${row.property_slug}`}
                      className="block truncate font-semibold text-elevari-slate hover:text-elevari-forest"
                    >
                      {row.property_title}
                    </Link>
                    <p className="text-sm text-elevari-muted">{row.property_city ?? 'Colombia'}</p>
                  </div>
                  <Badge tone={status.tone} className="shrink-0">
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-elevari-muted">
                  {formatStayDate(row.check_in, false)} → {formatStayDate(row.check_out)} · {row.guests}{' '}
                  {row.guests === 1 ? 'huésped' : 'huéspedes'}
                </p>
                {row.total != null && (
                  <p className="mt-1 text-sm font-semibold text-elevari-slate">{formatCop(row.total)}</p>
                )}
                {(canPay || row.status === 'confirmed' || canCancel) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canPay && (
                      <Link
                        href={`/checkout/${row.id}?property=${row.property_slug}`}
                        className="elevari-btn-primary min-h-[44px] !px-4 !py-2"
                      >
                        Pagar
                      </Link>
                    )}
                    {row.status === 'confirmed' && (
                      <Link
                        href={`/checkout/${row.id}/success?property=${row.property_slug}`}
                        className="elevari-btn-ghost min-h-[44px] !px-4 !py-2"
                      >
                        Ver confirmación
                      </Link>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setPendingCancel(row)}
                        className="elevari-btn-ghost min-h-[44px] !px-4 !py-2"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {rows.length > INITIAL_VISIBLE && (
          <div className="mt-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
              {showAll ? 'Mostrar menos' : `Ver todas (${rows.length})`}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="my-bookings">
      <h2 id="my-bookings" className="elevari-eyebrow px-1">
        Mis reservas
      </h2>
      <div className="mt-3">{content}</div>

      <Modal
        open={pendingCancel !== null}
        onClose={closeDialog}
        title="¿Cancelar esta reserva?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={closeDialog} disabled={cancelling}>
              Mantener reserva
            </Button>
            <Button onClick={confirmCancel} loading={cancelling}>
              Sí, cancelar
            </Button>
          </div>
        }
      >
        {pendingCancel && (
          <p className="text-sm leading-relaxed text-elevari-muted">
            {pendingCancel.status === 'pending_payment'
              ? `Aún no has pagado ${pendingCancel.property_title}, así que no se te cobrará nada.`
              : `Cancelarás tu estadía en ${pendingCancel.property_title}. El reembolso, si aplica, depende de la política de cancelación y se calcula al confirmar.`}
          </p>
        )}
      </Modal>
    </section>
  );
}
