import { z } from 'zod';

/**
 * What a user can switch off. Booking confirmations, cancellations, receipts and every security
 * e-mail (password reset/change, account deleted) are NOT here on purpose: they are part of the
 * transaction or protect the account, so they are always sent.
 */
export const EMAIL_PREFERENCE_KEYS = ['reminders', 'host_bookings'] as const;
export const PUSH_PREFERENCE_KEYS = ['bookings', 'reminders', 'host_bookings'] as const;

export type EmailPreferenceKey = (typeof EMAIL_PREFERENCE_KEYS)[number];
export type PushPreferenceKey = (typeof PUSH_PREFERENCE_KEYS)[number];

export type NotificationPreferences = {
  email: Record<EmailPreferenceKey, boolean>;
  push: Record<PushPreferenceKey, boolean>;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: { reminders: true, host_bookings: true },
  push: { bookings: true, reminders: true, host_bookings: true },
};

function readChannel<K extends string>(
  stored: unknown,
  keys: readonly K[],
  defaults: Record<K, boolean>,
): Record<K, boolean> {
  const source = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  const result = { ...defaults };
  for (const key of keys) {
    if (typeof source[key] === 'boolean') result[key] = source[key] as boolean;
  }
  return result;
}

/** Stored JSON may be null, partial (a key added later) or hand-edited: unknown parts fall back to the defaults. */
export function resolveNotificationPreferences(stored: unknown): NotificationPreferences {
  const source = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  return {
    email: readChannel(source.email, EMAIL_PREFERENCE_KEYS, DEFAULT_NOTIFICATION_PREFERENCES.email),
    push: readChannel(source.push, PUSH_PREFERENCE_KEYS, DEFAULT_NOTIFICATION_PREFERENCES.push),
  };
}

export const preferencesPatchSchema = z
  .object({
    email: z.object({ reminders: z.boolean(), host_bookings: z.boolean() }).partial().strict().optional(),
    push: z
      .object({ bookings: z.boolean(), reminders: z.boolean(), host_bookings: z.boolean() })
      .partial()
      .strict()
      .optional(),
  })
  .strict()
  .refine((patch) => Object.values(patch).some((channel) => channel && Object.keys(channel).length > 0), {
    message: 'Indica al menos una preferencia.',
  });

export type NotificationPreferencesPatch = z.infer<typeof preferencesPatchSchema>;

export function applyPreferencesPatch(
  current: NotificationPreferences,
  patch: NotificationPreferencesPatch,
): NotificationPreferences {
  return {
    email: { ...current.email, ...patch.email },
    push: { ...current.push, ...patch.push },
  };
}
