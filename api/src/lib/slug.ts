import { randomBytes } from 'node:crypto';

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'propiedad';
}

/**
 * Returns a free slug using a single query. Pass `randomSuffix` after a unique-constraint
 * collision (two hosts creating the same title at the same time) so the retry cannot collide again.
 */
export async function uniquePropertySlug(
  title: string,
  options: { randomSuffix?: boolean } = {},
): Promise<string> {
  const base = slugify(title);
  if (options.randomSuffix) {
    return `${base}-${randomBytes(3).toString('hex')}`;
  }

  const { prisma } = await import('./prisma.js');
  const existing = await prisma.property.findMany({
    where: { OR: [{ slug: base }, { slug: { startsWith: `${base}-` } }] },
    select: { slug: true },
  });
  const taken = new Set(existing.map((p) => p.slug));

  let slug = base;
  let n = 0;
  while (taken.has(slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
