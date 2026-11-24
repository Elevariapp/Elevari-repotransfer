import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hasTestDatabase, skipReason, startStack, type TestStack } from './harness.js';

describe('booking idempotency API (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  describe('POST /bookings idempotency', () => {
    it("never returns another guest's booking for a reused key", async () => {
      const host = await stack.registerUser({ role: 'host' });
      const property = await stack.prisma.property.create({
        data: {
          slug: `it-${randomUUID()}`,
          title: 'Domo de prueba',
          pricePerNight: 250000,
          maxGuests: 2,
          status: 'published',
          city: 'Guatavita',
          hostId: host.id,
        },
      });
      const owner = await stack.registerUser();
      const intruder = await stack.registerUser();
      const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
      const key = `it-key-${randomUUID()}`;
      const payload = { property_id: property.id, check_in: day(90), check_out: day(92), guests: 1, idempotency_key: key };

      const created = await stack.call('POST', '/bookings', { token: owner.token, body: payload });
      assert.equal(created.status, 201);

      const replay = await stack.call('POST', '/bookings', { token: owner.token, body: payload });
      assert.equal(replay.status, 200);
      assert.equal(replay.body.reused, true);
      assert.equal(replay.body.booking.id, created.body.booking.id);

      const stolen = await stack.call('POST', '/bookings', { token: intruder.token, body: payload });
      assert.equal(stolen.status, 409);
      assert.equal(stolen.body.code, 'idempotency_key_in_use');
      assert.equal(stolen.body.booking, undefined);
      assert.ok(!JSON.stringify(stolen.body).includes(owner.email));
    });
  });
});
