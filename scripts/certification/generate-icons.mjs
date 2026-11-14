/**
 * Generates the App Store / Play Store icon set from the brand SVG master.
 * Usage: node scripts/certification/generate-icons.mjs
 * Output: public/brand/icons/icon-<size>.png + app/apple-icon.png
 */
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE = join(ROOT, 'public', 'brand', 'app-icon-master.svg');
const OUT_DIR = join(ROOT, 'public', 'brand', 'icons');
const SIZES = [16, 32, 64, 128, 256, 512, 1024];

await mkdir(OUT_DIR, { recursive: true });
const svg = await readFile(SOURCE);

for (const size of SIZES) {
  const target = join(OUT_DIR, `icon-${size}.png`);
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 30, g: 72, b: 53, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(target);
  console.log(`✓ ${target.replace(ROOT + '\\\\', '')} (${size}x${size})`);
}

const appleTarget = join(ROOT, 'app', 'apple-icon.png');
await sharp(svg, { density: 384 })
  .resize(180, 180, { fit: 'contain', background: { r: 30, g: 72, b: 53, alpha: 1 } })
  .png({ compressionLevel: 9 })
  .toFile(appleTarget);
console.log(`✓ ${appleTarget.replace(ROOT + '\\\\', '')} (180x180)`);

await mkdir(dirname(join(OUT_DIR, 'x')), { recursive: true });
