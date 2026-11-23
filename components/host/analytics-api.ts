import { getToken } from '@/lib/auth-session';
import { NETWORK_ERROR_MESSAGE, apiErrorMessage, dropSessionOn401 } from '@/lib/media-api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface AnalyticsPeriod {
  start_date: string;
  end_date: string;
  days: number;
}

export interface RevenueMetrics {
  /** What guests paid, fees included, before refunds. */
  grossRevenue: number;
  netRevenue: number;
  refundsTotal: number;
  /** What the host receives after the platform fee and refunds. */
  hostEarnings: number;
  bookingsCount: number;
  nightsSold: number;
  adr: number;
  revpar: number;
}

export interface OccupancyMetrics {
  /** Percent, 0–100. */
  occupancyRate: number;
  nightsBooked: number;
  nightsAvailable: number;
  nightsBlocked: number;
  propertiesCount: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  propertyStatus: string;
  metrics: {
    occupancyRate: number;
    bookingsCount: number;
    nightsSold: number;
    nightsBooked: number;
    hostEarnings: number;
  };
}

export interface HostPerformance {
  /** Properties that can take bookings (everything except drafts). */
  propertiesCount: number;
  draftPropertiesCount: number;
  properties: PropertyPerformance[];
}

export interface Insight {
  type: string;
  message: string;
  recommendation?: string;
  properties?: Array<{ id: string }>;
}

export interface HostAnalyticsData {
  period: AnalyticsPeriod;
  revenue: RevenueMetrics;
  occupancy: OccupancyMetrics;
  performance: HostPerformance;
  insights: Insight[];
}

export class AnalyticsRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'AnalyticsRequestError';
  }
}

async function getMetric<T>(
  name: string,
  query: URLSearchParams,
  signal: AbortSignal,
): Promise<{ data: T; period: AnalyticsPeriod }> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/analytics/${name}?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new AnalyticsRequestError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR');
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    dropSessionOn401(res.status, token);
    const code = (body as { code?: unknown } | null)?.code;
    throw new AnalyticsRequestError(
      apiErrorMessage(res.status, body, 'No pudimos cargar tus analíticas.'),
      res.status,
      typeof code === 'string' ? code : undefined,
    );
  }
  return body as { data: T; period: AnalyticsPeriod };
}

/** Loads every block of the host dashboard for one date range (YYYY-MM-DD, inclusive). The API scopes it to the caller. */
export async function fetchHostAnalytics(
  range: { start: string; end: string },
  signal: AbortSignal,
): Promise<HostAnalyticsData> {
  const query = new URLSearchParams({ start_date: range.start, end_date: range.end });
  const [revenue, occupancy, performance, insights] = await Promise.all([
    getMetric<RevenueMetrics>('revenue', query, signal),
    getMetric<OccupancyMetrics>('occupancy', query, signal),
    getMetric<HostPerformance>('property-performance', query, signal),
    getMetric<Insight[]>('insights', query, signal),
  ]);

  return {
    period: revenue.period,
    revenue: revenue.data,
    occupancy: occupancy.data,
    performance: performance.data,
    insights: insights.data,
  };
}
