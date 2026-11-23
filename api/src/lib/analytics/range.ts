/**
 * Shared date-range and scope helpers for the analytics engines and routes.
 *
 * Ranges are whole calendar days in Colombia time (UTC-5, no DST). Stay dates
 * (`@db.Date` columns) are UTC midnights, timestamps (`createdAt`) are instants,
 * so every range carries both flavours of bounds.
 */
import { z } from 'zod';

const DAY_MS = 86_400_000;
const BOGOTA_OFFSET_MS = 5 * 3_600_000;

export const DEFAULT_RANGE_DAYS = 30;
export const MAX_RANGE_DAYS = 731;
const MAX_IDS = 100;

export interface AnalyticsRange {
  /** First and last day included, as YYYY-MM-DD. */
  startDate: string;
  endDate: string;
  /** Number of calendar days, both ends included. */
  days: number;
  /** Bounds for `@db.Date` columns: UTC midnight of the first day / of the day after the last. */
  startDay: Date;
  endDayExclusive: Date;
  /** Bounds for timestamp columns: the same days in Colombia time. */
  startAt: Date;
  endAtExclusive: Date;
}

export type RangeResult = { ok: true; range: AnalyticsRange } | { ok: false; message: string };

/** UTC midnight (ms) of a real YYYY-MM-DD calendar date, or null. */
function parseDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2000 || year > 2100) return null;
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return ms;
}

function toDayString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayInBogota(now: Date = new Date()): string {
  return toDayString(now.getTime() - BOGOTA_OFFSET_MS);
}

/** Builds a range from the query values; defaults to the last 30 days ending today (Colombia). */
export function resolveRange(
  startInput?: string,
  endInput?: string,
  now: Date = new Date(),
): RangeResult {
  const start = startInput?.trim() || undefined;
  const end = endInput?.trim() || undefined;

  let endMs = parseDay(todayInBogota(now))!;
  if (end !== undefined) {
    const parsed = parseDay(end);
    if (parsed === null) {
      return { ok: false, message: 'La fecha final no es válida. Usa el formato AAAA-MM-DD.' };
    }
    endMs = parsed;
  }

  let startMs = endMs - (DEFAULT_RANGE_DAYS - 1) * DAY_MS;
  if (start !== undefined) {
    const parsed = parseDay(start);
    if (parsed === null) {
      return { ok: false, message: 'La fecha inicial no es válida. Usa el formato AAAA-MM-DD.' };
    }
    startMs = parsed;
  }

  if (startMs > endMs) {
    return { ok: false, message: 'La fecha inicial no puede ser posterior a la fecha final.' };
  }

  const days = (endMs - startMs) / DAY_MS + 1;
  if (days > MAX_RANGE_DAYS) {
    return { ok: false, message: `El rango máximo es de ${MAX_RANGE_DAYS} días.` };
  }

  return {
    ok: true,
    range: {
      startDate: toDayString(startMs),
      endDate: toDayString(endMs),
      days,
      startDay: new Date(startMs),
      endDayExclusive: new Date(endMs + DAY_MS),
      startAt: new Date(startMs + BOGOTA_OFFSET_MS),
      endAtExclusive: new Date(endMs + DAY_MS + BOGOTA_OFFSET_MS),
    },
  };
}

/** Nights of the stay [checkIn, checkOut) that fall inside the range. */
export function overlapNights(range: AnalyticsRange, checkIn: Date, checkOut: Date): number {
  const from = Math.max(checkIn.getTime(), range.startDay.getTime());
  const to = Math.min(checkOut.getTime(), range.endDayExclusive.getTime());
  return to > from ? Math.round((to - from) / DAY_MS) : 0;
}

/** Accepts `?ids=a&ids=b` and `?ids=a,b`. */
export const idListSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const raw = Array.isArray(value) ? value : [value];
    return [...new Set(raw.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean))];
  })
  .refine((ids) => ids === undefined || ids.length <= MAX_IDS, {
    message: `Máximo ${MAX_IDS} identificadores.`,
  });

export interface ScopeFilters {
  range: AnalyticsRange;
  propertyIds?: string[];
  hostIds?: string[];
}

/** Properties that can take bookings; drafts are still pending review and never count as available. */
export function bookablePropertyWhere(filters: Pick<ScopeFilters, 'propertyIds' | 'hostIds'>) {
  return {
    status: { not: 'draft' as const },
    ...(filters.propertyIds?.length ? { id: { in: filters.propertyIds } } : {}),
    ...(filters.hostIds?.length ? { hostId: { in: filters.hostIds } } : {}),
  };
}
