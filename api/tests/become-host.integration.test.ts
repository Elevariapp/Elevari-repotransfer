import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasTestDatabase, skipReason, startStack, type TestStack } from './harness.js';

function roleInToken(token: string): string {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).role;
}

describe('POST /auth/become-host (real database)', { skip: hasTestDatabase ? false : skipReason }, () => {
  let stack: TestStack;

  before(async () => {
    stack = await startStack();
  });
  after(async () => {
    await stack.stop();
  });

  it('turns a guest into a host and hands out a token that says so', async () => {
    const guest = await stack.registerUser();
    assert.equal((await stack.call('GET', '/host/properties', { token: guest.token })).status, 403);

    const res = await stack.call('POST', '/auth/become-host', { token: guest.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'host');
    assert.equal(res.body.user.id, guest.id);
    assert.equal(roleInToken(res.body.token), 'host');
    assert.equal((await stack.prisma.user.findUniqueOrThrow({ where: { id: guest.id } })).role, 'host');

    assert.equal((await stack.call('GET', '/host/properties', { token: res.body.token })).status, 200);
    assert.equal((await stack.call('GET', '/host/bookings', { token: res.body.token })).status, 200);
  });

  it('does not sign the user out of their other devices', async () => {
    const guest = await stack.registerUser();
    await stack.call('POST', '/auth/become-host', { token: guest.token });

    const me = await stack.call('GET', '/auth/me', { token: guest.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.role, 'host');
  });

  it('is harmless when repeated and for accounts that are already hosts', async () => {
    const host = await stack.registerUser({ role: 'host' });
    const first = await stack.call('POST', '/auth/become-host', { token: host.token });
    const second = await stack.call('POST', '/auth/become-host', { token: first.body.token });

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(second.body.user.role, 'host');
    assert.equal(roleInToken(second.body.token), 'host');
  });

  it('never downgrades an administrator', async () => {
    const admin = await stack.registerUser();
    await stack.prisma.user.update({ where: { id: admin.id }, data: { role: 'admin' } });

    const res = await stack.call('POST', '/auth/become-host', { token: admin.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'admin');
    assert.equal(roleInToken(res.body.token), 'admin');
  });

  it('requires a session', async () => {
    assert.equal((await stack.call('POST', '/auth/become-host')).status, 401);
    assert.equal((await stack.call('POST', '/auth/become-host', { token: 'not-a-token' })).status, 401);
  });
});
