import ScenicBackground from '@/components/scene/ScenicBackground';
import SceneSwitcher from '@/components/scene/SceneSwitcher';
import SearchHero from '@/components/search/SearchHero';
import './home-hero.css';

/**
 * The home hero: the interactive Elevari landscape (día · tarde · noche) full-bleed behind the headline and the search.
 * The art is server-rendered, so the page paints complete with no layout shift; only the search and the switcher are
 * client components. Selectors of scripts/certification/measure-hero.mjs (#buscar, h1, ul, .elevari-search-luxury) stay.
 */
export default function HomeHero() {
  return (
    <section id="buscar" className="home-hero" data-sc-host>
      <ScenicBackground idPrefix="hero" scrim="hero" interactive />
      <SearchHero />
      <div className="home-hero__dock">
        <div className="elevari-container home-hero__dock-row">
          <SceneSwitcher />
          <a href="#coleccion" className="home-hero__scroll">
            <span>Descubre</span>
            <span aria-hidden className="home-hero__mouse">
              <span className="animate-scroll-hint" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
