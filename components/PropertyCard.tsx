import Link from 'next/link';
import Image from 'next/image';
import { formatPropertyLocation } from '@/lib/property-location';
import EmptyMedia from '@/components/ui/EmptyMedia';

type Property = {
  id: string;
  slug?: string;
  title?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string;
  description?: string | null;
  price_per_night?: number | null;
  media_url?: string | null;
  cover_image?: string | null;
  rating?: number | null;
  review_count?: number;
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PropertyCard({ property }: { property: Property }) {
  const href = property.slug ? `/properties/${property.slug}` : '/properties';
  const image = property.cover_image ?? property.media_url;
  const location = formatPropertyLocation(property.city ?? property.location, property.country);
  const isFeatured = property.rating != null && property.rating >= 4.5;

  return (
    <Link href={href} className="group block">
      <article className="animate-fade-in">
        <div
          className="relative overflow-hidden rounded-2xl bg-elevari-sand aspect-[4/3] shadow-card ring-1 ring-black/[0.04] transition duration-500 group-hover:shadow-wana-lg group-hover:ring-elevari-amber/25"
        >
          {image ? (
            <>
              <Image
                src={image}
                alt={property.title ?? 'Propiedad'}
                width={640}
                height={480}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                aria-hidden
              />
            </>
          ) : (
            <EmptyMedia label="Sin imagen" className="aspect-[4/3]" />
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {isFeatured && (
              <span className="rounded-full border border-elevari-amber/40 bg-black/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-elevari-amber-soft shadow-sm">
                Destacado
              </span>
            )}
            {property.rating != null && (
              <span className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-elevari-slate shadow-sm">
                <span className="text-elevari-amber">★</span> {property.rating}
              </span>
            )}
          </div>

          {property.price_per_night != null && (
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-semibold text-white drop-shadow-md">
                {formatPrice(property.price_per_night)}
                <span className="font-normal text-white/85"> / noche</span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-3.5 space-y-1 px-0.5">
          <h3 className="font-semibold text-elevari-slate line-clamp-1 transition group-hover:text-elevari-ink">
            {property.title ?? 'Propiedad sin título'}
          </h3>
          <p className="text-sm text-elevari-muted line-clamp-1">{location ?? 'Colombia'}</p>
          {property.review_count != null && property.review_count > 0 && (
            <p className="text-xs text-elevari-muted/80">{property.review_count} reseñas</p>
          )}
        </div>
      </article>
    </Link>
  );
}
