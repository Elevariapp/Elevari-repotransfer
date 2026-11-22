'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi, type AdminPropertyRow, type PropertyStatus } from '@/lib/api-client';

const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  unavailable: 'No disponible',
  maintenance: 'Mantenimiento',
};

export default function AdminPropertiesPanel() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AdminPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    wanaApi
      .adminProperties()
      .then((r) => setRows(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const updateStatus = async (id: string, status: PropertyStatus) => {
    setBusyId(id);
    try {
      await wanaApi.adminUpdatePropertyStatus(id, status);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success('Estado actualizado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) return <p className="text-elevari-muted">Cargando propiedades…</p>;

  if (!user || user.role !== 'admin') {
    return <p className="text-elevari-muted">Acceso restringido a administradores.</p>;
  }

  return (
    <div className="elevari-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-elevari-border bg-elevari-sand/50 text-elevari-muted">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Host</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-elevari-muted">
                  Sin propiedades
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-elevari-border last:border-0">
                  <td className="px-4 py-3 font-medium text-elevari-slate">{row.title}</td>
                  <td className="px-4 py-3 text-elevari-muted">{row.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-elevari-sand px-3 py-1 text-xs font-medium">
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-elevari-muted">{row.host_email}</td>
                  <td className="px-4 py-3">
                    {row.status === 'draft' && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => updateStatus(row.id, 'published')}
                        className="elevari-btn-primary !px-4 !py-2 text-xs"
                      >
                        Publicar
                      </button>
                    )}
                    {row.status === 'published' && (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => updateStatus(row.id, 'unavailable')}
                        className="elevari-btn-ghost !px-4 !py-2 text-xs"
                      >
                        Ocultar
                      </button>
                    )}
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
