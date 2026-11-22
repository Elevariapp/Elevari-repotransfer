'use client';

import { useCallback, useEffect, useState } from 'react';
import { wanaApi, type AuthUser } from '@/lib/api-client';
import { clearSession, getToken, setSession } from '@/lib/auth-session';

const ME_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms);
    }),
  ]);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: me } = await withTimeout(wanaApi.me(), ME_TIMEOUT_MS);
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string, turnstile_token?: string) => {
    const { token, user: u } = await wanaApi.login(email, password, turnstile_token);
    setSession(token);
    setUser(u);
    return u;
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role?: 'guest' | 'host';
    turnstile_token?: string;
  }) => {
    const { token, user: u } = await wanaApi.register(data);
    setSession(token);
    setUser(u);
    return u;
  };

  const loginWithGoogle = async (
    credential: string,
    options?: { turnstile_token?: string; role?: 'guest' | 'host' },
  ) => {
    const { token, user: u } = await wanaApi.googleAuth(credential, options);
    setSession(token);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return { user, loading, login, register, loginWithGoogle, logout, refresh };
}
