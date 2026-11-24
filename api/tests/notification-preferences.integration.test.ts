import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  day,
  hasTestDatabase,
  skipReason,
  startStack,
  type CapturedEmail,
  type TestStack,
  type TestUser,
} from './harness.js';

const isoDay = (offset: number) => day(offset).toISOString().slice(0, 10);

describe('notification preferences (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;
  let senders: typeof import('../src/lib/transactional-emails.js');

  before(async () => {
    stack = await startStack();
    senders = await import('../src/lib/transactional-emails.js');
  });
  after(async () => {
    await stack.stop();
  });

  const mailsTo = (address: string, subject?: RegExp): CapturedEmail[] =>
    stack.emails.filter((email) => email.to.includes(address) && (!subject || subject.test(email.subject)));
  const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

  /** Creates a booking through the API and pays it with the mock provider, like the checkout does. */
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

  describe('GET and PATCH /notifications/preferences', () => {
    it('needs a session', async () => {
      assert.equal((await stack.call('GET', '/notifications/preferences')).status, 401);
      assert.equal(
        (await stack.call('PATCH', '/notifications/preferences', { body: { email: { reminders: false } } })).status,
        401,
      );
    });

    it('starts with every optional notification on', async () => {
      const user = await stack.registerUser();
      const res = await stack.call('GET', '/notifications/preferences', { token: user.token });

      assert.equal(res.status, 200);
      assert.deepEqual(res.body.preferences, {
        email: { reminders: true, host_bookings: true },
        push: { bookings: true, reminders: true, host_bookings: true },
      });
      assert.match(String(res.headers['cache-control']), /no-store/);
    });

    it('saves partial changes without losing the earlier ones', async () => {
      const user = await stack.registerUser();
      const first = await stack.call('PATCH', '/notifications/preferences', {
        token: user.token,
        body: { email: { reminders: false } },
      });
      const second = await stack.call('PATCH', '/notifications/preferences', {
        token: user.token,
        body: { push: { bookings: false } },
      });
      const stored = await stack.call('GET', '/notifications/preferences', { token: user.token });

      assert.equal(first.status, 200);
      assert.equal(first.body.preferences.email.reminders, false);
      assert.equal(second.status, 200);
      assert.deepEqual(stored.body.preferences, {
        email: { reminders: false, host_bookings: true },
        push: { bookings: false, reminders: true, host_bookings: true },
      });
    });

    it('can switch a notification back on', async () => {
      const user = await stack.registerUser();
      await stack.call('PATCH', '/notifications/preferences', { token: user.token, body: { push: { reminders: false } } });
      const back = await stack.call('PATCH', '/notifications/preferences', {
        token: user.token,
        body: { push: { reminders: true } },
      });
      assert.equal(back.body.preferences.push.reminders, true);
    });

    it('refuses to switch off e-mails that must always arrive, and junk', async () => {
      const user = await stack.registerUser();
      for (const body of [
        {},
        { email: {} },
        { email: { booking_confirmation: false } },
        { email: { reminders: 'no' } },
        { whatsapp: { reminders: false } },
        'off',
      ]) {
        const res = await stack.call('PATCH', '/notifications/preferences', { token: user.token, body });
        assert.equal(res.status, 400, JSON.stringify(body));
      }
      const stored = await stack.call('GET', '/notifications/preferences', { token: user.token });
      assert.equal(stored.body.preferences.email.reminders, true);
    });

    it('keeps each account\'s choices private', async () => {
      const [a, b] = [await stack.registerUser(), await stack.registerUser()];
      await stack.call('PATCH', '/notifications/preferences', { token: a.token, body: { email: { reminders: false } } });

      const other = await stack.call('GET', '/notifications/preferences', { token: b.token });
      assert.equal(other.body.preferences.email.reminders, true);
    });
  });

  describe('what the API actually sends', () => {
    async function scenario() {
      const host = await stack.registerUser({ role: 'host', name: 'Andrés Host' });
      const guest = await stack.registerUser({ name: 'Camila Rojas' });
      const property = await stack.createProperty(host.id, 'Domo Aurora');
      return { host, guest, property };
    }

    it('sends the guest and the host their e-mails when a booking is paid', async () => {
      const { host, guest, property } = await scenario();
      await bookAndPay(guest, property.id, 30);

      await stack.waitForEmail((email) => email.to.includes(guest.email) && /Reserva confirmada|Booking confirmed/i.test(email.subject));
      await stack.waitForEmail((email) => email.to.includes(host.email) && /Nueva reserva/.test(email.subject));
    });

    it('stops the host booking e-mails when the host opts out, but never the guest\'s confirmation', async () => {
      const { host, guest, property } = await scenario();
      await stack.call('PATCH', '/notifications/preferences', {
        token: host.token,
        body: { email: { host_bookings: false } },
      });

      const bookingId = await bookAndPay(guest, property.id, 40);
      await stack.waitForEmail((email) => email.to.includes(guest.email) && /Reserva confirmada|Booking confirmed/i.test(email.subject));
      await settle();
      assert.equal(mailsTo(host.email, /reserva/i).length, 0, 'the host opted out of new-booking e-mails');

      const cancelled = await stack.call('POST', `/bookings/${bookingId}/cancel`, { token: guest.token });
      assert.equal(cancelled.status, 200);
      await stack.waitForEmail((email) => email.to.includes(guest.email) && /cancelada|cancelled/i.test(email.subject));
      await settle();
      assert.equal(mailsTo(host.email, /reserva/i).length, 0, 'the host opted out of cancellation e-mails too');
    });

    it('tells the host about a cancellation when they have not opted out', async () => {
      const { host, guest, property } = await scenario();
      const bookingId = await bookAndPay(guest, property.id, 50);
      await stack.waitForEmail((email) => email.to.includes(host.email) && /Nueva reserva/.test(email.subject));

      await stack.call('POST', `/bookings/${bookingId}/cancel`, { token: guest.token });
      await stack.waitForEmail((email) => email.to.includes(host.email) && /Reserva cancelada/.test(email.subject));
    });

    it('sends the check-in reminder unless the guest opted out', async () => {
      const { host, guest, property } = await scenario();
      const optedOut = await stack.registerUser({ name: 'Sin Avisos' });
      const wanted = await stack.createBooking({ propertyId: property.id, guestId: guest.id, checkIn: day(1) });
      const unwanted = await stack.createBooking({ propertyId: property.id, guestId: optedOut.id, checkIn: day(1) });
      await stack.call('PATCH', '/notifications/preferences', {
        token: optedOut.token,
        body: { email: { reminders: false } },
      });

      const sent = await senders.sendCheckInReminderEmail({ bookingId: wanted.id });
      const skipped = await senders.sendCheckInReminderEmail({ bookingId: unwanted.id });

      assert.equal(sent.sent, true);
      assert.deepEqual(skipped, { sent: false, reason: 'opted_out' });
      assert.equal(mailsTo(guest.email, /check-in/i).length, 1);
      assert.equal(mailsTo(optedOut.email, /check-in/i).length, 0);
      assert.equal(mailsTo(host.email, /check-in/i).length, 0);
    });

    it('counts an opted-out reminder as skipped in the daily batch, not as an error', async () => {
      const { guest, property } = await scenario();
      await stack.createBooking({ propertyId: property.id, guestId: guest.id, checkIn: day(1) });
      await stack.call('PATCH', '/notifications/preferences', { token: guest.token, body: { email: { reminders: false } } });
      const before = mailsTo(guest.email, /check-in/i).length;

      const result = await senders.sendCheckInReminderEmails();

      assert.equal(result.errors, 0);
      assert.ok(result.skipped >= 1);
      assert.equal(mailsTo(guest.email, /check-in/i).length, before);
    });
  });
});
