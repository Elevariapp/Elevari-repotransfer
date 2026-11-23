const SPANISH_DATE = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' });
const ENGLISH_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

function toDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Bookings store check-in/out as calendar dates (UTC midnight), so they are formatted in UTC
 * to avoid showing the previous day in Colombia.
 */
export function formatStayDate(value: Date | string): string {
  const date = toDate(value);
  if (!date) return String(value);
  return `${SPANISH_DATE.format(date)} / ${ENGLISH_DATE.format(date)}`;
}

const SPANISH_DATE_TIME = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});
const ENGLISH_DATE_TIME = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

/** Moments (not calendar dates) are shown in Colombian time. */
export function formatDateTime(value: Date): { es: string; en: string } {
  return { es: SPANISH_DATE_TIME.format(value), en: `${ENGLISH_DATE_TIME.format(value)} (Colombia)` };
}

export function formatMoney(amount: number | string, currency = 'COP'): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return String(amount);
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
