import Link from 'next/link';
import Header from '@/components/Header';
import HomeHero from '@/components/home/HomeHero';
import PropertyCard from '@/components/PropertyCard';
import { wanaApi } from '@/lib/api-client';
import { tServer } from '@/lib/i18n-server';
import ExperiencePillars from '@/components/home/ExperiencePillars';
import TrustStrip from '@/components/home/TrustStrip';
import CategoryStrip from '@/components/home/CategoryStrip';
import SceneBand from '@/components/home/SceneBand';
import { ButtonLink } from '@/components/ui';

export const revalidate = 60;

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof wanaApi.listProperties>>['data'] = [];
  try {
    const res = await wanaApi.listProperties({ limit: 4 });
    featured = res.data;
  } catch {
    featured = [];
  }

  return (
    <>
      <Header />
      <main id="contenido">
        <HomeHero />
        <CategoryStrip />

        <TrustStrip />

        {featured.length > 0 && (
          <section id="coleccion" className="relative py-14 lg:py-20">
            <div className="elevari-container relative">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="elevari-eyebrow">{tServer('Common', 'collection')}</p>
                  <h2 className="elevari-display-section mt-3 text-elevari-slate">
                    {tServer('Common', 'featuredThisWeek')}
                  </h2>
                  <p className="mt-3 text-elevari-muted">{tServer('Common', 'bestRatedByGuests')}</p>
                </div>
                <Link
                  href="/properties"
                  className="hidden text-sm font-semibold text-elevari-forest hover:text-elevari-forest-deep sm:inline-flex sm:items-center sm:gap-1"
                >
                  {tServer('Common', 'viewCollection')} <span aria-hidden>→</span>
                </Link>
              </div>
              <Link href="/properties" className="elevari-btn-ghost mt-4 text-sm sm:hidden">
                {tServer('Common', 'viewCollection')}
              </Link>
              <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={{
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      city: p.city,
                      country: p.country,
                      price_per_night: p.price_per_night,
                      cover_image: p.cover_image,
                      rating: p.rating,
                      review_count: p.review_count,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <SceneBand idPrefix="band-sabana">
          <div className="elevari-container py-16 sm:py-20 text-center text-white">
            <p className="elevari-eyebrow elevari-eyebrow-lux !text-elevari-amber-soft">
              {tServer('Common', 'sabanaBogota')}
            </p>
            <h2 className="elevari-display-section elevari-display-section--light mt-4 max-w-2xl mx-auto">
              {tServer('Common', 'mountainSunrises')}
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-white/80 leading-relaxed">
              {tServer('Common', 'exclusiveSpaces')}
            </p>
            <ButtonLink
              href="/properties/glamping-wana"
              variant="accent"
              size="lg"
              className="mt-8"
            >
              {tServer('Common', 'viewFeaturedSpace')}
            </ButtonLink>
          </div>
        </SceneBand>

        <ExperiencePillars />

        <section className="elevari-container pb-20">
          <SceneBand
            idPrefix="band-cta"
            className="rounded-[1.75rem] shadow-elevari-lg ring-1 ring-elevari-amber/20"
          >
            <div className="px-8 py-14 text-center text-white sm:px-14 sm:py-16">
              <p className="elevari-eyebrow !text-elevari-amber-soft">
                {tServer('Common', 'nextEscape')}
              </p>
              <h2 className="elevari-display-section elevari-display-section--light mt-4">
                {tServer('Common', 'readyToDisconnect')}
              </h2>
              <p className="mt-4 max-w-lg mx-auto text-white/80 leading-relaxed">
                {tServer('Common', 'bookWithClearPrices')}
              </p>
              <ButtonLink href="/properties" variant="accent" size="lg" className="mt-8">
                {tServer('Common', 'viewEntireCollection')}
              </ButtonLink>
            </div>
          </SceneBand>
        </section>
      </main>
    </>
  );
}
