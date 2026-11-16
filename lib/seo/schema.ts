import { siteUrl } from '../site-url';

export function escapeJsonLdString(str: string) {
  return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function buildLodgingBusinessSchema(property: {
  slug: string;
  title: string;
  description?: string | null;
  price_per_night: number;
  city?: string | null;
  country?: string;
  cover_image?: string | null;
  rating?: number | null;
  review_count?: number;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[];
}) {
  const url = siteUrl(`/properties/${property.slug}`);
  const addressLocality = property.city ?? undefined;
  const addressCountry = property.country ?? 'CO';

  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.title,
    description: property.description ?? undefined,
    url,
    image: property.cover_image ?? undefined,
    priceRange: `COP ${property.price_per_night}`,
    address: addressLocality
      ? {
          '@type': 'PostalAddress',
          addressLocality,
          addressCountry,
        }
      : undefined,
    geo: property.latitude && property.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: property.latitude,
          longitude: property.longitude,
        }
      : undefined,
    amenityFeature: Array.isArray(property.amenities)
      ? property.amenities.map(a => ({
          '@type': 'LocationFeatureSpecification',
          name: a,
        }))
      : undefined,
    aggregateRating:
      property.rating != null && (property.review_count ?? 0) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: property.rating,
            reviewCount: property.review_count,
          }
        : undefined,
  };

  // Remove undefined keys
  return JSON.parse(JSON.stringify(data));
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Elevari',
    url: siteUrl(),
    logo: siteUrl('/logo.png'),
    sameAs: [
      'https://www.instagram.com/elevari',
    ],
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Elevari',
    url: siteUrl(),
    publisher: {
      '@type': 'Organization',
      name: 'Elevari',
      url: siteUrl(),
    },
  };
}

export function buildItemListSchema(items: { url: string; name: string }[], name?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: name ?? 'Listado',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: it.url,
      name: it.name,
    })),
  };
}

export function buildBreadcrumbListSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildFAQPageSchema(faq: { q: string; a: string }[]) {
  if (!faq || faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}

export function buildCollectionSchema(collection: {
  slug: string;
  title: string;
  description: string;
  items?: { url: string; name: string }[];
}) {
  const url = siteUrl(`/${collection.slug}`);
  const itemList = collection.items && collection.items.length > 0
    ? buildItemListSchema(collection.items, collection.title)
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url,
        name: collection.title,
        description: collection.description,
        url,
        isPartOf: {
          '@type': 'WebSite',
          '@id': siteUrl(),
        },
      },
      ...(itemList ? [itemList] : []),
    ],
  };
}
