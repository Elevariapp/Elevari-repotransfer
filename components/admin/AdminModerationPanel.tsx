'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi, type AdminPendingMedia } from '@/lib/api-client';

export default function AdminModerationPanel() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<AdminPendingMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    wanaApi
      .adminPendingMedia()
      .then((r) => setItems(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    load();
  }, [user, authLoading]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await wanaApi.adminApproveMedia(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Media aprobada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      await wanaApi.adminRejectMedia(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Media rechazada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) return <p className="text-elevari-muted">Cargando media pendiente…</p>;

  if (!user || user.role !== 'admin') {
    return <p className="text-elevari-muted">Acceso restringido a administradores.</p>;
  }

  if (items.length === 0) {
    return (
      <div className="elevari-card p-8 text-center text-elevari-muted">
        No hay fotos o videos pendientes de revisión.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="elevari-card overflow-hidden">
          <div className="aspect-[4/3] bg-elevari-sand">
            {item.type === 'video' ? (
              <video src={item.url} controls className="h-full w-full object-cover" />
            ) : (
              <img
                src={item.thumbnail_url ?? item.url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="p-4 space-y-3">
            <p className="font-medium text-elevari-slate">{item.property_title}</p>
            <p className="text-xs text-elevari-muted">{item.type}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => approve(item.id)}
                className="elevari-btn-primary flex-1 !py-2 text-sm min-h-[44px]"
              >
                Aprobar
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => reject(item.id)}
                className="elevari-btn-ghost flex-1 !py-2 text-sm min-h-[44px]"
              >
                Rechazar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
