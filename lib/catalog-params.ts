/**
 * Catalog query contract (Phase 4 · discovery).
 *
 * Pure functions shared by the properties page, the filter UI and the API
 * client. Everything is sanitized here so the API never receives untrusted
 * values and URLs stay canonical/shareable.
 */

export type CatalogSort = 'recommended' | 'price_asc' | 'price_desc' | 'popular' | 'newest';

export const CATALOG_SORTS: ReadonlyArray<{ value: CatalogSort; label: string }> = [
  { value: 'recommended', label: 'Recomendados' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Más reservados' },
  { value: 'newest', label: 'Novedades' },
];

export const CATALOG_AMENITIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'fogata', label: 'Fogata' },
  { value: 'vista', label: 'Vista panorámica' },
  { value: 'estacionamiento', label: 'Estacionamiento' },
];

export const PRICE_PRESETS: ReadonlyArray<{ value: string; label: string; min?: number; max?: number }> = [
  { value: 'any', label: 'Cualquier precio' },
  { value: 'lt300', label: 'Menos de $300.000', max: 300_000 },
  { value: '300-600', label: '$300.000 – $600.000', min: 300_000, max: 600_000 },
  { value: 'gt600', label: 'Más de $600.000', min: 600_000 },
];

export const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type CatalogParams = {
  city?: string;
  guests?: number;
  checkIn?: string;
  checkOut?: string;
  sort: CatalogSort;
  minPrice?: number;
  maxPrice?: number;
  amenities: string[];
  offset: number;
  limit: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function positiveInt(value: string | undefined, max: number): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) return undefined;
  return parsed;
}

function validDate(value: string | undefined): string | undefined {
  return value && DATE_RE.test(value) ? value : undefined;
}

export function parseCatalogParams(input: RawParams): CatalogParams {
  const sortRaw = first(input.sort) as CatalogSort | undefined;
  const sort = CATALOG_SORTS.some((s) => s.value === sortRaw) ? (sortRaw as CatalogSort) : 'recommended';

  const amenitiesRaw = first(input.amenities);
  const amenities = amenitiesRaw
    ? Array.from(
        new Set(
          amenitiesRaw
            .split(',')
            .map((a) => a.trim().toLowerCase())
            .filter((a) => CATALOG_AMENITIES.some((known) => known.value === a)),
        ),
      ).slice(0, CATALOG_AMENITIES.length)
    : [];

  let minPrice = positiveInt(first(input.min_price), 100_000_000);
  let maxPrice = positiveInt(first(input.max_price), 100_000_000);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const limit = positiveInt(first(input.limit), MAX_LIMIT) || DEFAULT_LIMIT;
  const offset = positiveInt(first(input.offset), 10_000) ?? 0;

  return {
    city: first(input.city)?.trim() || undefined,
    guests: positiveInt(first(input.guests), 20),
    checkIn: validDate(first(input.check_in)),
    checkOut: validDate(first(input.check_out)),
    sort,
    minPrice,
    maxPrice,
    amenities,
    offset,
    limit: Math.max(1, limit),
  };
}

/** Canonical API query (snake_case, stable ordering). */
export function toApiQuery(params: CatalogParams): URLSearchParams {
  const q = new URLSearchParams();
  if (params.city) q.set('city', params.city);
  if (params.guests) q.set('guests', String(params.guests));
  if (params.checkIn) q.set('check_in', params.checkIn);
  if (params.checkOut) q.set('check_out', params.checkOut);
  if (params.sort !== 'recommended') q.set('sort', params.sort);
  if (params.minPrice !== undefined) q.set('min_price', String(params.minPrice));
  if (params.maxPrice !== undefined) q.set('max_price', String(params.maxPrice));
  if (params.amenities.length > 0) q.set('amenities', params.amenities.join(','));
  if (params.offset > 0) q.set('offset', String(params.offset));
  if (params.limit !== DEFAULT_LIMIT) q.set('limit', String(params.limit));
  return q;
}

/** Canonical shareable URL for the catalog page. */
export function toCatalogHref(params: CatalogParams, overrides: Partial<CatalogParams> = {}): string {
  const merged: CatalogParams = { ...params, ...overrides };
  const q = toApiQuery(merged);
  const qs = q.toString();
  return qs ? `/properties?${qs}` : '/properties';
}

export function toggleAmenity(params: CatalogParams, amenity: string): CatalogParams {
  const has = params.amenities.includes(amenity);
  return {
    ...params,
    amenities: has ? params.amenities.filter((a) => a !== amenity) : [...params.amenities, amenity],
    offset: 0,
  };
}

export function pricePreset(params: CatalogParams): string {
  const match = PRICE_PRESETS.find(
    (preset) =>
      (preset.min ?? undefined) === params.minPrice && (preset.max ?? undefined) === params.maxPrice,
  );
  return match?.value ?? 'any';
}

export function activeFilterCount(params: CatalogParams): number {
  let count = 0;
  if (params.city) count += 1;
  if (params.guests) count += 1;
  if (params.checkIn && params.checkOut) count += 1;
  if (params.minPrice !== undefined || params.maxPrice !== undefined) count += 1;
  if (params.amenities.length > 0) count += params.amenities.length;
  if (params.sort !== 'recommended') count += 1;
  return count;
}

export function hasMore(params: CatalogParams, loaded: number, total: number | null): boolean {
  if (total === null) return loaded >= params.limit;
  return params.offset + loaded < total;
}
