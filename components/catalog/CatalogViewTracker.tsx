'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

/** Fires catalog_viewed once per rendered result set (Phase 4 discovery). */
export default function CatalogViewTracker({
  results,
  total,
  activeFilters,
  sort,
}: {
  results: number;
  total?: number;
  activeFilters: number;
  sort: string;
}) {
  const last = useRef<string | null>(null);

  useEffect(() => {
    const signature = `${results}|${total ?? 'na'}|${activeFilters}|${sort}`;
    if (last.current === signature) return;
    last.current = signature;
    analytics.catalogViewed({ results, total, activeFilters, sort });
  }, [results, total, activeFilters, sort]);

  return null;
}
