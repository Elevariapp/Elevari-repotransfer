import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPreferencesPatch,
  DEFAULT_NOTIFICATION_PREFERENCES,
  preferencesPatchSchema,
  resolveNotificationPreferences,
} from '../src/lib/notification-prefs.js';

describe('resolveNotificationPreferences', () => {
  it('turns everything on when nothing was ever stored', () => {
    assert.deepEqual(resolveNotificationPreferences(null), DEFAULT_NOTIFICATION_PREFERENCES);
    assert.deepEqual(resolveNotificationPreferences(undefined), DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('survives stored values of the wrong shape', () => {
    for (const junk of ['yes', 42, true, [], [true], { email: 'off' }, { push: [false] }, { email: null }]) {
      assert.deepEqual(resolveNotificationPreferences(junk), DEFAULT_NOTIFICATION_PREFERENCES, JSON.stringify(junk));
    }
  });

  it('keeps stored opt-outs and fills in the settings added later', () => {
    const resolved = resolveNotificationPreferences({ email: { reminders: false }, push: { bookings: false } });
    assert.equal(resolved.email.reminders, false);
    assert.equal(resolved.email.host_bookings, true);
    assert.equal(resolved.push.bookings, false);
    assert.equal(resolved.push.reminders, true);
    assert.equal(resolved.push.host_bookings, true);
  });

  it('ignores non-boolean values and settings that do not exist', () => {
    const resolved = resolveNotificationPreferences({
      email: { reminders: 'no', host_bookings: 0, marketing: true },
      push: { unknown: false },
    });
    assert.deepEqual(resolved, DEFAULT_NOTIFICATION_PREFERENCES);
    assert.ok(!('marketing' in resolved.email));
  });
});

describe('preferencesPatchSchema', () => {
  it('accepts a change to one or several optional notifications', () => {
    assert.ok(preferencesPatchSchema.safeParse({ email: { reminders: false } }).success);
    assert.ok(preferencesPatchSchema.safeParse({ push: { bookings: false, host_bookings: true } }).success);
    assert.ok(
      preferencesPatchSchema.safeParse({ email: { host_bookings: false }, push: { reminders: false } }).success,
    );
  });

  it('refuses an empty change', () => {
    for (const patch of [{}, { email: {} }, { push: {} }, { email: {}, push: {} }]) {
      assert.equal(preferencesPatchSchema.safeParse(patch).success, false, JSON.stringify(patch));
    }
  });

  it('refuses to switch off e-mails that must always be sent', () => {
    for (const patch of [
      { email: { booking_confirmation: false } },
      { email: { security: false } },
      { email: { password_reset: false } },
      { push: { security: false } },
      { sms: { bookings: false } },
      { whatsapp: { reminders: false } },
    ]) {
      assert.equal(preferencesPatchSchema.safeParse(patch).success, false, JSON.stringify(patch));
    }
  });

  it('refuses values that are not true or false', () => {
    for (const patch of [{ email: { reminders: 'false' } }, { email: { reminders: 0 } }, { push: { bookings: null } }]) {
      assert.equal(preferencesPatchSchema.safeParse(patch).success, false, JSON.stringify(patch));
    }
  });
});

describe('applyPreferencesPatch', () => {
  it('changes only what the patch names and leaves the input untouched', () => {
    const current = resolveNotificationPreferences({ push: { reminders: false } });
    const next = applyPreferencesPatch(current, { email: { reminders: false }, push: { bookings: false } });

    assert.deepEqual(next, {
      email: { reminders: false, host_bookings: true },
      push: { bookings: false, reminders: false, host_bookings: true },
    });
    assert.equal(current.email.reminders, true);
    assert.equal(current.push.bookings, true);
  });
});
