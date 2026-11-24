#!/usr/bin/env node
/**
 * Rasterises the quiet WhatsApp glyph for transactional email (mail clients cannot run SVG).
 *
 *   node scripts/email/generate-whatsapp-glyph.mjs
 *
 * The two paths are read from components/whatsapp/WhatsAppGlyph.tsx, so the website, the app and the emails
 * stay one drawing. Outputs are hosted like the logo (GitHub raw, see EMAIL_BRAND in
 * api/src/lib/email-templates/brand.ts):
 *   public/brand/email/whatsapp-terracotta.png   links on the white body
 *   public/brand/email/whatsapp-amber.png        links on the dark footer
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SIZE = 72; // shown at 18px, so 4x for high-density screens
const STROKE = 1.8; // same hairline as the web glyph

// Same hex values as the email palette: EMAIL_BRAND.linkColor and the footer link colour in layout.ts.
const VARIANTS = [
  { file: 'whatsapp-terracotta.png', color: '#C2410C' },
  { file: 'whatsapp-amber.png', color: '#EA9A2E' },
];

const source = await readFile(join(ROOT, 'components/whatsapp/WhatsAppGlyph.tsx'), 'utf8');
function readPath(name) {
  const match = source.match(new RegExp(`const ${name} =\\s*'([^']+)'`));
  if (!match) throw new Error(`${name} not found in components/whatsapp/WhatsAppGlyph.tsx`);
  return match[1];
}
const bubble = readPath('BUBBLE');
const handset = readPath('HANDSET');

const { default: sharp } = await import('sharp');
for (const { file, color } of VARIANTS) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 32 32">` +
    `<path d="${bubble}" fill="none" stroke="${color}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${handset}" fill="${color}"/></svg>`;
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const out = join(ROOT, 'public/brand/email', file);
  await writeFile(out, png);
  console.log(`wrote ${relative(ROOT, out)} (${SIZE}x${SIZE}, ${png.length} bytes)`);
}
