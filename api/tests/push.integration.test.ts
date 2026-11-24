import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  day,
  hasTestDatabase,
  skipReason,
  startStack,
  type CapturedPush,
  type TestStack,
  type TestUser,
} from './harness.js';

const newToken = () => `ExponentPushToken[${randomUUID().replace(/-/g, '')}]`;
const isoDay = (offset: number) => day(offset).toISOString().slice(0, 10);
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

describe('push notifications (real database, mock Expo)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;
  let booking: typeof import('../src/lib/booking-push.js');
  let expiry: typeof import('../src/jobs/expire-pending-bookings.js');

  before(async () => {
    stack = await startStack();
    booking = await import('../src/lib/booking-push.js');
    expiry = await import('../src/jobs/expire-pending-bookings.js');
  });
  after(async () => {
    await stack.stop();
  });

  const pushesTo = (token: string): CapturedPush[] => stack.pushes.filter((push) => push.to === token);

  async function registerDevice(user: TestUser, token = newToken(), platform: 'ios' | 'android' = 'android') {
    const res = await stack.call('POST', '/notifications/push-token', { token: user.token, body: { token, platform } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return token;
  }

  async function bookAndPay(guest: TestUser, propertyId: string, startOffset: number): Promise<string> {
    const created = await stack.call('POST', '/bookings', {
      token: guest.token,
      body: {
        property_id: propertyId,
        check_in: isoDay(startOffset),
        check_out: isoDay(startOffset + 2),
        guests: 2,
        idempotency_key: `it-${randomUUID()}`,
      },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const intent = await stack.call('POST', '/payments/intent', {
      token: guest.token,
      body: {
        booking_id: created.body.booking.id,
        idempotency_key: `it-${randomUUID()}`,
        return_url: 'https://elevari.test/pago/resultado',
      },
    });
    assert.equal(intent.status, 201, JSON.stringify(intent.body));
    const paid = await stack.call('POST', `/payments/${intent.body.payment_id}/mock-complete`, { token: guest.token });
    assert.equal(paid.status, 200, JSON.stringify(paid.body));
    return created.body.booking.id as string;
  }

  async function scenario() {
    const host = await stack.registerUser({ role: 'host', name: 'Andrés Host' });
    const guest = await stack.registerUser({ name: 'Camila Rojas' });
    const property = await stack.createProperty(host.id, 'Domo Aurora');
    return {
      host,
      guest,
      property,
      hostDevice: await registerDevice(host),
      guestDevice: await registerDevice(guest, newToken(), 'ios'),
    };
  }

  describe('registering a device', () => {
    it('needs a session', async () => {
      const res = await stack.call('POST', '/notifications/push-token', {
        body: { token: newToken(), platform: 'android' },
      });
      assert.equal(res.status, 401);
    });

    it('accepts Expo tokens, in both spellings, and is idempotent', async () => {
      const user = await stack.registerUser();
      const modern = `ExpoPushToken[${randomUUID().replace(/-/g, '')}]`;
      await registerDevice(user, modern);
      await registerDevice(user, modern);
      await registerDevice(user, newToken(), 'ios');

      assert.equal(await stack.prisma.pushToken.count({ where: { userId: user.id } }), 2);
    });

    it('refuses anything that is not an Expo push token', async () => {
      const user = await stack.registerUser();
      for (const token of ['abc', 'x'.repeat(40), 'ExponentPushToken[]', 'ExponentPushToken[short]', 'fcm:APA91bH...', `${newToken()}x`]) {
        const res = await stack.call('POST', '/notifications/push-token', {
          token: user.token,
          body: { token, platform: 'android' },
        });
        assert.equal(res.status, 400, token);
      }
      assert.equal(await stack.prisma.pushToken.count({ where: { userId: user.id } }), 0);
    });

    it('moves a device to whoever signs in on it', async () => {
      const [first, second] = [await stack.registerUser(), await stack.registerUser()];
      const token = await registerDevice(first);
      await registerDevice(second, token);

      const stored = await stack.prisma.pushToken.findUniqueOrThrow({ where: { token } });
      assert.equal(stored.userId, second.id);
    });

    it('keeps at most the ten most recent devices per account', async () => {
      const user = await stack.registerUser();
      const tokens: string[] = [];
      for (let index = 0; index < 12; index++) {
        tokens.push(await registerDevice(user));
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      const kept = (await stack.prisma.pushToken.findMany({ where: { userId: user.id } })).map((entry) => entry.token);
      assert.equal(kept.length, 10);
      assert.ok(kept.includes(tokens[11]));
      assert.ok(!kept.includes(tokens[0]));
    });
  });

  describe('forgetting a device', () => {
    it('removes only the caller\'s own device', async () => {
      const [owner, stranger] = [await stack.registerUser(), await stack.registerUser()];
      const token = await registerDevice(owner);

      const refused = await stack.call('POST', '/notifications/push-token/unregister', {
        token: stranger.token,
        body: { token },
      });
      assert.equal(refused.status, 200, 'the answer never says whether the token exists');
      assert.equal(await stack.prisma.pushToken.count({ where: { token } }), 1);

      const removed = await stack.call('POST', '/notifications/push-token/unregister', {
        token: owner.token,
        body: { token },
      });
      assert.equal(removed.status, 200);
      assert.equal(await stack.prisma.pushToken.count({ where: { token } }), 0);
    });

    it('needs a session and a token', async () => {
      const user = await stack.registerUser();
      assert.equal((await stack.call('POST', '/notifications/push-token/unregister', { body: { token: newToken() } })).status, 401);
      assert.equal((await stack.call('POST', '/notifications/push-token/unregister', { token: user.token, body: {} })).status, 400);
    });
  });

  describe('sending', () => {
    it('pushes the guest and the host when a booking is paid, in Spanish, with a link back to the booking', async () => {
      const { guest, property, hostDevice, guestDevice } = await scenario();
      const bookingId = await bookAndPay(guest, property.id, 30);

      const toGuest = await stack.waitForPush((push) => push.to === guestDevice);
      const toHost = await stack.waitForPush((push) => push.to === hostDevice);
      assert.equal(toGuest.title, 'Reserva confirmada');
      assert.match(toGuest.body, /^Domo Aurora · /);
      assert.deepEqual(toGuest.data, { type: 'booking_confirmed', booking_id: bookingId });
      assert.equal(toHost.title, 'Nueva reserva');
      assert.deepEqual(toHost.data, { type: 'host_new_booking', booking_id: bookingId });
      assert.equal(toGuest.channelId, 'default');
      assert.equal(toGuest.sound, 'default');
      assert.ok(!JSON.stringify(toHost).includes(guest.email), 'no guest contact data on a lock screen');
    });

    it('respects the opt-outs, one category at a time', async () => {
      const { host, guest, property, hostDevice, guestDevice } = await scenario();
      await stack.call('PATCH', '/notifications/preferences', { token: host.token, body: { push: { host_bookings: false } } });
      await stack.call('PATCH', '/notifications/preferences', { token: guest.token, body: { push: { reminders: false } } });

      await bookAndPay(guest, property.id, 40);
      await stack.waitForPush((push) => push.to === guestDevice);
      await settle();
      assert.equal(pushesTo(hostDevice).length, 0, 'the host switched host booking pushes off');
      assert.equal(pushesTo(guestDevice).length, 1, 'switching reminders off does not silence confirmations');
    });

    it('tells the host about a cancellation, and the guest only when someone else cancelled', async () => {
      const { guest, property, hostDevice, guestDevice } = await scenario();
      const bookingId = await bookAndPay(guest, property.id, 50);
      await stack.waitForPush((push) => push.to === hostDevice && push.title === 'Nueva reserva');
      await stack.waitForPush((push) => push.to === guestDevice);

      const cancelled = await stack.call('POST', `/bookings/${bookingId}/cancel`, { token: guest.token });
      assert.equal(cancelled.status, 200);
      await stack.waitForPush((push) => push.to === hostDevice && push.title === 'Reserva cancelada');
      await settle();
      assert.equal(pushesTo(guestDevice).length, 1, 'the guest cancelled it themselves, no push for that');
    });

    it('lets the guest know when an administrator cancels', async () => {
      const { guest, property, guestDevice, hostDevice } = await scenario();
      const admin = await stack.registerUser();
      await stack.prisma.user.update({ where: { id: admin.id }, data: { role: 'admin' } });
      const bookingId = await bookAndPay(guest, property.id, 60);
      await stack.waitForPush((push) => push.to === hostDevice);

      assert.equal((await stack.call('POST', `/bookings/${bookingId}/cancel`, { token: admin.token })).status, 200);
      await stack.waitForPush((push) => push.to === guestDevice && push.title === 'Reserva cancelada');
    });

    it('tells a guest their unpaid booking expired', async () => {
      const { guest, property, guestDevice } = await scenario();
      const unpaid = await stack.createBooking({
        propertyId: property.id,
        guestId: guest.id,
        status: 'pending_payment',
        checkIn: day(70),
      });
      await stack.prisma.booking.update({
        where: { id: unpaid.id },
        data: { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      });

      await expiry.expireStalePendingBookings();

      const push = await stack.waitForPush((entry) => entry.to === guestDevice);
      assert.equal(push.title, 'Reserva expirada');
      assert.equal(push.data?.type, 'booking_expired');
    });

    it('sends each check-in reminder once, however often the job runs', async () => {
      const { guest, property, guestDevice } = await scenario();
      const stay = await stack.createBooking({ propertyId: property.id, guestId: guest.id, checkIn: day(1) });

      await booking.sendCheckInReminderPushes();
      await booking.sendCheckInReminderPushes();
      await booking.sendCheckInReminderPushes();

      const sent = pushesTo(guestDevice);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].title, 'Tu check-in es mañana');
      assert.deepEqual(sent[0].data, { type: 'check_in_soon', booking_id: stay.id });
      assert.equal(await booking.pushCheckInReminder(stay.id), 'already_sent');
    });

    it('skips the reminder push for a guest who switched reminders off', async () => {
      const { guest, property, guestDevice } = await scenario();
      await stack.createBooking({ propertyId: property.id, guestId: guest.id, checkIn: day(1) });
      await stack.call('PATCH', '/notifications/preferences', { token: guest.token, body: { push: { reminders: false } } });

      await booking.sendCheckInReminderPushes();
      assert.equal(pushesTo(guestDevice).length, 0);
    });

    it('forgets a device that Expo reports as gone', async () => {
      const { guest, property, guestDevice } = await scenario();
      stack.setPushMode('gone');
      try {
        const stay = await stack.createBooking({ propertyId: property.id, guestId: guest.id, checkIn: day(80) });
        const result = await booking.pushBookingConfirmed(stay.id);
        assert.equal(result.sent, 0);
      } finally {
        stack.setPushMode('ok');
      }
      assert.equal(await stack.prisma.pushToken.count({ where: { token: guestDevice } }), 0);
    });

    it('never breaks a booking when the push service is down, and retries the reminder next time', async () => {
      const { guest, property, host, guestDevice } = await scenario();
      stack.setPushMode('fail');
      try {
        const bookingId = await bookAndPay(guest, property.id, 90);
        await stack.waitForEmail((email) => email.to.includes(guest.email) && /Reserva confirmada/.test(email.subject));
        await stack.waitForEmail((email) => email.to.includes(host.email) && /Nueva reserva/.test(email.subject));
        const stored = await stack.call('GET', `/bookings/${bookingId}`, { token: guest.token });
        assert.equal(stored.body.booking.status, 'confirmed');

        const stay = await stack.createBooking({ propertyId: property.id, guestId: guest.id, checkIn: day(1) });
        const result = await booking.pushCheckInReminder(stay.id);
        assert.equal(result === 'already_sent' ? result : result.reason, 'provider_error');
        const reopened = await stack.prisma.booking.findUniqueOrThrow({ where: { id: stay.id } });
        assert.equal(reopened.checkInReminderPushedAt, null, 'released so the next run tries again');
      } finally {
        stack.setPushMode('ok');
      }
      assert.equal(await stack.prisma.pushToken.count({ where: { token: guestDevice } }), 1, 'an outage must not forget devices');
    });

    it('does nothing for accounts with no device, and for deleted accounts', async () => {
      const host = await stack.registerUser({ role: 'host' });
      const bare = await stack.registerUser();
      const property = await stack.createProperty(host.id);
      const before = stack.pushes.length;
      const stay = await stack.createBooking({ propertyId: property.id, guestId: bare.id, checkIn: day(100) });
      assert.deepEqual(await booking.pushBookingConfirmed(stay.id), { sent: 0, reason: 'no_devices' });

      const gone = await stack.registerUser();
      const device = await registerDevice(gone);
      await stack.prisma.user.update({ where: { id: gone.id }, data: { deletedAt: new Date() } });
      const goneStay = await stack.createBooking({ propertyId: property.id, guestId: gone.id, checkIn: day(110) });
      assert.deepEqual(await booking.pushBookingConfirmed(goneStay.id), { sent: 0, reason: 'no_recipient' });

      assert.equal(stack.pushes.length, before);
      assert.equal(pushesTo(device).length, 0);
    });
  });
});
