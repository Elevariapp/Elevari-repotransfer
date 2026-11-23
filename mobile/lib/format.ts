import { parseISODate } from './dates';

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function groupThousands(value: number): string {
  return Math.round(Math.abs(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Money in es-CO style (`$ 1.250.000`); falls back to manual grouping when Intl is unavailable.
export function formatMoney(amount: number, currency = 'COP'): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
    if (/\d/.test(formatted)) return formatted;
  } catch {
    // Intl may be missing or reject the currency code; use the manual format below.
  }
  const sign = value < 0 ? '-' : '';
  const prefix = currency === 'COP' ? '$' : `${currency} `;
  return `${sign}${prefix}${groupThousands(value)}`;
}

// The API prices Colombian listings in COP and every other country in USD.
export function currencyForCountry(country: string | null | undefined): string {
  return country === 'CO' ? 'COP' : 'USD';
}

function formatParts(year: number, month: number, day: number, withYear: boolean): string {
  const base = `${day} ${MONTHS_SHORT[month - 1]}`;
  return withYear ? `${base} ${year}` : base;
}

function partsOf(value: string): { year: number; month: number; day: number } | null {
  // Date-only strings are calendar dates and must never go through the device time zone.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return parseISODate(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

// `2026-03-05` or an ISO timestamp → `5 mar 2026`
export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const parts = partsOf(value);
  return parts ? formatParts(parts.year, parts.month, parts.day, true) : value;
}

// `5 – 8 mar 2026`, `28 feb – 3 mar 2026`, `30 dic 2026 – 2 ene 2027`
export function formatDateRange(checkIn: string, checkOut: string): string {
  const a = parseISODate(checkIn);
  const b = parseISODate(checkOut);
  if (!a || !b) return `${checkIn} – ${checkOut}`;
  if (a.year !== b.year) {
    return `${formatParts(a.year, a.month, a.day, true)} – ${formatParts(b.year, b.month, b.day, true)}`;
  }
  if (a.month !== b.month) {
    return `${formatParts(a.year, a.month, a.day, false)} – ${formatParts(b.year, b.month, b.day, true)}`;
  }
  return `${a.day} – ${formatParts(b.year, b.month, b.day, true)}`;
}

// `2026-03-05T14:00:00Z` → `5 mar 2026, 9:00 a. m.` (local time)
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatParts(date.getFullYear(), date.getMonth() + 1, date.getDate(), true)}, ${hour12}:${minutes} ${suffix}`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi',
  fogata: 'Fogata',
  vista: 'Vista panorámica',
  estacionamiento: 'Estacionamiento',
};

// `amenities` is a JSON column: normally string[], but be defensive about objects / CSV strings.
export function normalizeAmenities(value: unknown): string[] {
  let raw: string[] = [];
  if (Array.isArray(value)) {
    raw = value.filter((item): item is string => typeof item === 'string');
  } else if (typeof value === 'string') {
    raw = value.split(',');
  } else if (value && typeof value === 'object') {
    raw = Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key);
  }

  const seen = new Set<string>();
  const labels: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const label = AMENITY_LABELS[trimmed.toLowerCase()] ?? trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    labels.push(label);
  }
  return labels;
}
