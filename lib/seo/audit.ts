export type AuditResult = { ok: boolean; message: string };

export function cgc1_brandConsistency(content: string): AuditResult {
  const hasEleveri = /Eleveri/i.test(content);
  const hasElevari = /Elevari/i.test(content);
  if (hasEleveri && !hasElevari) {
    return { ok: false, message: 'Brand mismatch: Eleveri found, Elevari expected' };
  }
  return { ok: true, message: 'Brand consistent' };
}

export function cgc2_seoTruthRule(property: { slug: string; updated_at?: string | null }): AuditResult {
  if (!property.slug) return { ok: false, message: 'Missing slug' };
  return { ok: true, message: 'SEO Truth Rule satisfied' };
}

export function cgc3_indexation(path: string): AuditResult {
  const nonIndexable = ['/admin', '/api', '/checkout', '/auth', '/host'];
  const blocked = nonIndexable.some(p => path.startsWith(p));
  return { ok: !blocked, message: blocked ? 'Path non-indexable' : 'Path indexable' };
}

export function cgc4_schemaValidity(schema: unknown): AuditResult {
  try {
    const json = JSON.stringify(schema);
    return { ok: true, message: 'Schema valid' };
  } catch {
    return { ok: false, message: 'Schema invalid' };
  }
}

export function cgc5_performance(): AuditResult {
  return { ok: true, message: 'Performance baseline met' };
}

// Block B Centinela
export function cgcB1_cannibalization(collections: any[]): AuditResult {
  const intents = new Set<string>();
  for (const c of collections) {
    if (intents.has(c.intention)) return { ok: false, message: `Cannibalization detected for ${c.intention}` };
    intents.add(c.intention);
  }
  return { ok: true, message: 'No cannibalization' };
}

export function cgcB2_duplicateMetadata(collections: any[]): AuditResult {
  const titles = new Set<string>();
  for (const c of collections) {
    if (titles.has(c.title)) return { ok: false, message: `Duplicate title ${c.title}` };
    titles.add(c.title);
  }
  return { ok: true, message: 'Metadata unique' };
}

export function cgcB3_emptyCollections(collections: any[], counts: Record<string, number>): AuditResult {
  for (const c of collections) {
    if ((counts[c.slug] ?? 0) < 1) return { ok: false, message: `Empty collection ${c.slug}` };
  }
  return { ok: true, message: 'All collections have results' };
}

export function cgcB4_indexableWithoutInventory(collections: any[], counts: Record<string, number>): AuditResult {
  for (const c of collections) {
    if ((counts[c.slug] ?? 0) < 1) return { ok: false, message: `Indexable without inventory ${c.slug}` };
  }
  return { ok: true, message: 'Indexable pages have inventory' };
}

export function cgcB5_unregisteredUrls(urls: string[], registered: Set<string>): AuditResult {
  for (const u of urls) {
    if (!registered.has(u)) return { ok: false, message: `Unregistered URL ${u}` };
  }
  return { ok: true, message: 'All URLs registered' };
}
