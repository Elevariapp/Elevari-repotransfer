import Header from '@/components/Header';

async function getApiHealth() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/health`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json() as Promise<{ status: string; database: string; service: string }>;
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
