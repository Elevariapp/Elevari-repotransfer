'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi, type AdminPendingInvoiceRow } from '@/lib/api-client';

export default function AdminInvoicesPanel() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AdminPendingInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    wanaApi
      .adminPendingInvoices()
      .then((r) => setRows(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (id: string) => {
    setBusyId(id);
    try {
      await wanaApi.adminRetryInvoice(id);
      toast.success('Reintento enviado');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reintento fallido');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) return <p className="text-elevari-muted">Cargando facturas…</p>;

  if (!user || user.role !== 'admin') {
    return <p className="text-elevari-muted">Acceso restringido a administradores.</p>;
  }

  return (
    <div className="elevari-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-elevari-border bg-elevari-sand/50 text-elevari-muted">
            <tr>
              <th className="px-4 py-3">Reserva / propiedad</th>
              <th className="px-4 py-3">Huésped</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Error</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-elevari-muted">
                  Sin facturas pendientes
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-elevari-border/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-elevari-slate">
                      {row.booking?.property?.title ?? '—'}
                    </p>
                    <p className="text-xs text-elevari-muted">{row.bookingId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{row.guestName ?? '—'}</p>
                    <p className="text-xs text-elevari-muted">{row.guestEmail ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-elevari-muted">
                    {row.alegraError ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => retry(row.id)}
                      className="elevari-btn-ghost !px-3 !py-1.5 text-xs min-h-[36px]"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
