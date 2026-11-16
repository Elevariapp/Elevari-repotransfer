'use client';
import { useEffect } from 'react';
import { addRecentlyViewed } from '@/lib/conversion/recently-viewed';
import { track } from '@/lib/conversion/analytics';

export default function PropertyViewTracker({ property }: { property: { id: string; slug: string; title: string; price_per_night?: number } }) {
  useEffect(() => {
    addRecentlyViewed({ id: property.id, slug: property.slug, title: property.title });
    track('recently_viewed', { property_id: property.id });
  }, [property.id]);
  return null;
}
