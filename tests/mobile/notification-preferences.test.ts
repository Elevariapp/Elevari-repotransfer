import { describe, expect, it } from 'vitest';
import {
  EMAIL_PREFERENCE_ROWS,
  PUSH_PREFERENCE_ROWS,
  preferencePatch,
  preferenceValue,
  visibleRows,
  withPreference,
} from '../../mobile/lib/notification-preferences';
import type { NotificationPreferences } from '../../mobile/lib/types';

const PREFS: NotificationPreferences = {
  email: { reminders: true, host_bookings: true },
  push: { bookings: true, reminders: false, host_bookings: true },
};

const pushReminders = PUSH_PREFERENCE_ROWS.find((row) => row.id === 'push-reminders')!;
const emailHostBookings = EMAIL_PREFERENCE_ROWS.find((row) => row.id === 'email-host-bookings')!;

describe('notification preferences (mobile)', () => {
  it('hides the host switches from guests and shows them to hosts', () => {
    const guest = [...visibleRows(EMAIL_PREFERENCE_ROWS, false), ...visibleRows(PUSH_PREFERENCE_ROWS, false)];
    expect(guest.every((row) => !row.hostOnly)).toBe(true);
    expect(guest.map((row) => row.id)).toEqual(['email-reminders', 'push-bookings', 'push-reminders']);

    const host = [...visibleRows(EMAIL_PREFERENCE_ROWS, true), ...visibleRows(PUSH_PREFERENCE_ROWS, true)];
    expect(host.map((row) => row.id)).toContain('email-host-bookings');
    expect(host.map((row) => row.id)).toContain('push-host-bookings');
  });

  it('reads the value of a row from its own channel', () => {
    expect(preferenceValue(PREFS, pushReminders)).toBe(false);
    expect(preferenceValue(PREFS, emailHostBookings)).toBe(true);
  });

  it('sends only the changed key, under the right channel, in the PATCH body', () => {
    expect(preferencePatch(pushReminders, true)).toEqual({ push: { reminders: true } });
    expect(preferencePatch(emailHostBookings, false)).toEqual({ email: { host_bookings: false } });
  });

  it('updates one switch without touching the rest, and can undo it', () => {
    const next = withPreference(PREFS, pushReminders, true);
    expect(next.push).toEqual({ bookings: true, reminders: true, host_bookings: true });
    expect(next.email).toEqual(PREFS.email);
    expect(PREFS.push.reminders).toBe(false);
    expect(withPreference(next, pushReminders, false)).toEqual(PREFS);
  });
});
