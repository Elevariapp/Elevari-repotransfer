/**
 * Flat composer: one theme, no animation, a plain standalone SVG. Used for the email banners and for design previews.
 */
import { THEMES } from './themes.mjs';
import { makeRenderer } from './svg.mjs';

export function composeSvg(scene, themeName, { crop = [0, 0, scene.view.w, scene.view.h], width = 1600, height = 900, only = null, fallback = null } = {}) {
  const theme = THEMES[themeName];
  const r = makeRenderer('flat', theme);
  const layers = scene.layers.filter((l) => !only || only.includes(l.id));
  const [x, y, w, h] = crop;
  const body = layers.map((l) => `<g id="${l.id}">${r.layer(l)}</g>`).join('');
  const bg = fallback ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fallback}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${width}" height="${height}">${bg}${body}</svg>`;
}
