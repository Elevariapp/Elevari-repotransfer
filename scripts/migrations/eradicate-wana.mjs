/**
 * One-off migration: eradicate legacy `wana-*` design tokens and classes.
 *
 * - Removes the two legacy alias blocks in app/globals.css by line range
 *   (from the marker comment up to the closing brace of its parent block).
 * - Renames `wana-<x>` → `elevari-<x>` in CSS and in app/components/lib sources.
 * - Leaves database/API identifiers (wanaApi, wana_token, wana-media bucket) untouched.
 *
 * Idempotent: running twice is a no-op.
 * Usage: node scripts/migrations/eradicate-wana.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const CSS = join(ROOT, 'app', 'globals.css');

/** Remove [markerLine, closingBraceLine) keeping the closing brace. */
function stripAliasBlock(text, marker) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.includes(marker));
  if (start === -1) return text;
  let end = start + 1;
  while (end < lines.length && lines[end].trim() !== '}') end += 1;
  lines.splice(start, end - start);
  return lines.join('\n');
}

let css = await readFile(CSS, 'utf8');
css = stripAliasBlock(css, '/* Legacy Waná aliases (kept so existing wana-* utilities');
css = stripAliasBlock(css, '/* Legacy Waná aliases (same values as @theme) */');
css = css.replaceAll('wana-', 'elevari-');
await writeFile(CSS, css, 'utf8');
console.log('✓ globals.css: alias blocks removed, wana-* → elevari-*');

const EXTS = new Set(['.ts', '.tsx']);
const ROOTS = ['app', 'components', 'lib'];
let changed = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTS.has(extname(full))) continue;
    const source = readFileSync(full, 'utf8');
    if (!source.includes('wana-')) continue;
    writeFileSync(full, source.replaceAll('wana-', 'elevari-'), 'utf8');
    changed += 1;
  }
}

for (const root of ROOTS) walk(join(ROOT, root));
console.log(`✓ ${changed} source files updated`);

