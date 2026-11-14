import Header from '@/components/Header';
import PropertyGallery from '@/components/booking/PropertyGallery';
import BookingWidget from '@/components/booking/BookingWidget';
import PropertyReviews from '@/components/booking/PropertyReviews';
import PropertyJsonLd from '@/components/analytics/PropertyJsonLd';
import PropertyViewTracker from '@/components/analytics/PropertyViewTracker';
import ExclusiveBadge from '@/components/ExclusiveBadge';
import PropertyLocation from '@/components/booking/PropertyLocation';
import EleveriMark from '@/components/brand/EleveriMark';
import { formatPropertyLocation } from '@/lib/property-location';
import { formatCop } from '@/lib/format';
import { buildPropertyShareMetadata } from '@/lib/share-metadata';
import { wanaApi } from '@/lib/api-client';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  fogata: 'Fogata',
  vista: 'Vista panorámica',
  estacionamiento: 'Estacionamiento',
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const property = await wanaApi.getProperty(slug);
    const share = buildPropertyShareMetadata(
      {
        slug: property.slug,
        title: property.title,
        city: property.city,
        country: property.country,
        pricePerNight: property.price_per_night,
        coverImage: property.cover_image,
        description: property.description,
      },
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eleveri.app',
    );
    return {
      title: share.title,
      description: share.description,
      alternates: { canonical: share.canonical },
      openGraph: share.openGraph,
      twitter: share.twitter,
    };
  } catch {
    return { title: 'Propiedad | Eleveri' };
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let property: Awaited<ReturnType<typeof wanaApi.getProperty>>;
  try {
    property = await wanaApi.getProperty(slug);
  } catch {
    notFound();
  }

  const media = (property.media as Array<Record<string, unknown>>) ?? [];
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const reviews = (property as { reviews?: Array<{ id: string; rating: number; comment?: string | null }> }).reviews ?? [];

  return (
    <>
      <PropertyJsonLd property={property} />
      <PropertyViewTracker
        property={{
          id: property.id,
          slug: property.slug,
          title: property.title,
          price_per_night: property.price_per_night,
        }}
      />
      <Header />
      <main id="contenido" className="pb-24 lg:pb-12">
        <div className="elevari-container py-6 lg:py-8">
          <header className="mb-5 animate-slide-up">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <ExclusiveBadge />
              {property.rating != null && property.rating >= 4.5 && (
                <span className="rounded-full border border-elevari-amber/35 bg-elevari-amber-soft/50 px-3 py-1 text-xs font-semibold text-elevari-slate">
                  Huéspedes lo recomiendan
                </span>
              )}
            </div>
            <h1 className="elevari-display-section text-elevari-slate">
              {property.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-elevari-muted">
              {property.rating != null && (
                <span className="flex items-center gap-1 font-medium text-elevari-slate">
                  <span className="text-elevari-forest">★</span> {property.rating}
                  <span className="text-elevari-muted/70">({property.review_count})</span>
                </span>
              )}
              {property.city && (
                <span className="underline decoration-elevari-border">
                  {formatPropertyLocation(property.city, property.country)}
                </span>
              )}
              <span>· {property.max_guests} huéspedes max.</span>
            </div>
          </header>

          <div className="mb-8 animate-fade-in">
            <PropertyGallery media={media as never} title={property.title} />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-start">
            <div className="space-y-10 min-w-0">
              <section>
                <div className="flex items-center gap-4 rounded-2xl border border-elevari-border bg-gradient-to-br from-white to-elevari-ivory p-5 shadow-sm ring-1 ring-elevari-amber/10">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-elevari-forest-deep p-2.5 shadow-sm ring-2 ring-elevari-amber/25">
                    <EleveriMark className="h-full w-full" plain />
                  </div>
                  <div>
                    <p className="font-semibold text-elevari-slate">Anfitrión Eleveri verificado</p>
                    <p className="text-sm text-elevari-muted">Experiencia glamping curada · respuesta rápida</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="elevari-section-title">Sobre este espacio</h2>
                <p className="mt-4 leading-relaxed text-elevari-slate">
                  {property.description ?? 'Sin descripción.'}
                </p>
              </section>

              <section className="rounded-2xl border border-elevari-border bg-elevari-surface p-5 shadow-[var(--elevari-shadow-soft)]">
                <h2 className="font-display text-lg font-semibold text-elevari-ink">
                  Precio y transparencia
                </h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-elevari-muted">Desde</dt>
                    <dd className="font-semibold text-elevari-ink">
                      {formatCop(property.price_per_night)}{' '}
                      <span className="font-normal text-elevari-muted">/ noche</span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-elevari-muted">Tarifa de Servicio Elevari</dt>
                    <dd className="text-elevari-slate">15% · incluida en el total</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-elevari-border pt-2">
                    <dt className="text-elevari-muted">Total</dt>
                    <dd className="text-elevari-slate">Se calcula con tus fechas antes de pagar</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-elevari-muted">
                  Verás el desglose completo (noches + tarifa de servicio) antes de confirmar. El cobro se
                  procesa en pesos colombianos (COP) con Wompi.
                </p>
              </section>

              {amenities.length > 0 && (
                <section className="border-t border-elevari-border pt-8">
                  <h2 className="elevari-section-title">Lo que ofrece este lugar</h2>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {amenities.map((item: string) => (
                      <li key={item} className="flex items-center gap-3 text-elevari-slate">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevari-sand text-elevari-forest text-sm">
                          ✓
                        </span>
                        {AMENITY_LABELS[item] ?? item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="border-t border-elevari-border pt-8">
                <h2 className="wana-section-title">Políticas de la estancia</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">Llegada y salida</h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>Check-in desde las 15:00</li>
                      <li>Check-out hasta las 12:00</li>
                      <li>Máximo {property.max_guests} huéspedes</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">Cancelación</h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>Reembolso total con 5 días o más</li>
                      <li>50% entre 2 y 4 días antes</li>
                      <li>Sin reembolso con menos de 48 horas</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">Normas de la casa</h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>No se permiten fiestas ni eventos</li>
                      <li>Prohibido fumar en espacios interiores</li>
                      <li>Mascotas: consultar con el anfitrión</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">Pago</h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>Cobro en COP con Wompi</li>
                      <li>Tarjetas, PSE, Nequi y Bancolombia</li>
                      <li>Confirmación por correo al pagar</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-xs text-elevari-muted">
                  ¿Dudas? Consulta las{' '}
                  <a href="/legal/faq" className="font-semibold text-elevari-forest underline underline-offset-2">
                    preguntas frecuentes
                  </a>
                  .
                </p>
              </section>

              <PropertyReviews
                reviews={reviews}
                rating={property.rating}
                reviewCount={property.review_count}
              />

              <PropertyLocation
                city={property.city}
                country={property.country}
                latitude={property.latitude}
                longitude={property.longitude}
              />
            </div>

            <aside>
              <BookingWidget
                propertyId={property.id}
                slug={property.slug}
                pricePerNight={property.price_per_night}
                maxGuests={property.max_guests}
              />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
