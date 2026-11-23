import type { BookingStatus, PaymentStatus } from './types';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: 'Borrador',
  pending_payment: 'Pago pendiente',
  confirmed: 'Confirmada',
  checked_in: 'En estadía',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const BOOKING_STATUS_TONES: Record<BookingStatus, StatusTone> = {
  draft: 'neutral',
  pending_payment: 'warning',
  confirmed: 'success',
  checked_in: 'info',
  completed: 'neutral',
  cancelled: 'danger',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  succeeded: 'Aprobado',
  failed: 'Rechazado',
  cancelled: 'Cancelado',
  partially_refunded: 'Reembolso parcial',
  refunded: 'Reembolsado',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  pending: 'warning',
  processing: 'warning',
  succeeded: 'success',
  failed: 'danger',
  cancelled: 'neutral',
  partially_refunded: 'info',
  refunded: 'info',
};

// A booking whose payment went through (it may already be under way or finished).
export function isPaidBooking(status: BookingStatus): boolean {
  return status === 'confirmed' || status === 'checked_in' || status === 'completed';
}

// Client-generated key that makes a retried POST return the same record instead of a duplicate.
export function newIdempotencyKey(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
