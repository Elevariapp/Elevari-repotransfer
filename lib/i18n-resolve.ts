/**
 * Message lookup shared by the server helper (lib/i18n-server.ts) and the
 * client provider (components/i18n/I18nProvider.tsx).
 *
 * The locale files group their keys by area (`nav`, `common`, `legal`, …), while
 * call sites use a section (`Common` / `Legal`) plus a key without that prefix:
 * `tServer('Common', 'noResults')`. Looking the key up only at the root of the
 * bundle returned `undefined` for almost every string, so pages rendered the raw
 * key ("noResults") instead of translating. We try the grouped namespaces too.
 */

export type MessageBundle = Record<string, unknown>;

const PREFIXES: Record<string, string[]> = {
  Common: ['common'],
  Legal: ['legal', 'legalScreens'],
};

function walk(bundle: MessageBundle, dottedKey: string): string | undefined {
  let value: unknown = bundle;
  for (const part of dottedKey.split('.')) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof value === 'string' ? value : undefined;
}

/** Returns the translated string, or `undefined` when the key does not exist in this locale. */
export function resolveMessage(bundle: MessageBundle | undefined, section: string, key: string): string | undefined {
  if (!bundle) return undefined;
  const candidates = [key, ...(PREFIXES[section] ?? [section.toLowerCase()]).map((prefix) => `${prefix}.${key}`)];
  for (const candidate of candidates) {
    const found = walk(bundle, candidate);
    if (found !== undefined) return found;
  }
  return undefined;
}
