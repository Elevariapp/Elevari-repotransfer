import Link from 'next/link';
import Header from '@/components/Header';
import SearchHero from '@/components/search/SearchHero';
import PropertyCard from '@/components/PropertyCard';
import { wanaApi } from '@/lib/api-client';
import ExperiencePillars from '@/components/home/ExperiencePillars';
import TrustStrip from '@/components/home/TrustStrip';
import CategoryStrip from '@/components/home/CategoryStrip';
import CinematicBand from '@/components/home/CinematicBand';
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
        <SearchHero />
        <CategoryStrip />

        <TrustStrip />

        {featured.length > 0 && (
          <section id="coleccion" className="relative py-14 lg:py-20">
            <div className="absolute inset-0 opacity-[0.04]" aria-hidden>
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: 'url(/properties/glamping-wana/04.webp)' }}
              />
            </div>
            <div className="wana-container relative">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="wana-eyebrow">Selección</p>
                  <h2 className="wana-display-section mt-3 text-elevari-slate">
                    Destacados esta semana
                  </h2>
                  <p className="mt-3 text-elevari-muted">Espacios con la mejor valoración de huéspedes</p>
                </div>
                <Link
                  href="/properties"
                  className="hidden text-sm font-semibold text-elevari-forest hover:text-elevari-amber sm:inline-flex sm:items-center sm:gap-1"
                >
                  Ver colección <span aria-hidden>→</span>
                </Link>
              </div>
              <Link href="/properties" className="wana-btn-ghost mt-4 text-sm sm:hidden">
                Ver colección
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

        <CinematicBand image="/properties/glamping-wana/05.webp" alt="Montañas de Sutatausa" overlay="dark">
          <div className="wana-container py-16 sm:py-20 text-center text-white">
            <p className="wana-eyebrow wana-eyebrow-lux !text-elevari-amber-soft">Sabana de Bogotá</p>
            <h2 className="wana-display-section wana-display-section--light mt-4 max-w-2xl mx-auto">
              Amaneceres en la montaña, noches bajo las estrellas
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-white/80 leading-relaxed">
              Espacios exclusivos en Sutatausa y Cucunubá — silencio, naturaleza y confort a poca distancia
              de la ciudad.
            </p>
            <ButtonLink
              href="/properties/glamping-wana"
              variant="accent"
              size="lg"
              className="mt-8"
            >
              Ver espacio destacado
            </ButtonLink>
          </div>
        </CinematicBand>

        <ExperiencePillars />

        <section className="wana-container pb-20">
          <CinematicBand
            image="/properties/glamping-wana/03.webp"
            alt="Experiencia glamping"
            overlay="dark"
            className="rounded-[1.75rem] shadow-wana-lg ring-1 ring-elevari-amber/20"
          >
            <div className="px-8 py-14 text-center text-white sm:px-14 sm:py-16">
              <p className="wana-eyebrow !text-elevari-amber-soft">Tu próximo escape</p>
              <h2 className="wana-display-section wana-display-section--light mt-4">
                ¿Listo para desconectar?
              </h2>
              <p className="mt-4 max-w-lg mx-auto text-white/80 leading-relaxed">
                Reserva con precios claros. Pago seguro y confirmación al instante.
              </p>
              <ButtonLink href="/properties" variant="accent" size="lg" className="mt-8">
                Ver toda la colección
              </ButtonLink>
            </div>
          </CinematicBand>
        </section>
      </main>
    </>
  );
}
