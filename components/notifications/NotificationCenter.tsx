'use client';

import { useEffect, useState } from 'react';
import { notificationService } from '@/lib/notifications/web';
import type { Notification } from '@/lib/notifications/web';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

const typeConfig: Record<Notification['type'], { tone: 'success' | 'warning' | 'error' | 'brand'; label: string }> = {
  info: { tone: 'brand', label: 'Información' },
  success: { tone: 'success', label: 'Éxito' },
  warning: { tone: 'warning', label: 'Advertencia' },
  error: { tone: 'error', label: 'Error' },
};

export default function NotificationCenter({ open }: { open: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(notificationService.getAll());
    const unsub = notificationService.subscribe((n) => setNotifications(n));
    return unsub;
  }, []);

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Notificaciones">
      <Card className="w-full max-w-md mx-4 p-0 rounded-[var(--elevari-radius-xl)] shadow-[var(--elevari-shadow-modal)]" elevation="floating" padded={false}>
        <div className="p-6 border-b border-elevari-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-elevari-slate">Notificaciones</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge tone="brand" className="px-2 py-1 text-xs">
                {unreadCount} nuevas
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="px-3">
              Marcar todo como leído
            </Button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-elevari-muted text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    n.read
                      ? 'border-elevari-border bg-elevari-surface'
                      : 'border-elevari-forest/25 bg-elevari-fresh-soft'
                  } cursor-pointer hover:bg-elevari-ivory transition`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                    if (n.actionUrl) {
                      window.location.href = n.actionUrl;
                    }
                  }}
                >
                  <Badge tone={typeConfig[n.type].tone} className="mt-0.5">
                    {typeConfig[n.type].label}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-elevari-slate leading-snug">{n.title}</h3>
                    <p className="text-sm text-elevari-muted mt-1 line-clamp-2">{n.message}</p>
                    {n.actionUrl && (
                      <p className="text-xs text-elevari-forest mt-1 font-medium">
                        {n.actionLabel ?? 'Ver detalles'}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-elevari-muted mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-elevari-border">
          <Button variant="ghost" size="sm" fullWidth onClick={() => notificationService.clear()}>
            Limpiar todo
          </Button>
        </div>
      </Card>
    </div>
  );
}