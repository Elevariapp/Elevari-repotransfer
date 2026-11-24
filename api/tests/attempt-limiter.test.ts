import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAttemptLimiter } from '../src/lib/attempt-limiter.js';

describe('createAttemptLimiter', () => {
  it('blocks once the allowance is used up and reports whole seconds to wait', () => {
    let clock = 1_000_000;
    const limiter = createAttemptLimiter({ max: 3, windowMs: 60_000, now: () => clock });

    assert.equal(limiter.hit('a@b.co').blocked, false);
    assert.equal(limiter.hit('a@b.co').blocked, false);
    assert.equal(limiter.peek('a@b.co').blocked, false);
    assert.equal(limiter.hit('a@b.co').blocked, true);

    clock += 12_500;
    assert.deepEqual(limiter.peek('a@b.co'), { blocked: true, retryAfterSeconds: 48 });
  });

  it('peek never counts, and other keys are unaffected', () => {
    const limiter = createAttemptLimiter({ max: 1, windowMs: 60_000 });
    for (let i = 0; i < 5; i += 1) limiter.peek('a@b.co');
    assert.equal(limiter.peek('a@b.co').blocked, false);
    limiter.hit('a@b.co');
    assert.equal(limiter.peek('a@b.co').blocked, true);
    assert.equal(limiter.peek('c@d.co').blocked, false);
  });

  it('forgets a key after the window and on reset', () => {
    let clock = 0;
    const limiter = createAttemptLimiter({ max: 1, windowMs: 1_000, now: () => clock });

    limiter.hit('a');
    assert.equal(limiter.peek('a').blocked, true);
    clock = 1_000;
    assert.equal(limiter.peek('a').blocked, false);

    limiter.hit('a');
    limiter.reset('a');
    assert.equal(limiter.peek('a').blocked, false);
  });

  it('keeps memory bounded, dropping expired keys first and then the oldest', () => {
    let clock = 0;
    const limiter = createAttemptLimiter({ max: 5, windowMs: 1_000, maxKeys: 3, now: () => clock });

    limiter.hit('old-1');
    limiter.hit('old-2');
    clock = 2_000;
    limiter.hit('new-1');
    limiter.hit('new-2');
    limiter.hit('new-3');
    assert.ok(limiter.size() <= 3);

    for (let i = 0; i < 20; i += 1) limiter.hit(`flood-${i}`);
    assert.ok(limiter.size() <= 3);
  });
});
