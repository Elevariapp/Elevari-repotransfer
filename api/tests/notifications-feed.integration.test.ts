import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { day, hasTestDatabase, skipReason, startStack, type TestStack, type TestUser } from './harness.js';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  body: string;
  booking_id: string | null;
}

describe('GET /notifications (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  const feed = async (user: TestUser): Promise<FeedItem[]> => {
    const res = await stack.call('GET', '/notifications', { token: user.token });
    assert.equal(res.status, 200);
    return res.body.data;
  };

  async function pay(guest: TestUser, propertyId: string): Promise<string> {
    const start = day(30).toISOString().slice(0, 10);
    const end = day(32).toISOString().slice(0, 10);
    const created = await stack.call('POST', '/bookings', {
      token: guest.token,
      body: { property_id: propertyId, check_in: start, check_out: end, guests: 2, idempotency_key: `it-${randomUUID()}` },
    });
    const intent = await stack.call('POST', '/payments/intent', {
      token: guest.token,
      body: {
        booking_id: created.body.booking.id,
        idempotency_key: `it-${randomUUID()}`,
        return_url: 'https://elevari.test/pago/resultado',
      },
    });
    await stack.call('POST', `/payments/${intent.body.payment_id}/mock-complete`, { token: guest.token });
    return created.body.booking.id as string;
  }

  it('needs a session', async () => {
    assert.equal((await stack.call('GET', '/notifications')).status, 401);
  });

  it('shows the guest and the host their own side of a booking, and nobody else anything', async () => {
    const host = await stack.registerUser({ role: 'host' });
    const guest = await stack.registerUser();
    const stranger = await stack.registerUser();
    const property = await stack.createProperty(host.id, 'Domo Aurora');
    const bookingId = await pay(guest, property.id);

    const guestItems = await feed(guest);
    const hostItems = await feed(host);

    const confirmed = guestItems.find((item) => item.type === 'booking_confirmed');
    assert.ok(confirmed, 'the guest is told the booking is confirmed');
    assert.equal(confirmed.title, 'Reserva confirmada');
    assert.match(confirmed.body, /^Domo Aurora · .+ → .+/);
    assert.equal(confirmed.booking_id, bookingId);
    assert.ok(!guestItems.some((item) => item.type.startsWith('host_')));

    const received = hostItems.find((item) => item.type === 'host_new_booking');
    assert.ok(received, 'the host is told about the new booking');
    assert.equal(received.title, 'Nueva reserva');
    assert.ok(!hostItems.some((item) => item.type === 'booking_confirmed'));

    assert.deepEqual(await feed(stranger), [], 'another account sees nothing about this booking');
  });

  it('turns a cancellation into the right message for each side', async () => {
    const host = await stack.registerUser({ role: 'host' });
    const guest = await stack.registerUser();
    const property = await stack.createProperty(host.id);
    const bookingId = await pay(guest, property.id);
    assert.equal((await stack.call('POST', `/bookings/${bookingId}/cancel`, { token: guest.token })).status, 200);

    assert.ok((await feed(guest)).some((item) => item.type === 'booking_cancelled' && item.booking_id === bookingId));
    assert.ok((await feed(host)).some((item) => item.type === 'host_booking_cancelled' && item.booking_id === bookingId));
  });

  it('tells the guest, and not the host, when an unpaid booking expires', async () => {
    const host = await stack.registerUser({ role: 'host' });
    const guest = await stack.registerUser();
    const property = await stack.createProperty(host.id);
    const unpaid = await stack.createBooking({
      propertyId: property.id,
      guestId: guest.id,
      status: 'pending_payment',
      checkIn: day(45),
    });
    await stack.prisma.bookingEvent.create({
      data: { bookingId: unpaid.id, fromStatus: 'pending_payment', toStatus: 'cancelled', metadata: { reason: 'expired_unpaid' } },
    });

    const expired = (await feed(guest)).find((item) => item.type === 'booking_expired');
    assert.ok(expired);
    assert.equal(expired.title, 'Reserva expirada');
    assert.ok(!(await feed(host)).some((item) => item.booking_id === unpaid.id));
  });
});
