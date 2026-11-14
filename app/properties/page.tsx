import Link from 'next/link';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import EmptyState from '@/components/ui/EmptyState';
import { wanaApi } from '@/lib/api-client';
import { humanizeApiError } from '@/lib/api-errors';

export const revalidate = 60;

type SearchParams = {
  city?: string;
  guests?: string;
  check_in?: string;
  check_out?: string;
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const city = sp.city?.trim() || undefined;
  const guests = sp.guests ? Number(sp.guests) : undefined;
  const checkIn = sp.check_in;
  const checkOut = sp.check_out;

  let properties: Awaited<ReturnType<typeof wanaApi.listProperties>>['data'] = [];
  let error: string | null = null;

  try {
    const { data } = await wanaApi.listProperties({
      limit: 24,
      city,
      guests: guests && guests > 0 ? guests : undefined,
      check_in: checkIn,
      check_out: checkOut,
    });
    properties = data;
  } catch (e) {
    error = e instanceof Error ? e.message : 'No se pudo conectar con la API';
  }

  const fromApi = !error;
  const hasFilters = city || guests || checkIn || checkOut;

  return (
    <>
      <Header />
      <main id="contenido" className="pb-16">
        <div className="border-b border-elevari-border/60 bg-elevari-sand/25">
          <div className="wana-container py-10 lg:py-14">
            <header className="max-w-2xl">
              <p className="wana-eyebrow">Colección</p>
              <h1 className="wana-display-page mt-3 text-elevari-slate">
                Espacios únicos en Colombia
              </h1>
              <div className="wana-divider-gold mt-5" />
              <p className="mt-5 text-elevari-muted leading-relaxed">
                Selecciona fechas en cada propiedad para ver el precio total antes de reservar.
              </p>
              {hasFilters && (
                <p className="mt-5 rounded-2xl border border-elevari-border bg-elevari-ivory px-5 py-4 text-sm text-elevari-slate">
                  Filtros:
                  {city && <span className="ml-1 font-medium">{city}</span>}
                  {guests && <span className="ml-2">· {guests} huéspedes</span>}
                  {checkIn && checkOut && (
                    <span className="ml-2">· {checkIn} → {checkOut}</span>
                  )}
                  {checkIn && checkOut && (
                    <span className="block mt-1 text-elevari-muted">
                      Mostrando espacios disponibles para esas fechas.
                    </span>
                  )}
                </p>
              )}
              {fromApi && (
                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-elevari-amber/30 bg-white px-4 py-1.5 text-xs font-medium text-elevari-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-elevari-amber" />
                  Disponibilidad en tiempo real
                </span>
              )}
            </header>
          </div>
        </div>

        <div className="wana-container py-10 lg:py-12">

          {error ? (
            <div role="alert" className="rounded-2xl border border-elevari-amber/40 bg-elevari-warning-soft p-6 text-elevari-warning">
              <p className="font-semibold">No pudimos cargar la colección</p>
              <p className="mt-2 text-sm leading-relaxed">{humanizeApiError(error)}</p>
              {hasFilters && (
                <Link
                  href="/properties"
                  className="wana-link mt-4 inline-block text-sm font-medium"
                >
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
                  ? 'No encontramos propiedades con esos filtros. Prueba otra ciudad o explora toda la colección.'
                  : 'Estamos incorporando nuevos glampings. Vuelve pronto o publica tu espacio como anfitrión.'
              }
              actionLabel={hasFilters ? 'Ver todas las propiedades' : 'Explorar anfitrión'}
              actionHref={hasFilters ? '/properties' : '/become-host'}
            />
          ) : (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
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
          )}
        </div>
      </main>
    </>
  );
}
