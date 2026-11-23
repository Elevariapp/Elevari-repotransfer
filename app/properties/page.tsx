import Link from 'next/link';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import EmptyState from '@/components/ui/EmptyState';
import CatalogFilters from '@/components/catalog/CatalogFilters';
import CatalogPagination from '@/components/catalog/CatalogPagination';
import CatalogViewTracker from '@/components/catalog/CatalogViewTracker';
import RecentlyViewed from '@/components/conversion/RecentlyViewed';
import IntentRecoveryBanner from '@/components/conversion/IntentRecoveryBanner';
import ScenicBackground from '@/components/scene/ScenicBackground';
import { wanaApi } from '@/lib/api-client';
import { humanizeApiError } from '@/lib/api-errors';
import { activeFilterCount, parseCatalogParams } from '@/lib/catalog-params';

export const revalidate = 60;

type SearchParams = {
  city?: string;
  guests?: string;
  check_in?: string;
  check_out?: string;
  sort?: string;
  min_price?: string;
  max_price?: string;
  amenities?: string;
  offset?: string;
  limit?: string;
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const params = parseCatalogParams(sp);
  const active = activeFilterCount(params);
  const hasFilters = active > 0;

  let properties: Awaited<ReturnType<typeof wanaApi.listProperties>>['data'] = [];
  let total: number | null = null;
  let error: string | null = null;

  try {
    const { data, meta } = await wanaApi.listProperties({
      city: params.city,
      guests: params.guests,
      check_in: params.checkIn,
      check_out: params.checkOut,
      sort: params.sort,
      min_price: params.minPrice,
      max_price: params.maxPrice,
      amenities: params.amenities.length > 0 ? params.amenities.join(',') : undefined,
      limit: params.limit,
      offset: params.offset,
    });
    properties = data;
    total = typeof meta?.total === 'number' ? meta.total : null;
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo conectar con la API';
  }

  const fromApi = !error;

  return (
    <>
      <Header />
      <CatalogViewTracker
        results={properties.length}
        total={total ?? undefined}
        activeFilters={active}
        sort={params.sort}
      />
      <main id="contenido" className="pb-16">
        <section className="relative overflow-hidden pt-20 pb-16">
          <ScenicBackground variant="lite" idPrefix="catalog-hero" scrim="center" />
          <div className="elevari-container relative z-10">
            <header className="max-w-2xl mx-auto text-center">
              <p className="elevari-eyebrow-lux !text-elevari-amber-soft">Colección</p>
              <h1 className="elevari-display-hero elevari-display-hero--light mt-3 mb-6">
                Espacios únicos en Colombia
              </h1>
              <div className="elevari-divider-gold mx-auto mt-5 mb-8" />
              <p className="text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
                Selecciona fechas en cada propiedad para ver el precio total antes de reservar.
              </p>
              {fromApi && (
                <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-elevari-amber/30 bg-elevari-surface/95 px-4 py-1.5 text-xs font-medium text-elevari-forest backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-elevari-amber" aria-hidden />
                  Disponibilidad en tiempo real
                </span>
              )}
            </header>

            <CatalogFilters params={params} />

            {hasFilters && (
              <p className="mt-4 text-sm text-white/85">
                {params.city && <span className="font-medium text-white">{params.city}</span>}
                {params.guests && <span className="ml-2">· {params.guests} huéspedes</span>}
                {params.checkIn && params.checkOut && (
                  <span className="ml-2">
                    · {params.checkIn} → {params.checkOut}
                  </span>
                )}
                {params.amenities.length > 0 && (
                  <span className="ml-2">· {params.amenities.join(', ')}</span>
                )}
              </p>
            )}
          </div>
        </section>

        <IntentRecoveryBanner />
        <RecentlyViewed />

        <div className="elevari-container py-10 lg:py-12">
          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-elevari-amber/40 bg-elevari-warning-soft p-6 text-elevari-warning"
            >
              <p className="font-semibold">No pudimos cargar la colección</p>
              <p className="mt-2 text-sm leading-relaxed">{humanizeApiError(error)}</p>
              {hasFilters && (
                <Link href="/properties" className="elevari-link mt-4 inline-block text-sm font-medium">
                  Ver todas las propiedades
                </Link>
              )}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              emoji={hasFilters ? '🔍' : '🏕️'}
              title={hasFilters ? 'Sin resultados' : 'Próximamente más espacios'}
              description={
                hasFilters
                  ? 'No encontramos propiedades con esos filtros. Ajusta el precio o las comodidades, o explora toda la colección.'
                  : 'Estamos incorporando nuevos glampings. Vuelve pronto o publica tu espacio como anfitrión.'
              }
              actionLabel={hasFilters ? 'Ver todas las propiedades' : 'Explorar anfitrión'}
              actionHref={hasFilters ? '/properties' : '/become-host'}
            />
          ) : (
            <>
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {properties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    position={params.offset + index + 1}
                    sort={params.sort}
                    activeFilters={active}
                    property={{
                      id: property.id,
                      slug: property.slug,
                      title: property.title,
                      city: property.city,
                      price_per_night: property.price_per_night,
                      cover_image: property.cover_image,
                      rating: property.rating,
                      review_count: property.review_count,
                    }}
                  />
                ))}
              </div>
              <CatalogPagination params={params} loaded={properties.length} total={total} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
