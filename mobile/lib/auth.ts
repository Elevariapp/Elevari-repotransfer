import * as SecureStore from 'expo-secure-store';
import type { User, UserRole } from './types';

export type { User, UserRole } from './types';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isHostRole(role: UserRole | undefined | null): boolean {
  return role === 'host' || role === 'admin';
}

function parseUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<User>;
    if (typeof candidate.id !== 'string' || typeof candidate.email !== 'string') return null;
    const role: UserRole =
      candidate.role === 'host' || candidate.role === 'admin' ? candidate.role : 'guest';
    return {
      id: candidate.id,
      email: candidate.email,
      name: typeof candidate.name === 'string' ? candidate.name : null,
      role,
      phone: typeof candidate.phone === 'string' ? candidate.phone : null,
      // Profiles saved before this field existed are refreshed by GET /auth/me at app start.
      has_password: candidate.has_password !== false,
    };
  } catch {
    return null;
  }
}

export const authStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async deleteToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // Nothing to delete or the keystore is unavailable.
    }
  },

  async getUser(): Promise<User | null> {
    try {
      return parseUser(await SecureStore.getItemAsync(USER_KEY));
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async deleteUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      // Nothing to delete or the keystore is unavailable.
    }
  },

  async logout(): Promise<void> {
    await Promise.all([this.deleteToken(), this.deleteUser()]);
  },
};