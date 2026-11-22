import { buildLodgingBusinessSchema, escapeJsonLdString } from '@/lib/seo/schema';

export default function PropertyJsonLd({
  property,
}: {
  property: {
    slug: string;
    title: string;
    description: string | null;
    price_per_night: number;
    city: string | null;
    country?: string;
    cover_image: string | null;
    rating: number | null;
    review_count: number;
  };
}) {
  const schema = buildLodgingBusinessSchema(property);
  const json = JSON.stringify(schema);
  // Harden against injection
  const safe = json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
