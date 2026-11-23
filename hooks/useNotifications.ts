'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { wanaApi, type AppNotification } from '@/lib/api-client';

/**
 * The API only lists notifications; whether one was read is a per-browser concern, so the
 * "seen" ids live in localStorage under the user's id. State is shared across hook users, so
 * pages that mount their own Header reuse one cache instead of refetching on every navigation.
 */

const REFRESH_MS = 60_000;
const FRESH_MS = 30_000;
const SEEN_PREFIX = 'elevari:notifications:seen:';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface Snapshot {
  userId: string | null;
  items: AppNotification[];
  seen: ReadonlySet<string>;
  unread: number;
  status: Status;
}

const EMPTY: Snapshot = { userId: null, items: [], seen: new Set(), unread: 0, status: 'idle' };

let snapshot: Snapshot = EMPTY;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function publish(patch: Partial<Snapshot>) {
  const next = { ...snapshot, ...patch };
  next.unread = next.items.reduce((count, item) => count + (next.seen.has(item.id) ? 0 : 1), 0);
  snapshot = next;
  emit();
}

function readSeen(userId: string): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SEEN_PREFIX + userId) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeSeen(userId: string, seen: ReadonlySet<string>) {
  try {
    localStorage.setItem(SEEN_PREFIX + userId, JSON.stringify([...seen]));
  } catch {
    // Storage unavailable (private mode, quota): read state then only lasts for this page view.
  }
}

function bind(userId: string | null) {
  if (snapshot.userId === userId) return;
  fetchedAt = 0;
  inflight = null;
  snapshot = userId ? { ...EMPTY, userId, seen: readSeen(userId) } : EMPTY;
  emit();
}

/** Fetches unless the cache is fresh; `force` skips the freshness check. */
export function refreshNotifications(userId: string, force = false): Promise<void> {
  if (snapshot.userId !== userId) return Promise.resolve();
  if (inflight) return inflight;
  if (!force && Date.now() - fetchedAt < FRESH_MS) return Promise.resolve();

  if (snapshot.items.length === 0) publish({ status: 'loading' });

  const request: Promise<void> = wanaApi
    .notifications()
    .then(
      ({ data }) => {
        if (snapshot.userId !== userId) return;
        fetchedAt = Date.now();
        // The API window is bounded, so ids that fell out of it no longer need remembering.
        const live = new Set(data.map((item) => item.id));
        const seen = new Set([...snapshot.seen].filter((id) => live.has(id)));
        if (seen.size !== snapshot.seen.size) writeSeen(userId, seen);
        publish({ items: data, seen, status: 'ready' });
      },
      () => {
        if (snapshot.userId !== userId) return;
        publish({ status: snapshot.items.length > 0 ? 'ready' : 'error' });
      },
    )
    .finally(() => {
      if (inflight === request) inflight = null;
    });
  inflight = request;
  return request;
}

export function markNotificationsRead(ids: string[]) {
  const { userId } = snapshot;
  if (!userId) return;
  const seen = new Set(snapshot.seen);
  const before = seen.size;
  ids.forEach((id) => seen.add(id));
  if (seen.size === before) return;
  writeSeen(userId, seen);
  publish({ seen });
}

export function markAllNotificationsRead() {
  markNotificationsRead(snapshot.items.map((item) => item.id));
}

function onStorage(event: StorageEvent) {
  if (snapshot.userId && event.key === SEEN_PREFIX + snapshot.userId) {
    publish({ seen: readSeen(snapshot.userId) });
  }
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

/** Notifications for `userId`, kept fresh while the tab is visible. Pass null when signed out. */
export function useNotifications(userId: string | null) {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );

  useEffect(() => {
    bind(userId);
    if (!userId) return;

    void refreshNotifications(userId);
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void refreshNotifications(userId);
    };
    const timer = window.setInterval(refreshIfVisible, REFRESH_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [userId]);

  // Between a user change and the effect above the store can still hold the previous user's data.
  return state.userId === userId ? state : EMPTY;
}
