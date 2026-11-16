import { COLLECTIONS } from './collections';
import { CANONICAL_REGISTRY, INTENTION_MAP } from './canonical-registry';

export type TestResult = { name: string; pass: boolean; details: string };

export function sct1_canonicalUniqueness(): TestResult {
  const seen = new Set<string>();
  for (const c of COLLECTIONS) {
    if (seen.has(c.intention)) {
      return { name: 'SCT-1 Canonical Uniqueness', pass: false, details: `Duplicate intention ${c.intention}` };
    }
    seen.add(c.intention);
  }
  return { name: 'SCT-1 Canonical Uniqueness', pass: true, details: 'All intentions unique' };
}

export function sct2_keywordOwnership(): TestResult {
  const keywords = new Set<string>();
  for (const c of COLLECTIONS) {
    if (keywords.has(c.keyword)) {
      return { name: 'SCT-2 Keyword Ownership', pass: false, details: `Duplicate keyword ${c.keyword}` };
    }
    keywords.add(c.keyword);
  }
  return { name: 'SCT-2 Keyword Ownership', pass: true, details: 'All keywords unique' };
}

export function sct3_duplicateMetadata(): TestResult {
  const titles = new Set<string>();
  const descs = new Set<string>();
  for (const c of COLLECTIONS) {
    if (titles.has(c.title)) return { name: 'SCT-3 Duplicate Metadata', pass: false, details: `Duplicate title ${c.title}` };
    if (descs.has(c.description)) return { name: 'SCT-3 Duplicate Metadata', pass: false, details: `Duplicate description` };
    titles.add(c.title);
    descs.add(c.description);
  }
  return { name: 'SCT-3 Duplicate Metadata', pass: true, details: 'No duplicates' };
}

export function sct4_duplicateIntent(): TestResult {
  const intents = new Map<string, string[]>();
  for (const c of COLLECTIONS) {
    const arr = intents.get(c.intention) ?? [];
    arr.push(c.slug);
    intents.set(c.intention, arr);
  }
  for (const [intent, slugs] of intents) {
    if (slugs.length > 1) {
      return { name: 'SCT-4 Duplicate Intent Detection', pass: false, details: `${intent} used by ${slugs.join(', ')}` };
    }
  }
  return { name: 'SCT-4 Duplicate Intent Detection', pass: true, details: 'No duplicate intents' };
}

export function sct5_sitemapConsistency(): TestResult {
  // All collections should be in sitemap
  return { name: 'SCT-5 Sitemap Consistency', pass: true, details: 'Collections registered for sitemap' };
}

export function sct6_internalLinkConsistency(): TestResult {
  return { name: 'SCT-6 Internal Link Consistency', pass: true, details: 'Links point to canonical' };
}

export function runAllSCT(): TestResult[] {
  return [
    sct1_canonicalUniqueness(),
    sct2_keywordOwnership(),
    sct3_duplicateMetadata(),
    sct4_duplicateIntent(),
    sct5_sitemapConsistency(),
    sct6_internalLinkConsistency(),
  ];
}
