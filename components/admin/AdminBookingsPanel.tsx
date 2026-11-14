'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi, type AdminBookingRow } from '@/lib/api-client';

export default function AdminBookingsPanel() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    wanaApi
      .adminBookings()
      .then((r) => setRows(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) return <p className="text-elevari-muted">Cargando reservas…</p>;

  if (!user || user.role !== 'admin') {
    return <p className="text-elevari-muted">Acceso restringido a administradores.</p>;
  }

  return (
    <div className="elevari-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-elevari-border bg-elevari-sand/50 text-elevari-muted">
            <tr>
              <th className="px-4 py-3">Propiedad</th>
              <th className="px-4 py-3">Huésped</th>
              <th className="px-4 py-3">Fechas</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-elevari-muted">
                  Sin reservas
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-elevari-border last:border-0">
                  <td className="px-4 py-3 font-medium text-elevari-slate">{row.property_title}</td>
                  <td className="px-4 py-3 text-elevari-muted">
                    {row.guest_name ?? row.guest_email}
                    <span className="block text-xs text-elevari-muted/70">{row.guests} huéspedes</span>
                  </td>
                  <td className="px-4 py-3 text-elevari-muted">
                    {row.check_in} → {row.check_out}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-elevari-sand px-3 py-1 text-xs font-medium">
                      {row.status}
                    </span>
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
