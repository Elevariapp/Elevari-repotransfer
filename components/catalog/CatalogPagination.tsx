import Link from 'next/link';
import { hasMore, toCatalogHref, type CatalogParams } from '@/lib/catalog-params';

/** Server-rendered pagination: works without JS and stays crawlable. */
export default function CatalogPagination({
  params,
  loaded,
  total,
}: {
  params: CatalogParams;
  loaded: number;
  total: number | null;
}) {
  const more = hasMore(params, loaded, total);
  const from = total === null ? 0 : params.offset + 1;
  const to = params.offset + loaded;

  return (
    <div className="mt-10 flex flex-col items-center gap-4">
      {total !== null && loaded > 0 && (
        <p className="text-sm text-elevari-muted">
          Mostrando {from}–{to} de {total} espacios
        </p>
      )}
      {more && (
        <Link
          href={toCatalogHref(params, { offset: params.offset + params.limit })}
          scroll={false}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-elevari-border bg-elevari-surface px-6 text-sm font-semibold text-elevari-slate transition hover:border-elevari-forest hover:text-elevari-forest"
        >
          Cargar más espacios
        </Link>
      )}
    </div>
  );
}
