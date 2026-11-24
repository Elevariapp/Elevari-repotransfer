import { describe, expect, it } from 'vitest';
import { notificationHref } from '../../lib/notification-links';

const BOOKING = '3f6c9a52-71d4-4f0e-9b86-2d7c1a5e8b40';

describe('notificationHref', () => {
  it('sends a host to the reservations list for new and cancelled bookings', () => {
    expect(notificationHref({ type: 'host_new_booking', booking_id: BOOKING })).toBe('/host/bookings');
    expect(notificationHref({ type: 'host_booking_cancelled', booking_id: BOOKING })).toBe('/host/bookings');
  });

  it('keeps guest bookings and payments on their own pages', () => {
    expect(notificationHref({ type: 'booking_confirmed', booking_id: BOOKING })).toBe(`/checkout/${BOOKING}/success`);
    expect(notificationHref({ type: 'payment_failed', booking_id: BOOKING })).toBe(`/checkout/${BOOKING}`);
    expect(notificationHref({ type: 'payment_failed', booking_id: null })).toBe('/account/payments');
  });

  it('opens the security page for a password change and the account for everything else', () => {
    expect(notificationHref({ type: 'password_changed', booking_id: null })).toBe('/account/security');
    expect(notificationHref({ type: 'check_in_soon', booking_id: BOOKING })).toBe('/account');
    expect(notificationHref({ type: 'something_new', booking_id: null })).toBe('/account');
  });
});
