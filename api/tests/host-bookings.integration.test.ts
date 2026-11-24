import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hasTestDatabase, skipReason, startStack, type TestStack } from './harness.js';

const day = (offset: number) => new Date(`${new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)}T00:00:00.000Z`);

describe('GET /host/bookings (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  async function property(hostId: string, title: string) {
    return stack.prisma.property.create({
      data: {
        slug: `it-${randomUUID()}`,
        title,
        pricePerNight: 250000,
        maxGuests: 4,
        status: 'published',
        city: 'Guatavita',
        hostId,
      },
    });
  }

  async function booking(
    propertyId: string,
    guestId: string,
    status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled',
    checkIn: Date,
    nights = 2,
    cancelledFrom?: 'confirmed' | 'pending_payment',
  ) {
    const created = await stack.prisma.booking.create({
      data: {
        propertyId,
        guestId,
        status,
        checkIn,
        checkOut: new Date(checkIn.getTime() + nights * 86_400_000),
        guests: 2,
        guestName: 'Camila Rojas',
        guestEmail: 'camila@example.test',
        feesBreakdown: { host_receives: 425000, total_charge_to_guest: 575000 },
      },
    });
    if (cancelledFrom) {
      await stack.prisma.bookingEvent.create({
        data: { bookingId: created.id, fromStatus: cancelledFrom, toStatus: 'cancelled' },
      });
    }
    return created;
  }

  async function scenario() {
    const host = await stack.registerUser({ role: 'host', name: 'Andrés' });
    const otherHost = await stack.registerUser({ role: 'host' });
    const guest = await stack.registerUser({ name: 'Camila Rojas' });
    const mine = await property(host.id, 'Domo Aurora');
    const theirs = await property(otherHost.id, 'Cabaña ajena');

    const upcoming = await booking(mine.id, guest.id, 'confirmed', day(20));
    const sooner = await booking(mine.id, guest.id, 'confirmed', day(5));
    const past = await booking(mine.id, guest.id, 'completed', day(-30));
    const cancelled = await booking(mine.id, guest.id, 'cancelled', day(40), 2, 'confirmed');
    const unpaid = await booking(mine.id, guest.id, 'pending_payment', day(50));
    const expired = await booking(mine.id, guest.id, 'cancelled', day(60), 2, 'pending_payment');
    const foreign = await booking(theirs.id, guest.id, 'confirmed', day(10));
    return { host, otherHost, guest, upcoming, sooner, past, cancelled, unpaid, expired, foreign };
  }

  it('lists upcoming stays nearest first and never someone else\'s', async () => {
    const s = await scenario();
    const res = await stack.call('GET', '/host/bookings', { token: s.host.token });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data.map((b: { id: string }) => b.id), [s.sooner.id, s.upcoming.id]);
    assert.equal(res.body.pagination.total, 2);
    assert.equal(res.body.pagination.has_more, false);
    assert.ok(!res.body.data.some((b: { id: string }) => b.id === s.foreign.id));
    assert.match(String(res.headers['cache-control']), /no-store/);

    const first = res.body.data[0];
    assert.equal(first.status, 'confirmed');
    assert.equal(first.guest_name, 'Camila Rojas');
    assert.equal(first.property.title, 'Domo Aurora');
    assert.equal(first.nights, 2);
    assert.equal(first.host_receives, 425000);
    assert.match(first.check_in, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not expose guest contact details or payment data', async () => {
    const s = await scenario();
    const res = await stack.call('GET', '/host/bookings', { token: s.host.token });
    const raw = JSON.stringify(res.body);

    assert.ok(!raw.includes('camila@example.test'));
    assert.ok(!raw.includes(s.guest.email));
    assert.ok(!raw.includes('total_charge_to_guest'));
    assert.deepEqual(
      Object.keys(res.body.data[0]).sort(),
      ['check_in', 'check_out', 'created_at', 'currency', 'guest_name', 'guests', 'host_receives', 'id', 'nights', 'property', 'status'],
    );
  });

  it('separates past stays from cancelled ones and hides unpaid checkouts', async () => {
    const s = await scenario();
    const past = await stack.call('GET', '/host/bookings?scope=past', { token: s.host.token });
    assert.deepEqual(past.body.data.map((b: { id: string }) => b.id), [s.past.id]);

    const cancelled = await stack.call('GET', '/host/bookings?scope=cancelled', { token: s.host.token });
    assert.deepEqual(cancelled.body.data.map((b: { id: string }) => b.id), [s.cancelled.id]);

    for (const scope of ['upcoming', 'past', 'cancelled']) {
      const res = await stack.call('GET', `/host/bookings?scope=${scope}`, { token: s.host.token });
      const ids = res.body.data.map((b: { id: string }) => b.id);
      assert.ok(!ids.includes(s.unpaid.id), `${scope} must not include unpaid checkouts`);
      assert.ok(!ids.includes(s.expired.id), `${scope} must not include expired checkouts`);
    }
  });

  it('paginates with a stable total', async () => {
    const s = await scenario();
    const first = await stack.call('GET', '/host/bookings?page_size=1&page=1', { token: s.host.token });
    const second = await stack.call('GET', '/host/bookings?page_size=1&page=2', { token: s.host.token });
    const third = await stack.call('GET', '/host/bookings?page_size=1&page=3', { token: s.host.token });

    assert.equal(first.body.data[0].id, s.sooner.id);
    assert.equal(first.body.pagination.has_more, true);
    assert.equal(second.body.data[0].id, s.upcoming.id);
    assert.equal(second.body.pagination.has_more, false);
    assert.deepEqual(third.body.data, []);
    assert.equal(third.body.pagination.total, 2);
  });

  it('keeps hosts apart even when they ask for another host', async () => {
    const s = await scenario();
    const res = await stack.call('GET', `/host/bookings?host_id=${s.otherHost.id}`, { token: s.host.token });
    assert.deepEqual(res.body.data.map((b: { id: string }) => b.id), [s.sooner.id, s.upcoming.id]);

    const theirs = await stack.call('GET', '/host/bookings', { token: s.otherHost.token });
    assert.deepEqual(theirs.body.data.map((b: { id: string }) => b.id), [s.foreign.id]);
  });

  it('answers 401 without a session, 403 for guests and 400 for a bad filter', async () => {
    const s = await scenario();
    assert.equal((await stack.call('GET', '/host/bookings')).status, 401);
    assert.equal((await stack.call('GET', '/host/bookings', { token: s.guest.token })).status, 403);

    const bad = await stack.call('GET', '/host/bookings?scope=everything', { token: s.host.token });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.code, 'INVALID_QUERY');
    assert.equal((await stack.call('GET', '/host/bookings?page_size=500', { token: s.host.token })).status, 400);
  });

  it('shows no name for a guest who deleted their account', async () => {
    const s = await scenario();
    await stack.prisma.user.update({ where: { id: s.guest.id }, data: { deletedAt: new Date() } });
    const res = await stack.call('GET', '/host/bookings', { token: s.host.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.data[0].guest_name, null);
  });
});
