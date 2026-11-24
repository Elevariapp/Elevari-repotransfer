import { describe, expect, it } from 'vitest';
import {
  HOST_BOOKING_SCOPES,
  HOST_BOOKINGS_EMPTY,
  hostBookingStatus,
  hostReceivesLabel,
} from '../../mobile/lib/host-bookings';

describe('host bookings (mobile)', () => {
  it('has a tab and an empty state for every scope the API accepts', () => {
    expect(HOST_BOOKING_SCOPES.map((scope) => scope.value)).toEqual(['upcoming', 'past', 'cancelled']);
    for (const { value } of HOST_BOOKING_SCOPES) {
      expect(HOST_BOOKINGS_EMPTY[value].title).not.toHaveLength(0);
      expect(HOST_BOOKINGS_EMPTY[value].message).not.toHaveLength(0);
    }
  });

  it('labels a cancelled booking as cancelled in any scope', () => {
    expect(hostBookingStatus('cancelled', 'cancelled')).toEqual({ label: 'Cancelada', tone: 'danger' });
    expect(hostBookingStatus('upcoming', 'cancelled')).toEqual({ label: 'Cancelada', tone: 'danger' });
  });

  it('calls a stay that already ended "Finalizada" even when nobody marked it completed', () => {
    expect(hostBookingStatus('past', 'confirmed')).toEqual({ label: 'Finalizada', tone: 'neutral' });
    expect(hostBookingStatus('upcoming', 'completed')).toEqual({ label: 'Finalizada', tone: 'neutral' });
  });

  it('shows upcoming stays as confirmed and the one in progress as "En curso"', () => {
    expect(hostBookingStatus('upcoming', 'confirmed')).toEqual({ label: 'Confirmada', tone: 'success' });
    expect(hostBookingStatus('upcoming', 'checked_in')).toEqual({ label: 'En curso', tone: 'info' });
  });

  it('never promises a cancelled booking will pay the host', () => {
    expect(hostReceivesLabel('confirmed')).toBe('Recibes');
    expect(hostReceivesLabel('cancelled')).toBe('Habrías recibido');
  });
});
