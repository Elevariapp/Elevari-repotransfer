import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { day, freshIp, hasTestDatabase, skipReason, startStack, type TestStack } from './harness.js';

const newPushToken = () => `ExponentPushToken[${randomUUID().replace(/-/g, '')}]`;

describe('POST /auth/delete-account (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  const deleteAccount = (token: string, body: unknown) =>
    stack.call('POST', '/auth/delete-account', { token, body, ip: freshIp() });

  it('refuses a wrong password and leaves the account untouched', async () => {
    const user = await stack.registerUser();

    const res = await deleteAccount(user.token, { password: 'no-es-esta-clave' });
    await new Promise((resolve) => setTimeout(resolve, 300));

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'invalid_password');
    assert.equal((await stack.call('GET', '/auth/me', { token: user.token })).status, 200);
    assert.equal(
      stack.emails.filter((email) => email.to.includes(user.email) && /eliminada/i.test(email.subject)).length,
      0,
    );
  });

  it('erases the personal data, ends every session and confirms by e-mail to the original address', async () => {
    const user = await stack.registerUser({ name: 'Camila Ortiz' });
    const device = newPushToken();
    await stack.call('POST', '/notifications/push-token', { token: user.token, body: { token: device, platform: 'android' } });

    const res = await deleteAccount(user.token, { password: user.password });
    assert.equal(res.status, 200);

    const row = await stack.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.notEqual(row.email, user.email);
    assert.equal(row.name, null);
    assert.equal(row.phone, null);
    assert.equal(row.passwordHash, null);
    assert.ok(row.deletedAt);
    assert.equal(await stack.prisma.pushToken.count({ where: { userId: user.id } }), 0);

    const stale = await stack.call('GET', '/auth/me', { token: user.token });
    assert.equal(stale.status, 401);
    assert.equal(stale.body.code, 'session_revoked');
    const login = await stack.call('POST', '/auth/login', {
      body: { email: user.email, password: user.password },
      ip: freshIp(),
    });
    assert.equal(login.status, 401);

    const mail = await stack.waitForEmail((email) => email.to.includes(user.email) && /cuenta fue eliminada/i.test(email.subject));
    assert.match(mail.html, /Camila/);
    assert.match(mail.text, /eliminamos tu cuenta/i);
  });

  it('frees the address so the person can sign up again later', async () => {
    const user = await stack.registerUser();
    assert.equal((await deleteAccount(user.token, { password: user.password })).status, 200);

    const again = await stack.call('POST', '/auth/register', {
      body: { email: user.email, password: user.password, name: 'Nueva cuenta', role: 'guest' },
      ip: freshIp(),
    });
    assert.equal(again.status, 201);
    assert.notEqual(again.body.user.id, user.id);
  });

  it('asks accounts without a password (Google) to type their e-mail instead', async () => {
    const user = await stack.registerUser();
    await stack.prisma.user.update({ where: { id: user.id }, data: { passwordHash: null } });

    const wrong = await deleteAccount(user.token, { confirm_email: 'otra.persona@example.com' });
    assert.equal(wrong.status, 403);
    assert.equal(wrong.body.code, 'invalid_confirmation');
    const missing = await deleteAccount(user.token, { password: 'cualquiera' });
    assert.equal(missing.status, 403);

    const ok = await deleteAccount(user.token, { confirm_email: `  ${user.email.toUpperCase()} ` });
    assert.equal(ok.status, 200);
  });

  it('blocks deletion while a stay or a payment is still active, as guest or as host', async () => {
    const host = await stack.registerUser({ role: 'host' });
    const guest = await stack.registerUser();
    const property = await stack.createProperty(host.id);
    const booking = await stack.createBooking({
      propertyId: property.id,
      guestId: guest.id,
      status: 'confirmed',
      checkIn: day(5),
      nights: 2,
    });

    const asGuest = await deleteAccount(guest.token, { password: guest.password });
    assert.equal(asGuest.status, 409);
    assert.equal(asGuest.body.code, 'active_bookings');
    const asHost = await deleteAccount(host.token, { password: host.password });
    assert.equal(asHost.status, 409);
    assert.equal(asHost.body.code, 'active_bookings');
    assert.equal((await stack.call('GET', '/auth/me', { token: guest.token })).status, 200);

    await stack.prisma.booking.update({ where: { id: booking.id }, data: { status: 'cancelled' } });
    assert.equal((await deleteAccount(guest.token, { password: guest.password })).status, 200);
    assert.equal((await deleteAccount(host.token, { password: host.password })).status, 200);
  });

  it('keeps the booking record without the guest data and hides the host listings', async () => {
    const host = await stack.registerUser({ role: 'host' });
    const guest = await stack.registerUser({ name: 'Huésped Borrado' });
    const property = await stack.createProperty(host.id);
    const booking = await stack.createBooking({
      propertyId: property.id,
      guestId: guest.id,
      status: 'completed',
      checkIn: day(-6),
      nights: 2,
    });
    await stack.prisma.booking.update({
      where: { id: booking.id },
      data: { guestEmail: guest.email, guestName: 'Huésped Borrado' },
    });

    assert.equal((await deleteAccount(guest.token, { password: guest.password })).status, 200);
    const kept = await stack.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    assert.equal(kept.guestEmail, null);
    assert.equal(kept.guestName, null);

    assert.equal((await deleteAccount(host.token, { password: host.password })).status, 200);
    const hidden = await stack.prisma.property.findUniqueOrThrow({ where: { id: property.id } });
    assert.equal(hidden.status, 'draft');
  });

  it('does not delete administrators from the app and needs a session', async () => {
    const admin = await stack.registerUser();
    await stack.prisma.user.update({ where: { id: admin.id }, data: { role: 'admin' } });
    const res = await deleteAccount(admin.token, { password: admin.password });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'admin_account');

    assert.equal((await stack.call('POST', '/auth/delete-account', { body: { password: 'x' }, ip: freshIp() })).status, 401);
  });
});
