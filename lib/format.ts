export function formatCop(amount: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoney(amount: number, currency = 'COP') {
  if (currency === 'COP') return formatCop(amount);
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Stay dates are calendar days (YYYY-MM-DD), not instants. Parsing them as a Date and printing in the
 * viewer's zone shows the previous day in Colombia (UTC-5), so those are formatted in UTC instead.
 */
function formatDay(value: string, options: Intl.DateTimeFormatOptions): string {
  const dayOnly = DATE_ONLY.test(value);
  const date = new Date(dayOnly ? `${value}T00:00:00Z` : value);
  return date.toLocaleDateString('es-CO', dayOnly ? { ...options, timeZone: 'UTC' } : options);
}

export function formatStayDate(value: string, withYear = true) {
  return formatDay(value, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
}

/** A moment in time (payment, notification), shown as the calendar day it was in Colombia. */
export function formatInstantDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });
}

export function formatDateRange(checkIn: string, checkOut: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${formatDay(checkIn, opts)} – ${formatDay(checkOut, opts)}`;
}

/** "hace 5 minutos", "ayer"; falls back to the calendar date after a week. */
export function formatRelativeTime(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const distance = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat('es-CO', { numeric: 'auto' });
  if (distance < 60) return 'justo ahora';
  if (distance < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (distance < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (distance < 7 * 86400) return rtf.format(Math.round(seconds / 86400), 'day');
  return formatInstantDate(iso);
}
