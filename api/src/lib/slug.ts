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

export async function uniquePropertySlug(title: string): Promise<string> {
  const { prisma } = await import('./prisma.js');
  const base = slugify(title);
  let slug = base;
  let n = 0;
  while (await prisma.property.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
