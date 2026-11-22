/**
 * Share metadata contract (Phase 4 · Wave 2).
 *
 * Pure builders so shareability can be certified without hitting the API:
 * title, description, Open Graph, Twitter Card and canonical URL.
 */

export type ShareableProperty = {
  slug: string;
  title: string;
  city?: string | null;
  country?: string | null;
  pricePerNight?: number | null;
  coverImage?: string | null;
  description?: string | null;
};

export type ShareMetadata = {
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: 'website';
    images: Array<{ url: string; width: number; height: number; alt: string }>;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    images: string[];
  };
};

const FALLBACK_DESCRIPTION = 'Reserva experiencias de glamping únicas en Colombia.';

export function formatCopLabel(amount?: number | null): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  return `$${Math.round(amount).toLocaleString('es-CO')} COP`;
}

export function propertyLocation(property: ShareableProperty): string {
  return [property.city, property.country === 'CO' ? 'Colombia' : property.country]
    .filter(Boolean)
    .join(', ');
}

export function buildPropertyShareMetadata(
  property: ShareableProperty,
  siteUrl: string,
): ShareMetadata {
  const base = siteUrl.replace(/\/$/, '');
  const canonical = `${base}/properties/${property.slug}`;
  const location = propertyLocation(property);
  const price = formatCopLabel(property.pricePerNight);
  const ogImage = `${canonical}/opengraph-image`;

  const title = location ? `${property.title} · ${location}` : property.title;
  const description =
    (property.description?.slice(0, 155) ?? '').trim() ||
    (price ? `${title} desde ${price} por noche. ${FALLBACK_DESCRIPTION}` : `${title}. ${FALLBACK_DESCRIPTION}`);

  return {
    title,
    description,
    canonical,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Elevari',
      locale: 'es_CO',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export type ShareabilityCheck = {
  ok: boolean;
  missing: string[];
};

/** Validates that a metadata object covers every shareability requirement. */
export function checkShareability(metadata: ShareMetadata | null | undefined): ShareabilityCheck {
  const missing: string[] = [];
  if (!metadata) return { ok: false, missing: ['metadata'] };
  if (!metadata.title) missing.push('title');
  if (!metadata.description) missing.push('description');
  if (!metadata.canonical) missing.push('canonical');
  if (!metadata.openGraph?.title) missing.push('og:title');
  if (!metadata.openGraph?.description) missing.push('og:description');
  if (!metadata.openGraph?.url) missing.push('og:url');
  if (!metadata.openGraph?.siteName) missing.push('og:site_name');
  if (!metadata.openGraph?.locale) missing.push('og:locale');
  const image = metadata.openGraph?.images?.[0];
  if (!image?.url) missing.push('og:image');
  if (image && (image.width !== 1200 || image.height !== 630)) missing.push('og:image:size');
  if (!image?.alt) missing.push('og:image:alt');
  if (metadata.twitter?.card !== 'summary_large_image') missing.push('twitter:card');
  if (!metadata.twitter?.title) missing.push('twitter:title');
  if (!metadata.twitter?.images?.[0]) missing.push('twitter:image');
  return { ok: missing.length === 0, missing };
}
