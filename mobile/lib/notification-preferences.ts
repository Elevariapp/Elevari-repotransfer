import type { NotificationPreferences, NotificationPreferencesPatch } from './types';

type EmailKey = keyof NotificationPreferences['email'];
type PushKey = keyof NotificationPreferences['push'];

export type PreferenceRow =
  | { id: string; group: 'email'; key: EmailKey; label: string; hint: string; hostOnly: boolean }
  | { id: string; group: 'push'; key: PushKey; label: string; hint: string; hostOnly: boolean };

// Same wording as the web page (/account/notifications).
export const EMAIL_PREFERENCE_ROWS: readonly PreferenceRow[] = [
  {
    id: 'email-reminders',
    group: 'email',
    key: 'reminders',
    label: 'Recordatorio de check-in',
    hint: 'Un correo el día antes de tu llegada.',
    hostOnly: false,
  },
  {
    id: 'email-host-bookings',
    group: 'email',
    key: 'host_bookings',
    label: 'Reservas de tus espacios',
    hint: 'Un correo cuando un huésped reserva o cancela.',
    hostOnly: true,
  },
];

export const PUSH_PREFERENCE_ROWS: readonly PreferenceRow[] = [
  {
    id: 'push-bookings',
    group: 'push',
    key: 'bookings',
    label: 'Tus reservas',
    hint: 'Confirmaciones, cancelaciones y reservas sin pagar que vencen.',
    hostOnly: false,
  },
  {
    id: 'push-reminders',
    group: 'push',
    key: 'reminders',
    label: 'Recordatorio de check-in',
    hint: 'Un aviso el día antes de tu llegada.',
    hostOnly: false,
  },
  {
    id: 'push-host-bookings',
    group: 'push',
    key: 'host_bookings',
    label: 'Reservas de tus espacios',
    hint: 'Un aviso cuando un huésped reserva o cancela.',
    hostOnly: true,
  },
];

export function visibleRows(rows: readonly PreferenceRow[], isHost: boolean): PreferenceRow[] {
  return rows.filter((row) => isHost || !row.hostOnly);
}

export function preferenceValue(prefs: NotificationPreferences, row: PreferenceRow): boolean {
  return row.group === 'email' ? prefs.email[row.key] : prefs.push[row.key];
}

export function preferencePatch(row: PreferenceRow, value: boolean): NotificationPreferencesPatch {
  if (row.group === 'email') return { email: { [row.key]: value } };
  return { push: { [row.key]: value } };
}

export function withPreference(
  prefs: NotificationPreferences,
  row: PreferenceRow,
  value: boolean,
): NotificationPreferences {
  if (row.group === 'email') return { ...prefs, email: { ...prefs.email, [row.key]: value } };
  return { ...prefs, push: { ...prefs.push, [row.key]: value } };
}
