import type { BookingStatus, PaymentStatus } from '@/types';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCop(amount: number | null | undefined): string {
  return copFormatter.format(amount ?? 0);
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-12-05" (or ISO timestamp) -> "5 dic 2026". Avoids Date to prevent timezone shifts. */
export function formatDate(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!match) return value ?? '';
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  return `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
}

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: 'Borrador',
  pending_payment: 'Pendiente de pago',
  confirmed: 'Confirmada',
  checked_in: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export function bookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  succeeded: 'Pagado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
  partially_refunded: 'Reembolsado parcialmente',
  refunded: 'Reembolsado',
};

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status as PaymentStatus] ?? status;
}

const PROPERTY_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  unavailable: 'No disponible',
  maintenance: 'En mantenimiento',
};

export function propertyStatusLabel(status: string): string {
  return PROPERTY_STATUS_LABELS[status] ?? status;
}

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in YYYY-MM-DD form. */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function toAmenityList(amenities: unknown): string[] {
  return Array.isArray(amenities) ? amenities.filter((a): a is string => typeof a === 'string') : [];
}

/** Masks typed digits as AAAA-MM-DD. */
export function maskIsoDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
