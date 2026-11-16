import { COLLECTIONS } from './collections';

export type CanonicalEntry = {
  slug: string;
  canonical: string;
  keyword: string;
  intention: string;
};

export const CANONICAL_REGISTRY: CanonicalEntry[] = COLLECTIONS.map(c => ({
  slug: c.slug,
  canonical: c.canonical,
  keyword: c.keyword,
  intention: c.intention,
}));

export const INTENTION_MAP = new Map<string, string>();
CANONICAL_REGISTRY.forEach(e => {
  if (INTENTION_MAP.has(e.intention)) {
    throw new Error(`Duplicate intention ${e.intention} for ${e.slug} and ${INTENTION_MAP.get(e.intention)}`);
  }
  INTENTION_MAP.set(e.intention, e.slug);
});

export function getCanonicalForIntention(intention: string) {
  return INTENTION_MAP.get(intention);
}
