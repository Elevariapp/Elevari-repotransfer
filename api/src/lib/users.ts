import { prisma } from './prisma.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Accounts are stored lowercase. Rows created before that kept the casing the user typed
 * (mobile keyboards capitalise the first letter), so fall back to a case-insensitive match.
 */
export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const exact = await prisma.user.findUnique({ where: { email: normalized } });
  if (exact) return exact;
  return prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    orderBy: { createdAt: 'asc' },
  });
}

/** Placeholder address for anonymised accounts; `.invalid` can never receive mail. */
export function deletedAccountEmail(userId: string): string {
  return `deleted+${userId}@elevari.invalid`;
}
