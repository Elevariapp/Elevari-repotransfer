import { api, runTokenRotation, setSessionExpiredHandler } from './api';
import { authStorage, normalizeEmail } from './auth';
import { unregisterPushToken } from './notifications';
import { useAppStore } from './store';
import type {
  AuthResponse,
  ChangePasswordResponse,
  MeResponse,
  SuccessResponse,
  User,
  UserRole,
} from './types';

const VERIFY_TIMEOUT_MS = 8000;
// How long the splash screen may wait for the server to confirm the saved session.
const SPLASH_GRACE_MS = 2500;

const SESSION_NOTICES = {
  expired: 'Tu sesión expiró. Inicia sesión de nuevo.',
  revoked: 'Tu sesión ya no es válida (la contraseña o la cuenta cambiaron). Inicia sesión de nuevo.',
  deleted: 'Tu cuenta fue eliminada. Gracias por haber sido parte de Elevari.',
} as const;

async function endSession(): Promise<void> {
  await authStorage.logout();
  useAppStore.getState().logout();
}

// Manual sign-out (profile screen, after deleting the account). The device stops receiving pushes
// for the account first, while the token is still valid.
export async function signOut(options: { skipPushUnregister?: boolean } = {}): Promise<void> {
  if (!options.skipPushUnregister) await unregisterPushToken();
  useAppStore.getState().setSessionNotice(null);
  await endSession();
}

// A 401 on an authenticated request means the token is no longer valid: the route guards in the
// group layouts send the user to the login screen, which shows the notice.
setSessionExpiredHandler(async ({ code }) => {
  useAppStore
    .getState()
    .setSessionNotice(code === 'session_revoked' ? SESSION_NOTICES.revoked : SESSION_NOTICES.expired);
  await endSession();
});

async function startSession({ token, user }: AuthResponse): Promise<User> {
  await authStorage.setToken(token);
  useAppStore.getState().setSessionNotice(null);
  await saveUser(user);
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const data = await api.post<AuthResponse>('/auth/login', {
    email: normalizeEmail(email),
    password,
  });
  return startSession(data);
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  role: Exclude<UserRole, 'admin'>;
}

export async function signUp(input: SignUpInput): Promise<User> {
  const data = await api.post<AuthResponse>('/auth/register', {
    email: normalizeEmail(input.email),
    password: input.password,
    name: input.name.trim(),
    role: input.role,
  });
  return startSession(data);
}

// Turns the signed-in guest account into a host account. The role travels inside the session, so the
// server answers with a fresh token that replaces the saved one.
export async function becomeHost(): Promise<User> {
  const data = await api.post<AuthResponse>('/auth/become-host');
  return startSession(data);
}

// Persists an updated profile (e.g. after editing it) in the app store and in SecureStore.
export async function saveUser(user: User): Promise<void> {
  useAppStore.getState().setUser(user);
  try {
    await authStorage.setUser(user);
  } catch {
    // The profile is refreshed from GET /auth/me at the next app start.
  }
}

export async function updateProfile(input: { name?: string; phone?: string | null }): Promise<User> {
  const { user } = await api.patch<{ user: User }>('/auth/me', input);
  await saveUser(user);
  return user;
}

// Changes (or, for Google accounts without a password, sets) the password. The server revokes
// the old token when it commits and answers with a new one, which is stored right away.
export async function changePassword(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<void> {
  await runTokenRotation(async () => {
    const body =
      input.currentPassword === undefined
        ? { password: input.newPassword }
        : { current_password: input.currentPassword, password: input.newPassword };
    const result = await api.post<ChangePasswordResponse>('/auth/change-password', body);
    if (typeof result.token === 'string' && result.token) {
      await authStorage.setToken(result.token);
    }
  });

  const current = useAppStore.getState().user;
  if (current && !current.has_password) await saveUser({ ...current, has_password: true });
}

// Password accounts confirm with their password; Google accounts type their e-mail.
export async function deleteAccount(confirmation: { password: string } | { email: string }): Promise<void> {
  const body =
    'password' in confirmation
      ? { password: confirmation.password }
      : { confirm_email: normalizeEmail(confirmation.email) };
  await api.post<SuccessResponse>('/auth/delete-account', body);
  // The server already removed this account's push tokens and revoked the session.
  await signOut({ skipPushUnregister: true });
  useAppStore.getState().setSessionNotice(SESSION_NOTICES.deleted);
}

async function verifySession(token: string): Promise<void> {
  try {
    const { user } = await api.get<MeResponse>('/auth/me', { timeout: VERIFY_TIMEOUT_MS });
    // The session may have been replaced (new login) while the request was in flight.
    if ((await authStorage.getToken()) !== token) return;
    if (user) {
      await saveUser(user);
    } else {
      useAppStore.getState().setSessionNotice(SESSION_NOTICES.revoked);
      await endSession();
    }
  } catch {
    // A 401 is handled by the API client; offline or a server error keeps the saved session.
  }
}

// Restores the session saved on the device and confirms it with the server. The saved profile is
// used right away; only an explicit "invalid session" answer clears it, so a flaky connection
// never logs anyone out.
export async function bootstrapSession(): Promise<void> {
  const store = useAppStore.getState();
  try {
    const [token, storedUser] = await Promise.all([authStorage.getToken(), authStorage.getUser()]);
    if (!token || !storedUser) {
      if (token || storedUser) await authStorage.logout();
      store.logout();
      return;
    }

    store.setUser(storedUser);
    await Promise.race([
      verifySession(token),
      new Promise<void>((resolve) => setTimeout(resolve, SPLASH_GRACE_MS)),
    ]);
  } catch {
    store.logout();
  } finally {
    useAppStore.getState().setLoading(false);
  }
}
