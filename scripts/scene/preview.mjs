/**
 * Design preview: renders the flat scene for each theme to PNG (never part of the build).
 *   node scripts/scene/preview.mjs [outDir] [--crop x,y,w,h] [--themes day,golden,night] [--scale 1]
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildScene } from './scene.mjs';
import { composeSvg } from './compose.mjs';
import { THEME_NAMES, assertThemes } from './themes.mjs';

assertThemes();
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const outDir = args.find((a) => !a.startsWith('--') && args.indexOf(a) === 0) ?? '/root/shots/scenes';
const crop = (flag('crop', '0,0,1600,900') ?? '').split(',').map(Number);
const themes = (flag('themes', THEME_NAMES.join(',')) ?? '').split(',');
const scale = Number(flag('scale', '1'));
mkdirSync(outDir, { recursive: true });
const scene = buildScene();
for (const name of themes) {
  const svg = composeSvg(scene, name, { crop, width: Math.round(crop[2] * scale), height: Math.round(crop[3] * scale) });
  const tag = flag('tag', 'v2');
  if (flag('svg')) writeFileSync(`${outDir}/${tag}-${name}.svg`, svg);
  await sharp(Buffer.from(svg), { density: 72 }).png().toFile(`${outDir}/${tag}-${name}.png`);
  console.log(`${name}: ${(svg.length / 1024).toFixed(1)} KB svg -> ${outDir}/${tag}-${name}.png`);
}
const sizes = scene.layers.map((l) => `${l.id}:${JSON.stringify(l).length}`).join(' ');
console.log(sizes);
