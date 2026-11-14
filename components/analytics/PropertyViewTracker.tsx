'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

export default function PropertyViewTracker({
  property,
}: {
  property: { id: string; slug: string; title: string; price_per_night: number };
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    analytics.viewProperty({
      id: property.id,
      slug: property.slug,
      title: property.title,
      price: property.price_per_night,
    });
    analytics.propertyOpened({ slug: property.slug, price: property.price_per_night });
  }, [property]);

  return null;
}
