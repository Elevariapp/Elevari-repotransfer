import Link from 'next/link';
import Image from 'next/image';
import { tServer } from '@/lib/i18n-server';

const pillars = [
  {
    titleKey: 'pillarCuratedTitle',
    descKey: 'pillarCuratedDesc',
    icon: '✦',
  },
  {
    titleKey: 'pillarTransparentTitle',
    descKey: 'pillarTransparentDesc',
    icon: '◎',
  },
  {
    titleKey: 'pillarConfidenceTitle',
    descKey: 'pillarConfidenceDesc',
    icon: '♥',
  },
];

export default function ExperiencePillars({ language }: { language: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
        <Image
          src="/properties/glamping-wana/14.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={60}
          className="object-cover"
          loading="lazy"
        />
      </div>
      <div className="elevari-container relative py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="elevari-eyebrow">{tServer('Common', 'whyElevari', language)}</p>
          <h2 className="elevari-display-section mt-4 text-elevari-slate">
            {tServer('Common', 'moreThanAccommodation', language)}
          </h2>
          <div className="elevari-divider-gold mx-auto mt-5" />
          <p className="mt-5 text-elevari-muted leading-relaxed">
            {tServer('Common', 'glampingCare', language)}
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <div
              key={p.titleKey}
              className="elevari-card-elevated group p-7 animate-slide-up backdrop-blur-sm bg-elevari-surface/90"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border border-elevari-amber/30 bg-elevari-ivory text-lg text-elevari-slate transition group-hover:border-elevari-amber group-hover:bg-elevari-forest-deep group-hover:text-elevari-amber-soft"
              >
                {p.icon}
              </span>
              <h3 className="mt-5 font-semibold text-elevari-slate">{tServer('Common', p.titleKey, language)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-elevari-muted">{tServer('Common', p.descKey, language)}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/properties/glamping-wana" className="elevari-btn-primary inline-flex min-h-[48px] !px-8">
            {tServer('Common', 'bookNow', language)}
          </Link>
        </div>
      </div>
    </section>
  );
}
