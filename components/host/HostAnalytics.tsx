'use client';

import Link from 'next/link';
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import { formatCop, formatStayDate } from '@/lib/format';
import { fetchHostAnalytics, type HostAnalyticsData } from './analytics-api';
import { errorStatus, hostErrorMessage, isUnauthorized } from './errors';
import HostGate, { SessionExpiredNotice } from './HostGate';
import { propertyStatusMeta } from './property-status';

const DAY_MS = 86_400_000;
const BOGOTA_OFFSET_MS = 5 * 3_600_000;
const MAX_RANGE_DAYS = 731;
const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

const PRESETS = [7, 30, 90] as const;

interface DateRange {
  start: string;
  end: string;
}

const dayString = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const number = (value: number) => value.toLocaleString('es-CO');
const percent = (value: number) => `${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
const plural = (count: number, one: string, many: string) => `${number(count)} ${count === 1 ? one : many}`;

/** The last `days` calendar days ending today in Colombia time (UTC-5), which is how the API counts days too. */
function presetRange(days: number): DateRange {
  const today = Date.now() - BOGOTA_OFFSET_MS;
  return { start: dayString(today - (days - 1) * DAY_MS), end: dayString(today) };
}

/** Same rules as the API (`api/src/lib/analytics/range.ts`), so people see the reason before any request. */
function rangeError({ start, end }: DateRange): string | null {
  if (!DAY_FORMAT.test(start) || !DAY_FORMAT.test(end)) return 'Elige la fecha inicial y la fecha final.';
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || dayString(from) !== start || dayString(to) !== end) {
    return 'Alguna de las fechas no es válida.';
  }
  if ([start, end].some((day) => Number(day.slice(0, 4)) < 2000 || Number(day.slice(0, 4)) > 2100)) {
    return 'Las fechas deben estar entre los años 2000 y 2100.';
  }
  if (from > to) return 'La fecha inicial no puede ser posterior a la fecha final.';
  if ((to - from) / DAY_MS + 1 > MAX_RANGE_DAYS) return `El rango máximo es de ${MAX_RANGE_DAYS} días.`;
  return null;
}

export default function HostAnalytics() {
  return (
    <HostGate redirectTo="/host/analytics" hostOnly>
      <Analytics />
    </HostGate>
  );
}

function Analytics() {
  const [preset, setPreset] = useState<number | 'custom'>(30);
  const [range, setRange] = useState<DateRange>(() => presetRange(30));
  const [draft, setDraft] = useState<DateRange>(range);
  const [rangeProblem, setRangeProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<HostAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status: number | null } | null>(null);
  const startId = useId();
  const endId = useId();
  const problemId = useId();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchHostAnalytics(range, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError({
          message: hostErrorMessage(err, 'No pudimos cargar tus analíticas.'),
          status: errorStatus(err),
        });
        setLoading(false);
      });
    return () => controller.abort();
  }, [range.start, range.end, attempt]);

  const choosePreset = (days: number) => {
    const next = presetRange(days);
    setPreset(days);
    setDraft(next);
    setRangeProblem(null);
    setRange(next);
  };

  const applyCustomRange = (event: FormEvent) => {
    event.preventDefault();
    const problem = rangeError(draft);
    setRangeProblem(problem);
    if (problem) return;
    setPreset('custom');
    setRange({ ...draft });
  };

  let content: ReactNode;
  if (error) {
    content = isUnauthorized(error) ? (
      <SessionExpiredNotice redirectTo="/host/analytics" />
    ) : (
      <div role="alert" className="elevari-card p-8 text-center">
        <p className="text-elevari-error">{error.message}</p>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="elevari-btn-ghost mt-6 min-h-[44px]">
          Reintentar
        </button>
      </div>
    );
  } else if (!data) {
    content = (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Cargando tus analíticas…</span>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="elevari-card h-32 animate-pulse" />
          ))}
        </div>
        <div className="elevari-card h-56 animate-pulse" aria-hidden="true" />
      </div>
    );
  } else {
    content = <Results data={data} loading={loading} />;
  }

  return (
    <div className="space-y-8">
      <section aria-label="Período" className="elevari-card flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
        <div role="group" aria-label="Períodos rápidos" className="flex flex-wrap gap-2">
          {PRESETS.map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={preset === days}
              onClick={() => choosePreset(days)}
              className={`elevari-chip min-h-[44px] flex-none ${preset === days ? 'elevari-chip-active' : ''}`}
            >
              Últimos {days} días
            </button>
          ))}
        </div>
        <form onSubmit={applyCustomRange} noValidate className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-44">
            <label htmlFor={startId} className="elevari-label block">
              Desde
            </label>
            <input
              id={startId}
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={draft.start}
              onChange={(event) => setDraft((d) => ({ ...d, start: event.target.value }))}
              aria-invalid={rangeProblem ? true : undefined}
              aria-describedby={rangeProblem ? problemId : undefined}
              className="elevari-input"
            />
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor={endId} className="elevari-label block">
              Hasta
            </label>
            <input
              id={endId}
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={draft.end}
              onChange={(event) => setDraft((d) => ({ ...d, end: event.target.value }))}
              aria-invalid={rangeProblem ? true : undefined}
              aria-describedby={rangeProblem ? problemId : undefined}
              className="elevari-input"
            />
          </div>
          <button type="submit" className="elevari-btn-ghost min-h-[44px]">
            Aplicar
          </button>
        </form>
        {rangeProblem && (
          <p id={problemId} role="alert" className="w-full text-sm font-medium text-elevari-error">
            {rangeProblem}
          </p>
        )}
      </section>

      {content}
    </div>
  );
}

function Results({ data, loading }: { data: HostAnalyticsData; loading: boolean }) {
  const { revenue, occupancy, performance, insights, period } = data;
  const { properties, propertiesCount, draftPropertiesCount } = performance;

  if (propertiesCount === 0) {
    return draftPropertiesCount > 0 ? (
      <div className="elevari-card p-8 text-center">
        <p className="font-semibold text-elevari-slate">
          {draftPropertiesCount === 1 ? 'Tu espacio está en revisión' : 'Tus espacios están en revisión'}
        </p>
        <p className="mt-2 text-elevari-muted">
          Cuando publiquemos tu primer espacio verás aquí tus reservas, ocupación e ingresos.
        </p>
        <Link href="/host" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Ver mis espacios
        </Link>
      </div>
    ) : (
      <div className="elevari-card p-8 text-center">
        <p className="font-semibold text-elevari-slate">Aún no tienes espacios</p>
        <p className="mt-2 text-elevari-muted">
          Publica tu primer espacio y aquí verás tus reservas, ocupación e ingresos.
        </p>
        <Link href="/host/add-property" className="elevari-btn-primary mt-6 inline-flex min-h-[48px]">
          Publicar tu primer espacio
        </Link>
      </div>
    );
  }

  const titleById = new Map(properties.map((p) => [p.propertyId, p.propertyTitle]));

  return (
    <div aria-busy={loading} className={`space-y-8 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      <p className="text-sm text-elevari-muted">
        Del {formatStayDate(period.start_date)} al {formatStayDate(period.end_date)} ·{' '}
        {plural(period.days, 'día', 'días')}
      </p>

      <div className="space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            featured
            label="Tus ingresos"
            value={formatCop(revenue.hostEarnings)}
            hint="Lo que recibes, después de la comisión de Elevari y los reembolsos"
          />
          <Kpi label="Reservas" value={number(revenue.bookingsCount)} hint="Hechas en este período" />
          <Kpi
            label="Noches vendidas"
            value={number(revenue.nightsSold)}
            hint={
              revenue.nightsSold > 0
                ? `Tus huéspedes pagan en promedio ${formatCop(revenue.adr)} por noche`
                : 'Aún no hay noches vendidas'
            }
          />
          <Kpi
            label="Ocupación"
            value={percent(occupancy.occupancyRate)}
            hint={`${number(occupancy.nightsBooked)} de ${number(occupancy.nightsAvailable)} noches disponibles`}
          />
        </dl>

        <dl className="elevari-card grid gap-4 p-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-elevari-muted">Total pagado por tus huéspedes</dt>
            <dd className="mt-1 font-semibold tabular-nums text-elevari-slate">{formatCop(revenue.netRevenue)}</dd>
            <dd className="text-xs text-elevari-muted">Con la tarifa de servicio y sin reembolsos</dd>
          </div>
          <div>
            <dt className="text-elevari-muted">Reembolsos</dt>
            <dd className="mt-1 font-semibold tabular-nums text-elevari-slate">{formatCop(revenue.refundsTotal)}</dd>
          </div>
          <div>
            <dt className="text-elevari-muted">Ingreso por noche disponible</dt>
            <dd className="mt-1 font-semibold tabular-nums text-elevari-slate">{formatCop(revenue.revpar)}</dd>
            <dd className="text-xs text-elevari-muted">Lo pagado por huéspedes entre las noches disponibles</dd>
          </div>
        </dl>

        <p className="text-xs text-elevari-muted">
          Ingresos y reservas se cuentan por la fecha en que se hizo la reserva; la ocupación, por las noches de
          estadía que caen dentro del período.
        </p>
      </div>

      {revenue.bookingsCount === 0 && (
        <p className="rounded-xl border border-elevari-amber/30 bg-elevari-ivory/80 p-4 text-sm text-elevari-slate">
          No hay reservas hechas en este período. Prueba con un rango más amplio o mejora tus publicaciones con fotos
          de calidad.
        </p>
      )}

      <section aria-labelledby="analytics-by-property">
        <h2 id="analytics-by-property" className="text-lg font-semibold text-elevari-slate">
          Por espacio
        </h2>
        <div className="elevari-card mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs sm:min-w-[34rem] sm:text-sm">
            <caption className="sr-only">Reservas, noches vendidas, ocupación e ingresos de cada espacio</caption>
            <thead className="border-b border-elevari-border text-xs text-elevari-muted">
              <tr>
                <th scope="col" className="px-1.5 py-3 font-semibold sm:px-4">
                  Espacio
                </th>
                <th scope="col" className="px-1.5 py-3 text-right font-semibold sm:px-4">
                  Reservas
                </th>
                <th scope="col" className="px-1.5 py-3 text-right font-semibold sm:px-4">
                  Noches vendidas
                </th>
                <th scope="col" className="px-1.5 py-3 text-right font-semibold sm:px-4">
                  Ocupación
                </th>
                <th scope="col" className="px-1.5 py-3 text-right font-semibold sm:px-4">
                  Tus ingresos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-elevari-border">
              {properties.map((p) => {
                const meta = propertyStatusMeta(p.propertyStatus);
                return (
                  <tr key={p.propertyId}>
                    <th scope="row" className="px-1.5 py-3 font-medium text-elevari-slate sm:px-4">
                      <span className="block">{p.propertyTitle}</span>
                      {p.propertyStatus !== 'published' && (
                        <Badge tone={meta.tone} className="mt-1">
                          {meta.label}
                        </Badge>
                      )}
                    </th>
                    <td className="px-1.5 py-3 text-right tabular-nums sm:px-4">{number(p.metrics.bookingsCount)}</td>
                    <td className="px-1.5 py-3 text-right tabular-nums sm:px-4">{number(p.metrics.nightsSold)}</td>
                    <td className="px-1.5 py-3 text-right tabular-nums sm:px-4">{percent(p.metrics.occupancyRate)}</td>
                    <td className="px-1.5 py-3 text-right tabular-nums sm:px-4">{formatCop(p.metrics.hostEarnings)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {draftPropertiesCount > 0 && (
          <p className="mt-3 text-sm text-elevari-muted">
            {draftPropertiesCount === 1
              ? '1 espacio en revisión no aparece aquí hasta que lo publiquemos.'
              : `${draftPropertiesCount} espacios en revisión no aparecen aquí hasta que los publiquemos.`}
          </p>
        )}
      </section>

      {insights.length > 0 && (
        <section aria-labelledby="analytics-insights">
          <h2 id="analytics-insights" className="text-lg font-semibold text-elevari-slate">
            Recomendaciones
          </h2>
          <ul className="mt-3 space-y-3">
            {insights.map((insight, index) => {
              const names = (insight.properties ?? [])
                .map((p) => titleById.get(p.id))
                .filter((title): title is string => Boolean(title));
              return (
                <li key={`${insight.type}-${index}`} className="elevari-card p-4">
                  <p className="font-medium text-elevari-slate">{insight.message}</p>
                  {names.length > 0 && <p className="mt-1 text-sm text-elevari-muted">Espacios: {names.join(', ')}</p>}
                  {insight.recommendation && (
                    <p className="mt-1 text-sm text-elevari-muted">{insight.recommendation}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  featured,
}: {
  label: string;
  value: string;
  hint: string;
  featured?: boolean;
}) {
  return (
    <div className={`elevari-card p-5 ${featured ? 'ring-2 ring-elevari-amber/40' : ''}`}>
      <dt className="text-sm font-medium text-elevari-muted">{label}</dt>
      <dd className="mt-2 text-2xl font-bold tabular-nums text-elevari-slate">{value}</dd>
      <dd className="mt-1 text-xs text-elevari-muted">{hint}</dd>
    </div>
  );
}
