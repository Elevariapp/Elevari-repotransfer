/**
 * Generates every brand raster from the SVG sources so icons are never edited by hand.
 * Usage (from the repo root): node scripts/certification/generate-icons.mjs
 *
 * Sources
 *   public/brand/app-icon-master.svg  1024 master: plate + Horizon glyph
 *   app/icon.svg                      32 px favicon with chunkier strokes for tiny sizes
 *
 * Outputs
 *   public/brand/icons/icon-<size>.png  16-256 keep the rounded plate; 192/512/1024 are full-bleed (web manifest, store)
 *   app/apple-icon.png                  180 px touch icon
 *   mobile/assets/*.png                 Expo launcher, adaptive layers, splash, favicon, notification
 *
 * Store and launcher icons are full-bleed squares without alpha because Apple and Google apply
 * their own mask. The adaptive, monochrome and splash glyphs stay inside the Android safe circle.
 */
import { mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const WEB_ICONS = join(ROOT, 'public', 'brand', 'icons');
const MOBILE = join(ROOT, 'mobile', 'assets');
const PLATE_COLOR = '#9A340E';
// Fractions of the canvas. Android's adaptive-icon safe circle has a radius of 33/108 = 0.306.
const SAFE_RADIUS = 0.29;
const SPLASH_RADIUS = 0.3;
const NOTIFICATION_RADIUS = 0.46;

const master = await readFile(join(ROOT, 'public', 'brand', 'app-icon-master.svg'), 'utf8');
const favicon = await readFile(join(ROOT, 'app', 'icon.svg'), 'utf8');

const defs = master.match(/<defs>[\s\S]*?<\/defs>/)?.[0];
const plate = master.match(/<rect\b[^>]*plateGradient[^>]*\/>/)?.[0];
if (!defs || !plate) throw new Error('app-icon-master.svg must keep its <defs> and plate <rect>');
const glyph = master.slice(master.indexOf(plate) + plate.length, master.lastIndexOf('</svg>')).trim();

const square = (svg) => svg.replace(/\brx="[\d.]+"/, 'rx="0"');
const canvas = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">${inner}</svg>`;
// Single-colour version for Android themed icons and notifications (only the alpha channel is used).
const silhouette = (markup) =>
  markup
    .replace(/\b(stroke|fill)="#[0-9a-fA-F]{3,8}"/g, '$1="#FFFFFF"')
    .replace(/\s(?:opacity|filter)="[^"]*"/g, '');

// Bounding-box centre and farthest opaque pixel of a glyph rendered at 1 unit = 1 px.
async function measure(markup) {
  const { data, info } = await sharp(Buffer.from(canvas(defs + markup)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const solid = (x, y) => data[(y * width + x) * channels + channels - 1] > 16;
  let x0 = width;
  let y0 = height;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!solid(x, y)) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let far = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (solid(x, y)) far = Math.max(far, Math.hypot(x - cx, y - cy));
    }
  }
  return { cx, cy, far };
}

// Centres the glyph and scales it so its farthest point lies `radius` (canvas fraction) from the centre.
function place(markup, { cx, cy, far }, radius) {
  const scale = (radius * 1024) / far;
  return canvas(
    `${defs}<g transform="translate(512 512) scale(${scale}) translate(${-cx} ${-cy})">${markup}</g>`,
  );
}

async function write(target, svg, { viewBox = 1024, size, flat = false }) {
  await mkdir(dirname(target), { recursive: true });
  // Rasterise at 2x the target size, then downsample for clean edges.
  let image = sharp(Buffer.from(svg), { density: (72 * size * 2) / viewBox }).resize(size, size);
  if (flat) image = image.flatten({ background: PLATE_COLOR });
  await image.png({ compressionLevel: 9 }).toFile(target);
  const { width, height, hasAlpha } = await sharp(target).metadata();
  const { size: bytes } = await stat(target);
  const name = relative(ROOT, target).replaceAll('\\', '/');
  console.log(`✓ ${name} (${width}x${height}, ${bytes} B, ${hasAlpha ? 'alpha' : 'opaque'})`);
}

const color = await measure(glyph);
const mono = await measure(silhouette(glyph));

// Web and design hand-off
for (const size of [16, 32, 64]) {
  await write(join(WEB_ICONS, `icon-${size}.png`), favicon, { viewBox: 32, size });
}
for (const size of [128, 256]) {
  await write(join(WEB_ICONS, `icon-${size}.png`), master, { size });
}
for (const size of [192, 512, 1024]) {
  await write(join(WEB_ICONS, `icon-${size}.png`), square(master), { size, flat: true });
}
await write(join(ROOT, 'app', 'apple-icon.png'), square(master), { size: 180, flat: true });

// Mobile (Expo)
await write(join(MOBILE, 'icon.png'), square(master), { size: 1024, flat: true });
await write(join(MOBILE, 'android-icon-background.png'), canvas(defs + square(plate)), {
  size: 512,
  flat: true,
});
await write(join(MOBILE, 'android-icon-foreground.png'), place(glyph, color, SAFE_RADIUS), {
  size: 512,
});
await write(
  join(MOBILE, 'android-icon-monochrome.png'),
  place(silhouette(glyph), mono, SAFE_RADIUS),
  { size: 432 },
);
await write(join(MOBILE, 'splash-icon.png'), place(glyph, color, SPLASH_RADIUS), { size: 1024 });
await write(join(MOBILE, 'favicon.png'), favicon, { viewBox: 32, size: 48 });
await write(
  join(MOBILE, 'notification-icon.png'),
  place(silhouette(glyph), mono, NOTIFICATION_RADIUS),
  { size: 96 },
);
