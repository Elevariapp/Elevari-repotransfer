import Header from '@/components/Header';
import { apiBase } from '@/lib/api-base';

// Must reflect live API status; never prerender at build time (no API in the Docker build).
export const dynamic = 'force-dynamic';

async function getApiHealth() {
  const base = apiBase();
  try {
    const res = await fetch(`${base}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as { status: string; database: string; service: string };
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const api = await getApiHealth();

  return (
    <>
      <Header />
      <main id="contenido" className="elevari-container py-10">
        <div className="mx-auto max-w-lg elevari-card p-8">
          <p className="elevari-eyebrow">Sistema</p>
          <h1 className="mt-2 font-display text-2xl text-elevari-slate">Estado del sistema</h1>
          {api ? (
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-elevari-muted">API</span>
                <span className="font-medium text-elevari-slate">{api.status}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-elevari-muted">Base de datos</span>
                <span className="font-medium">{api.database}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-elevari-muted">Servicio</span>
                <span className="font-medium">{api.service}</span>
              </li>
            </ul>
          ) : (
            <p className="mt-6 text-red-700">No se pudo contactar la API.</p>
          )}
        </div>
      </main>
    </>
  );
}
