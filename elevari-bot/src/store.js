'use strict';

// Bounded in-memory map with per-entry expiry. Entries are ordered by last write, so when the
// map is full the least recently written entry is evicted. Expired entries are dropped lazily on
// read and swept at most once per `sweepEveryMs` on write, so memory never exceeds `maxEntries`.
class TtlMap {
  #entries = new Map();
  #ttlMs;
  #maxEntries;
  #now;
  #sweepEveryMs;
  #lastSweep;

  constructor({ ttlMs, maxEntries, now = Date.now, sweepEveryMs = 60_000 }) {
    this.#ttlMs = ttlMs;
    this.#maxEntries = maxEntries;
    this.#now = now;
    this.#sweepEveryMs = sweepEveryMs;
    this.#lastSweep = now();
  }

  // Upper bound: may include expired entries that were not swept yet.
  get size() {
    return this.#entries.size;
  }

  get(key) {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  // `ttlMs` may be Infinity (entry only leaves through eviction).
  set(key, value, ttlMs = this.#ttlMs) {
    const now = this.#now();
    this.#entries.delete(key);
    if (now - this.#lastSweep >= this.#sweepEveryMs) this.#sweep(now);
    while (this.#entries.size >= this.#maxEntries) {
      this.#entries.delete(this.#entries.keys().next().value);
    }
    this.#entries.set(key, { value, expiresAt: now + ttlMs });
  }

  delete(key) {
    return this.#entries.delete(key);
  }

  #sweep(now) {
    this.#lastSweep = now;
    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt <= now) this.#entries.delete(key);
    }
  }
}

// Sliding-window limiter: at most `limit` hits per key within `windowMs`.
// Rejected hits are not recorded, so a sender recovers as soon as old hits leave the window.
// `first` is true only for the first rejection of a burst (lets callers log once, not per message).
class RateLimiter {
  #hits;
  #limit;
  #windowMs;
  #now;

  constructor({ limit, windowMs, maxKeys, now = Date.now }) {
    this.#limit = limit;
    this.#windowMs = windowMs;
    this.#now = now;
    this.#hits = new TtlMap({ ttlMs: windowMs, maxEntries: maxKeys, now });
  }

  hit(key) {
    const now = this.#now();
    const previous = this.#hits.get(key);
    const stamps = (previous?.stamps ?? []).filter((stamp) => stamp > now - this.#windowMs);

    if (stamps.length >= this.#limit) {
      this.#hits.set(key, { stamps, blocked: true });
      return { allowed: false, first: !previous?.blocked };
    }

    stamps.push(now);
    this.#hits.set(key, { stamps, blocked: false });
    return { allowed: true, first: false };
  }
}

module.exports = { TtlMap, RateLimiter };
