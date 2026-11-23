import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getCollection, COLLECTIONS } from '@/lib/seo/collections';
import { siteUrl } from '@/lib/site-url';
import { wanaApi } from '@/lib/api-client';
import { buildBreadcrumbListSchema, buildFAQPageSchema, buildItemListSchema } from '@/lib/seo/schema';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = getCollection(params.slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description: collection.description,
    alternates: { canonical: siteUrl(collection.canonical) },
    openGraph: {
      title: collection.title,
      description: collection.description,
      url: siteUrl(collection.canonical),
    },
  };
}

export async function generateStaticParams() {
  return COLLECTIONS.map(c => ({ slug: c.slug }));
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = getCollection(params.slug);
  if (!collection) return notFound();

  // Fetch properties matching predicate
  const query: Record<string, string> = {};
  if (collection.predicate.city) query.city = collection.predicate.city;
  if (collection.predicate.amenities?.length) query.amenities = collection.predicate.amenities.join(',');
  query.limit = '24';

  let properties: any[] = [];
  try {
    const res = await wanaApi.listProperties({
      city: query.city,
      amenities: query.amenities,
      limit: Number(query.limit) || 24,
    });
    properties = res.data ?? [];
  } catch {
    properties = [];
  }

  if (properties.length === 0) {
    // SEO Truth Rule: no results → 404
    return notFound();
  }

  const breadcrumb = buildBreadcrumbListSchema([
    { name: 'Home', url: siteUrl() },
    { name: collection.title, url: siteUrl(collection.canonical) },
  ]);
  const itemList = buildItemListSchema(
    properties.map(p => ({ url: siteUrl(`/properties/${p.slug}`), name: p.title })),
    collection.title
  );
  const faqSchema = buildFAQPageSchema(collection.faq);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <main className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold">{collection.title}</h1>
      <p className="mt-4 text-lg text-elevari-slate">{collection.description}</p>
      <div className="mt-6 prose max-w-none">
        <p>{collection.editorial}</p>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Propiedades</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p: any) => (
            <a key={p.id} href={`/properties/${p.slug}`} className="block rounded-xl border p-4 hover:shadow">
              <h3 className="font-medium">{p.title}</h3>
              <p className="text-sm text-elevari-slate">{p.city}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Preguntas frecuentes</h2>
        <dl className="mt-4 space-y-4">
          {collection.faq.map((f, i) => (
            <div key={i}>
              <dt className="font-medium">{f.q}</dt>
              <dd className="text-elevari-slate">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
    </>
  );
}
