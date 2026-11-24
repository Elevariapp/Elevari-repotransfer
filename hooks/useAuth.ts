'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { ApiError, wanaApi, type AuthUser } from '@/lib/api-client';
import { SESSION_CHANGE_EVENT, clearSession, getToken, setSession } from '@/lib/auth-session';

const ME_TIMEOUT_MS = 12_000;

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  /** A session exists but the API could not be reached, so we cannot tell who it belongs to. */
  unavailable: boolean;
}

// One store for the whole tab: the header, the bell and the page share a single /auth/me call
// and all react together to login, logout and token changes.
const SERVER_STATE: AuthState = { user: null, loading: true, unavailable: false };
let state: AuthState = SERVER_STATE;
let loadedFor: string | null = null;
let inflight: Promise<void> | null = null;
let bound = false;
const listeners = new Set<() => void>();

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms);
    }),
  ]);
}

function load(): Promise<void> {
  const token = getToken();
  if (!token) {
    loadedFor = null;
    setState({ user: null, loading: false, unavailable: false });
    return Promise.resolve();
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { user } = await withTimeout(wanaApi.me(), ME_TIMEOUT_MS);
      // A login or logout may have happened while we waited.
      if (getToken() !== token) return;
      loadedFor = user ? token : null;
      setState({ user, loading: false, unavailable: false });
    } catch (err) {
      if (getToken() !== token) return;
      if (err instanceof ApiError && err.status === 401) {
        // request() already dropped the session; this keeps the store in step.
        clearSession();
        loadedFor = null;
        setState({ user: null, loading: false, unavailable: false });
      } else {
        // Network trouble or a 5xx must not sign anyone out.
        setState({ loading: false, unavailable: true });
      }
    } finally {
      inflight = null;
      // The token changed mid-flight: sync again for the new one.
      if (getToken() !== token) void load();
    }
  })();
  return inflight;
}

function onSessionChange() {
  const token = getToken();
  if (!token) {
    loadedFor = null;
    setState({ user: null, loading: false, unavailable: false });
  } else if (token !== loadedFor) {
    void load();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!bound && typeof window !== 'undefined') {
    bound = true;
    window.addEventListener(SESSION_CHANGE_EVENT, onSessionChange);
    // Another tab logged in or out.
    window.addEventListener('storage', onSessionChange);
  }
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_STATE;

export function useAuth() {
  const { user, loading, unavailable } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Also retried on remount while the API was unreachable, so navigating heals a transient failure.
    if (state.loading || state.unavailable) void load();
  }, []);

  const refresh = useCallback(() => load(), []);

  const adopt = (token: string, u: AuthUser) => {
    // Mark the user as loaded before storing the token so the change event does not refetch it.
    loadedFor = token;
    setState({ user: u, loading: false, unavailable: false });
    setSession(token);
    return u;
  };

  const login = async (email: string, password: string, turnstile_token?: string) => {
    const { token, user: u } = await wanaApi.login(email, password, turnstile_token);
    return adopt(token, u);
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role?: 'guest' | 'host';
    turnstile_token?: string;
  }) => {
    const { token, user: u } = await wanaApi.register(data);
    return adopt(token, u);
  };

  const loginWithGoogle = async (
    credential: string,
    options?: { turnstile_token?: string; role?: 'guest' | 'host' },
  ) => {
    const { token, user: u } = await wanaApi.googleAuth(credential, options);
    return adopt(token, u);
  };

  /** Turns the signed-in guest account into a host account and keeps the session on the new token. */
  const becomeHost = async () => {
    const { token, user: u } = await wanaApi.becomeHost();
    return adopt(token, u);
  };

  const logout = () => {
    clearSession();
  };

  /** Merge fresh values (e.g. after editing the profile) without another round trip. */
  const updateUser = (patch: Partial<AuthUser>) => {
    if (!state.user) return;
    setState({ user: { ...state.user, ...patch } });
  };

  return { user, loading, unavailable, login, register, loginWithGoogle, becomeHost, logout, refresh, updateUser };
}
