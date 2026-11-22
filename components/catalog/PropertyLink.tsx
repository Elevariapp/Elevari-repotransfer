'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { analytics } from '@/lib/analytics';

/**
 * Property link with click tracking (Phase 4 funnel).
 * Keeps `PropertyCard` a server component while emitting `property_clicked`.
 */
export default function PropertyLink({
  href,
  slug,
  position,
  sort,
  activeFilters,
  className,
  children,
}: {
  href: string;
  slug: string;
  position?: number;
  sort?: string;
  activeFilters?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        analytics.propertyClicked({ slug, position, sort, activeFilters })
      }
    >
      {children}
    </Link>
  );
}
