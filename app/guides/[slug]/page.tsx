import { notFound } from 'next/navigation';
import { guides } from '@/content/guides';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides.find(g => g.slug === slug);
  if (!guide) return { title: 'Guía no encontrada' };
  return {
    title: guide.title,
    description: guide.description,
  };
}

export async function generateStaticParams() {
  return guides.map(g => ({ slug: g.slug }));
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides.find(g => g.slug === slug);
  if (!guide) return notFound();

  return (
    <main className="elevari-container py-12 max-w-3xl">
      <h1 className="elevari-display-section">{guide.title}</h1>
      <p className="mt-4 text-lg text-elevari-muted">{guide.heroSummary}</p>
      <p className="mt-2 text-xs text-elevari-muted">Última revisión: {new Date(guide.reviewedAt).toLocaleDateString()}</p>

      <section className="mt-8">
        <h2 className="elevari-section-title">Introducción</h2>
        <p>{guide.sections.introduccion}</p>
      </section>

      <section className="mt-8">
        <h2 className="elevari-section-title">Qué debes saber</h2>
        <ul className="list-disc pl-5">
          {guide.sections.queDebesSaber.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="elevari-section-title">Cómo funciona en Elevari</h2>
        <ol className="list-decimal pl-5">
          {guide.sections.comoFunciona.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="elevari-section-title">FAQ</h2>
        <dl>
          {guide.faq.map((f, i) => (
            <div key={i} className="mb-4">
              <dt className="font-semibold">{f.question}</dt>
              <dd className="text-elevari-muted">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="elevari-section-title">Colecciones relacionadas</h2>
        <ul className="list-disc pl-5">
          {guide.relatedCollections.map(c => <li key={c}><a href={`/${c}`} className="underline">{c}</a></li>)}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="elevari-section-title">Próximos pasos</h2>
        <p>Explora nuestras colecciones verificadas y reserva con confianza.</p>
      </section>
    </main>
  );
}
