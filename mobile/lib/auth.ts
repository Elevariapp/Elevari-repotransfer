import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'guest' | 'host';
  avatarUrl?: string;
  phone?: string;
}

export const authStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async deleteToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  },

  async setUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async deleteUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async logout(): Promise<void> {
    await this.deleteToken();
    await this.deleteUser();
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};