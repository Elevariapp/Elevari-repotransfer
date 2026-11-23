import { useSegments } from 'expo-router';
import { isHostRole } from './auth';
import type { UserRole } from './types';

// Route groups: `(guest)` for travellers, `(host)` for hosts/admins. Hrefs always name the group
// explicitly because both groups own screens with the same URL (`/` and `/profile`).
export type Area = 'guest' | 'host';

export const LOGIN_HREF = '/(auth)/login';

export function homeHref(role: UserRole | null | undefined): string {
  return isHostRole(role) ? '/(host)' : '/(guest)';
}

export function areaHref(area: Area, path: string): string {
  return `/(${area})${path}`;
}

// Route params can arrive as `string | string[]`; every screen here expects a single value.
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// The group the current screen belongs to (anything outside the host group counts as guest).
export function useArea(): Area {
  const segments = useSegments();
  return segments[0] === '(host)' ? 'host' : 'guest';
}
