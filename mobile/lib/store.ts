import { create } from 'zustand';
import type { User } from './types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  unreadNotifications: number;
  // One-shot message for the login screen after the session was ended by the server.
  sessionNotice: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setUnreadNotifications: (count: number) => void;
  setSessionNotice: (notice: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  unreadNotifications: 0,
  sessionNotice: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
  setSessionNotice: (sessionNotice) => set({ sessionNotice }),
  logout: () => set({ user: null, isAuthenticated: false, unreadNotifications: 0 }),
}));