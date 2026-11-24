import type { AppNotification } from '@/lib/api-client';

/** Where a tap on a notification in the bell leads. */
export function notificationHref(item: Pick<AppNotification, 'type' | 'booking_id'>): string {
  switch (item.type) {
    case 'booking_confirmed':
      return item.booking_id ? `/checkout/${item.booking_id}/success` : '/account';
    case 'payment_failed':
      return item.booking_id ? `/checkout/${item.booking_id}` : '/account/payments';
    case 'host_new_booking':
    case 'host_booking_cancelled':
      return '/host/bookings';
    case 'password_changed':
      return '/account/security';
    default:
      return '/account';
  }
}
