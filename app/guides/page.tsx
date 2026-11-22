import Link from 'next/link';
import { guides } from '@/content/guides';

export const metadata = {
  title: 'Guías Elevari',
  description: 'Guías oficiales verificadas sobre reservas, pagos, cancelaciones y uso de Elevari.',
};

export default function GuidesPage() {
  return (
    <main className="elevari-container py-12">
      <h1 className="elevari-display-section">Guías</h1>
      <p className="mt-4 text-elevari-muted">Contenido editorial verificado basado en inventario real y funcionalidades reales.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {guides.map(g => (
          <article key={g.slug} className="rounded-2xl border border-elevari-border p-6">
            <h2 className="text-xl font-semibold">{g.title}</h2>
            <p className="mt-2 text-sm text-elevari-muted">{g.description}</p>
            <p className="mt-2 text-xs text-elevari-muted">Categoría: {g.category}</p>
            <Link href={`/guides/${g.slug}`} className="mt-4 inline-block text-elevari-forest font-semibold underline">Leer guía</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
