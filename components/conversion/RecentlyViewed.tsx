'use client';
import { useEffect, useState } from 'react';
import { getRecentlyViewed } from '@/lib/conversion/recently-viewed';
import Link from 'next/link';

export default function RecentlyViewed() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="elevari-section-title">Recientemente visitados</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(i => (
          <Link key={i.id} href={`/properties/${i.slug}`} className="rounded-xl border p-4 hover:shadow">
            <p className="font-medium">{i.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
