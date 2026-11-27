import Header from '@/components/Header';
import PropertyGallery from '@/components/booking/PropertyGallery';
import BookingWidget from '@/components/booking/BookingWidget';
import PropertyReviews from '@/components/booking/PropertyReviews';
import PropertyJsonLd from '@/components/analytics/PropertyJsonLd';
import PropertyViewTracker from '@/components/conversion/PropertyViewTracker';
import ExclusiveBadge from '@/components/ExclusiveBadge';
import FavoriteButton from '@/components/conversion/FavoriteButton';
import TrustSignals from '@/components/conversion/TrustSignals';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import SimilarProperties from '@/components/conversion/SimilarProperties';
import PropertyLocation from '@/components/booking/PropertyLocation';
import ElevariMark from '@/components/brand/ElevariMark';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { formatPropertyLocation } from '@/lib/property-location';
import { formatCop } from '@/lib/format';
import { buildPropertyShareMetadata } from '@/lib/share-metadata';
import { wanaApi } from '@/lib/api-client';
import { siteUrl } from '@/lib/site-url';
import { whatsappContext } from '@/lib/whatsapp';
import { AMENITY_LABELS, normalizeAmenity } from '@/lib/seo/similarity';
import { findSimilar } from '@/lib/conversion/similar-properties';
import { getServerLanguage, tServer } from '@/lib/i18n-server';

type PageProps = {
  params: Promise<{ slug: string }>;
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
      siteUrl(),
    );
    return {
      title: share.title,
      description: share.description,
      alternates: { canonical: share.canonical },
      openGraph: share.openGraph,
      twitter: share.twitter,
    };
  } catch {
    return { title: 'Propiedad' };
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const language = await getServerLanguage();

  let property: Awaited<ReturnType<typeof wanaApi.getProperty>>;
  try {
    property = await wanaApi.getProperty(slug);
  } catch (err) {
    // API error → 500, not 404
    throw new Error(`Failed to load property ${slug}`);
  }

  const media = (property.media as Array<Record<string, unknown>>) ?? [];
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const reviews = (property as { reviews?: Array<{ id: string; rating: number; comment?: string | null }> }).reviews ?? [];

  // Fetch candidates for similar properties
  let similarCandidates: Awaited<ReturnType<typeof wanaApi.listProperties>>['data'] = [];
  try {
    const { data } = await wanaApi.listProperties({
      city: property.city ?? undefined,
      limit: 20,
    });
    similarCandidates = data.filter(p => p.id !== property.id);
  } catch {
    similarCandidates = [];
  }

  const currentSummary = {
    id: property.id,
    slug: property.slug,
    title: property.title,
    city: property.city ?? '',
    price_per_night: property.price_per_night,
    max_guests: property.max_guests,
    amenities,
  };

  const candidatesSummary = similarCandidates.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    city: p.city ?? '',
    price_per_night: p.price_per_night,
    max_guests: p.max_guests,
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
  }));

  const similar = findSimilar(currentSummary, candidatesSummary);

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
                  {tServer('Common', 'listing.recommendedByGuests', language)}
                </span>
              )}
            </div>
            <h1 className="elevari-display-section text-elevari-slate">
              {property.title}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <FavoriteButton id={property.id} />
            </div>
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
              <span>· {property.max_guests} {tServer('Common', 'listing.guestsMaxSuffix', language)}</span>
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
                    <ElevariMark plain decorative className="h-full w-full" />
                  </div>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-elevari-slate">
                      {property.host?.name?.trim() || tServer('Common', 'listing.hostFallback', language)}
                      <VerifiedBadge verified={property.host?.verified} />
                    </p>
                    <p className="text-sm text-elevari-muted">
                      {property.host?.verified
                        ? tServer('Common', 'listing.verifiedIdentity', language)
                        : tServer('Common', 'listing.hostFastResponse', language)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="elevari-section-title">{tServer('Common', 'listing.aboutSpace', language)}</h2>
                <p className="mt-4 leading-relaxed text-elevari-slate">
                  {property.description ?? tServer('Common', 'listing.noDescription', language)}
                </p>
              </section>

              <section className="rounded-2xl border border-elevari-border bg-elevari-surface p-5 shadow-[var(--elevari-shadow-soft)]">
                <h2 className="font-display text-lg font-semibold text-elevari-ink">
                  {tServer('Common', 'listing.priceTransparency', language)}
                </h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-elevari-muted">{tServer('Common', 'listing.from', language)}</dt>
                    <dd className="font-semibold text-elevari-ink">
                      {formatCop(property.price_per_night)}{' '}
                      <span className="font-normal text-elevari-muted">
                        {tServer('Common', 'perNight', language)}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-elevari-muted">{tServer('Common', 'listing.serviceFee', language)}</dt>
                    <dd className="text-elevari-slate">
                      15% · {tServer('Common', 'listing.includedInTotal', language)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-elevari-border pt-2">
                    <dt className="text-elevari-muted">{tServer('Common', 'listing.total', language)}</dt>
                    <dd className="text-elevari-slate">
                      {tServer('Common', 'listing.totalCalculated', language)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-elevari-muted">
                  {tServer('Common', 'listing.pricingNote', language)}
                </p>
              </section>

              {amenities.length > 0 && (
                <section className="border-t border-elevari-border pt-8">
                  <h2 className="elevari-section-title">{tServer('Common', 'listing.amenitiesTitle', language)}</h2>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {amenities.map((item: string) => {
                      const normalized = normalizeAmenity(item);
                      return (
                        <li key={item} className="flex items-center gap-3 text-elevari-slate">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevari-sand text-elevari-forest text-sm">
                            ✓
                          </span>
                          {AMENITY_LABELS[normalized] ?? item}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section className="border-t border-elevari-border pt-8">
                <h2 className="wana-section-title">{tServer('Common', 'listing.policiesTitle', language)}</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">
                      {tServer('Common', 'listing.arrivalDeparture', language)}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>{tServer('Common', 'listing.checkInFrom', language)}</li>
                      <li>{tServer('Common', 'listing.checkOutUntil', language)}</li>
                      <li>
                        {tServer('Common', 'listing.maxGuestsCount', language).replace(
                          '{count}',
                          String(property.max_guests),
                        )}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">
                      {tServer('Common', 'listing.cancellation', language)}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>{tServer('Common', 'listing.refundFull', language)}</li>
                      <li>{tServer('Common', 'listing.refundHalf', language)}</li>
                      <li>{tServer('Common', 'listing.refundNone', language)}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">
                      {tServer('Common', 'listing.houseRules', language)}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>{tServer('Common', 'listing.noParties', language)}</li>
                      <li>{tServer('Common', 'listing.noSmoking', language)}</li>
                      <li>{tServer('Common', 'listing.petsAsk', language)}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-elevari-ink">
                      {tServer('Common', 'listing.payment', language)}
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-elevari-slate">
                      <li>{tServer('Common', 'listing.payCop', language)}</li>
                      <li>{tServer('Common', 'listing.payMethods', language)}</li>
                      <li>{tServer('Common', 'listing.confirmationEmail', language)}</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-xs text-elevari-muted">
                  {tServer('Common', 'listing.doubt', language)}{' '}
                  <a href="/legal/faq" className="font-semibold text-elevari-forest underline underline-offset-2">
                    {tServer('Common', 'listing.faqLink', language)}
                  </a>{' '}
                  {tServer('Common', 'listing.or', language)}{' '}
                  <WhatsAppLink
                    variant="flow"
                    label={tServer('Common', 'listing.writeWhatsapp', language)}
                    message={whatsappContext(`/properties/${property.slug}`).message}
                  />
                  .
                </p>
              </section>

              <TrustSignals language={language} />

              <PropertyReviews
                reviews={reviews}
                rating={property.rating}
                reviewCount={property.review_count}
                language={language}
              />

              <PropertyLocation
                city={property.city}
                country={property.country}
                latitude={property.latitude}
                longitude={property.longitude}
                address={property.title}
              />
              <SimilarProperties current={currentSummary} candidates={similar} />
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
