#!/usr/bin/env node
/**
 * Fails when a tServer()/t() key used by the app is missing from the locale files.
 * A missing key renders the raw key on the page (e.g. "common.noResults"),
 * which is exactly how the EN/ES switcher silently stops translating.
 *
 * Usage: node scripts/check-i18n-keys.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const LOCALES = {
  es: {
    Common: JSON.parse(readFileSync(join(ROOT, 'app/messages/Common/es.json'), 'utf8')),
    Legal: JSON.parse(readFileSync(join(ROOT, 'app/messages/Legal/es.json'), 'utf8')),
  },
  en: {
    Common: JSON.parse(readFileSync(join(ROOT, 'app/messages/Common/en.json'), 'utf8')),
    Legal: JSON.parse(readFileSync(join(ROOT, 'app/messages/Legal/en.json'), 'utf8')),
  },
};
const DIRS = ['app', 'components'];
const SKIP = new Set(['node_modules', '.next', 'test-results']);
const pattern = /\b(?:tServer|t)\(\s*'(Common|Legal)'\s*,\s*'([^']+)'/g;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

const PREFIXES = { Common: ['common'], Legal: ['legal', 'legalScreens'] };

function lookup(section, key, locale) {
  const bundle = LOCALES[locale][section];
  const candidates = [key, ...PREFIXES[section].map((prefix) => `${prefix}.${key}`)];
  for (const candidate of candidates) {
    let value = bundle;
    let ok = true;
    for (const part of candidate.split('.')) {
      if (value && typeof value === 'object' && part in value) value = value[part];
      else { ok = false; break; }
    }
    if (ok && typeof value === 'string') return value;
  }
  return undefined;
}

const missing = [];
for (const file of DIRS.flatMap((dir) => walk(join(ROOT, dir)))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(pattern)) {
    const [, section, key] = match;
    for (const locale of Object.keys(LOCALES)) {
      if (lookup(section, key, locale) === undefined) {
        missing.push(`${relative(ROOT, file)} → ${locale}:${section}.${key}`);
      }
    }
  }
}

if (missing.length > 0) {
  console.error(`✗ ${missing.length} i18n key(s) missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`);
  process.exit(1);
}
console.log('✓ every i18n key used by the app exists in es and en');
