'use client';
import { useEffect, useState } from 'react';
import { findSimilar, PropertySummary } from '@/lib/conversion/similar-properties';
import Link from 'next/link';
import { track } from '@/lib/conversion/analytics';

export default function SimilarProperties({ current, candidates }: { current: PropertySummary; candidates: PropertySummary[] }) {
  const [similar, setSimilar] = useState<PropertySummary[]>([]);

  useEffect(() => {
    setSimilar(findSimilar(current, candidates));
  }, [current, candidates]);

  if (similar.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="elevari-section-title">Propiedades similares</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {similar.map(p => (
          <Link key={p.id} href={`/properties/${p.slug}`} className="rounded-xl border p-4 hover:shadow" onClick={() => track('recommendation_click', { from: current.id, to: p.id, slug: p.slug })}>
            <p className="font-medium">{p.title}</p>
            <p className="text-sm text-elevari-muted">{p.city} · ${p.price_per_night}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
