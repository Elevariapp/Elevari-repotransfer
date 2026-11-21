import { authStorage } from './auth';
import { useAppStore } from './store';
import type { AuthResponse } from '@/types';

/** Persists a login/register response and marks the app as authenticated. */
export async function startSession({ token, user }: AuthResponse): Promise<void> {
  await authStorage.setToken(token);
  await authStorage.setUser(user);
  useAppStore.getState().setUser(user);
}

export async function endSession(): Promise<void> {
  await authStorage.logout();
  useAppStore.getState().logout();
}
