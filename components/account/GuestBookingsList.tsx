'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { wanaApi, type GuestBookingRow } from '@/lib/api-client';
import { formatCop } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  draft: 'Borrador',
};

export default function GuestBookingsList() {
  const [rows, setRows] = useState<GuestBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    wanaApi
      .myBookings()
      .then((r) => setRows(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    setBusyId(id);
    try {
      const res = await wanaApi.cancelBooking(id);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)));
      const refund = (res as { cancellation?: { refund_amount?: number; reason?: string } })
        .cancellation;
      if (refund?.refund_amount && refund.refund_amount > 0) {
        toast.success(`Reserva cancelada. Reembolso estimado: ${formatCop(refund.refund_amount)}`);
      } else {
        toast.success(refund?.reason ?? 'Reserva cancelada');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cancelar');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 border-t border-elevari-border pt-8">
        <h2 className="font-display text-lg text-elevari-slate">Mis reservas</h2>
        <div className="mt-4 space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-elevari-sand" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-8 border-t border-elevari-border pt-8">
        <h2 className="font-display text-lg text-elevari-slate">Mis reservas</h2>
        <div className="mt-4">
          <EmptyState
            emoji="🌄"
            title="Aún no tienes reservas"
            description="Explora glampings únicos en Colombia y reserva tu próxima escapada en minutos."
            actionLabel="Explorar espacios"
            actionHref="/properties"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-elevari-border pt-8">
      <h2 className="font-display text-lg text-elevari-slate">Mis reservas</h2>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-elevari-border bg-elevari-ivory/40 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href={`/properties/${row.property_slug}`}
                  className="font-semibold text-elevari-slate hover:text-elevari-forest"
                >
                  {row.property_title}
                </Link>
                <p className="text-sm text-elevari-muted">{row.property_city ?? 'Colombia'}</p>
                <p className="mt-1 text-sm text-elevari-muted">
                  {row.check_in} → {row.check_out} · {row.guests} huéspedes
                </p>
                <span className="mt-2 inline-block rounded-full bg-elevari-sand px-3 py-1 text-xs font-semibold text-elevari-slate">
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
                {row.total != null && (
                  <p className="mt-2 text-sm font-semibold text-elevari-slate">{formatCop(row.total)}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status === 'pending_payment' && (
                  <>
                    <Link
                      href={`/checkout/${row.id}?property=${row.property_slug}`}
                      className="wana-btn-primary !px-4 !py-2 text-sm min-h-[44px]"
                    >
                      Pagar
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => cancel(row.id)}
                      className="wana-btn-ghost !px-4 !py-2 text-sm min-h-[44px]"
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {row.status === 'confirmed' && (
                  <>
                    <Link
                      href={`/checkout/${row.id}/success?property=${row.property_slug}`}
                      className="wana-btn-ghost !px-4 !py-2 text-sm min-h-[44px]"
                    >
                      Ver confirmación
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => cancel(row.id)}
                      className="wana-btn-ghost !px-4 !py-2 text-sm min-h-[44px]"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
