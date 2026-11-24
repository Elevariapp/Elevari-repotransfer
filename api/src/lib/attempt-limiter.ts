/**
 * In-memory fixed-window counter, keyed by an arbitrary string (an e-mail address here).
 *
 * The API runs as a single process behind nginx, so process memory is enough to slow down
 * credential stuffing against one account and e-mail bombing of one inbox. The per-IP limits
 * registered in app.ts stay in place; these limiters add a per-account dimension on top.
 */
export interface AttemptLimiterOptions {
  /** Attempts allowed inside one window. */
  max: number;
  windowMs: number;
  /** Upper bound of tracked keys; expired entries go first, then the oldest ones. */
  maxKeys?: number;
  now?: () => number;
}

export interface AttemptStatus {
  blocked: boolean;
  /** Whole seconds until the key is allowed again (0 when not blocked). */
  retryAfterSeconds: number;
}

interface Entry {
  count: number;
  windowStart: number;
}

export interface AttemptLimiter {
  /** Reads the state without counting an attempt. */
  peek(key: string): AttemptStatus;
  /** Counts one attempt and returns the state AFTER counting it. */
  hit(key: string): AttemptStatus;
  reset(key: string): void;
  size(): number;
}

export function createAttemptLimiter(options: AttemptLimiterOptions): AttemptLimiter {
  const { max, windowMs, maxKeys = 5000, now = Date.now } = options;
  const entries = new Map<string, Entry>();

  function live(key: string, at: number): Entry | undefined {
    const entry = entries.get(key);
    if (entry && at - entry.windowStart >= windowMs) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  }

  function statusOf(entry: Entry | undefined, at: number): AttemptStatus {
    if (!entry || entry.count < max) return { blocked: false, retryAfterSeconds: 0 };
    return { blocked: true, retryAfterSeconds: Math.max(1, Math.ceil((entry.windowStart + windowMs - at) / 1000)) };
  }

  function prune(at: number) {
    if (entries.size < maxKeys) return;
    for (const [key, entry] of entries) {
      if (at - entry.windowStart >= windowMs) entries.delete(key);
    }
    // Still full: drop the oldest insertions (Map keeps insertion order).
    for (const key of entries.keys()) {
      if (entries.size < maxKeys) break;
      entries.delete(key);
    }
  }

  return {
    peek(key) {
      const at = now();
      return statusOf(live(key, at), at);
    },
    hit(key) {
      const at = now();
      const current = live(key, at);
      if (current) {
        current.count += 1;
        return statusOf(current, at);
      }
      prune(at);
      const created: Entry = { count: 1, windowStart: at };
      entries.set(key, created);
      return statusOf(created, at);
    },
    reset(key) {
      entries.delete(key);
    },
    size() {
      return entries.size;
    },
  };
}
