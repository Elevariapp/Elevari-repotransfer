'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { TtlMap, RateLimiter } = require('../src/store');
const { createClock } = require('./helpers');

describe('TtlMap', () => {
  test('forgets entries after their ttl', () => {
    const clock = createClock();
    const map = new TtlMap({ ttlMs: 1000, maxEntries: 10, now: clock.now });
    map.set('a', 1);

    clock.advance(999);
    assert.equal(map.get('a'), 1);
    clock.advance(1);
    assert.equal(map.get('a'), undefined);
    assert.equal(map.has('a'), false);
  });

  test('supports a per-entry ttl, including entries that never expire', () => {
    const clock = createClock();
    const map = new TtlMap({ ttlMs: 1000, maxEntries: 10, now: clock.now });
    map.set('short', 1);
    map.set('forever', 2, Infinity);

    clock.advance(10 * 365 * 24 * 60 * 60 * 1000);
    assert.equal(map.get('short'), undefined);
    assert.equal(map.get('forever'), 2);
  });

  test('never holds more than maxEntries: the oldest write is evicted first', () => {
    const map = new TtlMap({ ttlMs: 60_000, maxEntries: 3 });
    for (const key of ['a', 'b', 'c']) map.set(key, key);
    map.set('a', 'a2'); // rewriting makes it the newest
    map.set('d', 'd');

    assert.equal(map.size, 3);
    assert.equal(map.has('b'), false);
    assert.deepEqual(['a', 'c', 'd'].map((key) => map.get(key)), ['a2', 'c', 'd']);
  });

  test('reclaims expired entries that are never read again', () => {
    const clock = createClock();
    const map = new TtlMap({ ttlMs: 1000, maxEntries: 100, now: clock.now, sweepEveryMs: 100 });
    for (let i = 0; i < 50; i += 1) map.set(`k${i}`, i);
    assert.equal(map.size, 50);

    clock.advance(5000);
    map.set('fresh', true);
    assert.equal(map.size, 1);
  });
});

describe('RateLimiter', () => {
  test('allows `limit` hits per window, then drops, and recovers once the window has passed', () => {
    const clock = createClock();
    const limiter = new RateLimiter({ limit: 3, windowMs: 60_000, maxKeys: 10, now: clock.now });

    for (let i = 0; i < 3; i += 1) {
      assert.deepEqual(limiter.hit('sender'), { allowed: true, first: false });
      clock.advance(10_000);
    }
    // 30s in: the 4th hit is over the limit; only the first rejection of a burst is flagged
    assert.deepEqual(limiter.hit('sender'), { allowed: false, first: true });
    assert.deepEqual(limiter.hit('sender'), { allowed: false, first: false });

    // sliding window: the first hit (t=0) leaves the window at t=60s, rejected hits never counted
    clock.advance(29_999);
    assert.equal(limiter.hit('sender').allowed, false);
    clock.advance(1);
    assert.equal(limiter.hit('sender').allowed, true);
  });

  test('tracks senders independently', () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 10 });
    assert.equal(limiter.hit('a').allowed, true);
    assert.equal(limiter.hit('a').allowed, false);
    assert.equal(limiter.hit('b').allowed, true);
  });
});
