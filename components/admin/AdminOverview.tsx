'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { wanaApi } from '@/lib/api-client';

export default function AdminOverview() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof wanaApi.adminOverview>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    wanaApi
      .adminOverview()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [user]);

  if (authLoading) return <p className="text-elevari-muted">Cargando…</p>;

  if (!user || user.role !== 'admin') {
    return (
      <div className="wana-card p-8 text-center text-elevari-muted">
        Acceso restringido a administradores.
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>;
  }

  const cards = stats
    ? [
        { label: 'Propiedades', value: stats.properties_total, href: '/admin/properties' },
        { label: 'Reservas confirmadas', value: stats.bookings_confirmed, href: '/admin/bookings' },
        { label: 'Media pendiente', value: stats.media_pending, href: '/admin/moderation' },
        { label: 'Facturas pendientes', value: stats.invoices_pending, href: '/admin/invoices' },
      ]
    : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.length === 0
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="wana-card h-28 animate-pulse bg-elevari-sand" />
          ))
        : cards.map((card) => (
            <Link key={card.label} href={card.href} className="wana-card p-6 transition hover:shadow-card">
              <p className="text-sm text-elevari-muted">{card.label}</p>
              <p className="mt-2 font-display text-3xl text-elevari-slate">{card.value}</p>
            </Link>
          ))}
    </div>
  );
}
