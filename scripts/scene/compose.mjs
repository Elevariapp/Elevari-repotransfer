/**
 * Flat (variable-free) SVG composition of the scene, used for the email banner and for design previews.
 * The web and React Native renderers stack the same geometry as separate animated layers.
 */
import { MOON, PINES_VIEW, SHORE, SUN, VIEW } from './art.mjs';
import { SKY_STOPS, THEMES } from './themes.mjs';

const f = (n) => String(Math.round(n * 100) / 100);

export function composeSvg(scene, themeName, opts = {}) {
  const t = THEMES[themeName];
  const {
    crop = [0, 0, VIEW.w, VIEW.h],
    width = VIEW.w,
    height = VIEW.h,
    sunX = SUN.x,
    pineScale = 0.92,
    scrim = '',
    detail = true,
  } = opts;
  const dx = sunX - SUN.x;
  const lift = t.liftSun * VIEW.h;
  const sky = SKY_STOPS.map((s, i) => `<stop offset="${s}" stop-color="${t[`sky${i}`]}"/>`).join('');

  const ridgeGrad = (id, top, lo, y) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y}" x2="0" y2="${y + 360}"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${lo}"/></linearGradient>`;

  const defs = `<defs>
<linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${VIEW.h}">${sky}</linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="${t.halo}" stop-opacity="${t.haloA * t.oHalo}"/><stop offset=".35" stop-color="${t.halo}" stop-opacity="${t.haloA * t.oHalo * 0.4}"/><stop offset="1" stop-color="${t.halo}" stop-opacity="0"/></radialGradient>
<radialGradient id="rays" gradientUnits="userSpaceOnUse" cx="${SUN.x}" cy="${SUN.y}" r="1000"><stop offset="0" stop-color="${t.halo}" stop-opacity=".26"/><stop offset="1" stop-color="${t.halo}" stop-opacity="0"/></radialGradient>
<radialGradient id="sun"><stop offset="0" stop-color="${t.sunCore}"/><stop offset=".62" stop-color="${t.sunMid}"/><stop offset="1" stop-color="${t.sunEdge}"/></radialGradient>
<radialGradient id="moon" cx=".4" cy=".38"><stop offset="0" stop-color="${t.moonCore}"/><stop offset="1" stop-color="${t.moonEdge}"/></radialGradient>
<radialGradient id="moonHalo"><stop offset="0" stop-color="${t.moonHalo}" stop-opacity=".38"/><stop offset="1" stop-color="${t.moonHalo}" stop-opacity="0"/></radialGradient>
<radialGradient id="mist"><stop offset="0" stop-color="${t.mist}" stop-opacity="${t.mistA}"/><stop offset="1" stop-color="${t.mist}" stop-opacity="0"/></radialGradient>
<radialGradient id="water"><stop offset="0" stop-color="${t.halo}" stop-opacity="${0.5 * Math.max(t.oSun, t.oHalo * 0.5)}"/><stop offset="1" stop-color="${t.halo}" stop-opacity="0"/></radialGradient>
<radialGradient id="win"><stop offset="0" stop-color="${t.windowLight}" stop-opacity=".55"/><stop offset="1" stop-color="${t.windowLight}" stop-opacity="0"/></radialGradient>
${ridgeGrad('far', t.farTop, t.farLo, scene.ridges.far.top)}
${ridgeGrad('mid', t.midTop, t.midLo, scene.ridges.mid.top)}
${ridgeGrad('near', t.nearTop, t.nearLo, scene.ridges.near.top)}
<linearGradient id="lake" gradientUnits="userSpaceOnUse" x1="0" y1="${SHORE}" x2="0" y2="${VIEW.h}"><stop offset="0" stop-color="${t.lake0}"/><stop offset=".45" stop-color="${t.lake1}"/><stop offset="1" stop-color="${t.lake2}"/></linearGradient>
<linearGradient id="refl" gradientUnits="userSpaceOnUse" x1="0" y1="${SHORE}" x2="0" y2="${SHORE + 150}"><stop offset="0" stop-color="${t.nearTop}" stop-opacity=".7"/><stop offset="1" stop-color="${t.nearTop}" stop-opacity="0"/></linearGradient>
</defs>`;

  const stars =
    t.oStars > 0
      ? `<g fill="${t.star}">${scene.stars.map(([x, y, r, , o]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity="${f(o * t.oStars)}"/>`).join('')}</g>`
      : '';

  const sunLayer = `<g transform="translate(${f(dx)} ${f(lift)})">
<circle cx="${SUN.x}" cy="${SUN.y}" r="640" fill="url(#halo)"/>
<g fill="url(#rays)" opacity="${f(0.9 * t.oSun)}">${scene.rays.map((r) => `<path d="${r.d}" fill-opacity="${r.o}"/>`).join('')}</g>
<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}" fill="url(#sun)" opacity="${t.oSun}"/>
</g>`;

  const craters = [
    [-14, -10, 11],
    [12, 6, 8],
    [-4, 19, 6],
    [18, -16, 5],
  ]
    .map(([cx, cy, r]) => `<circle cx="${MOON.x + dx + cx}" cy="${MOON.y + cy}" r="${r}" fill="${t.moonCrater}" opacity=".2"/>`)
    .join('');
  const moon =
    t.oMoon > 0
      ? `<g opacity="${t.oMoon}"><circle cx="${MOON.x + dx}" cy="${MOON.y}" r="200" fill="url(#moonHalo)"/><circle cx="${MOON.x + dx}" cy="${MOON.y}" r="${MOON.r}" fill="url(#moon)"/>${craters}</g>`
      : '';

  const clouds = scene.clouds
    .map((c) => `<path d="${c.d}" fill="${c.layer ? t.cloudLo : t.cloudHi}" fill-opacity="${f((c.layer ? t.cloudLoA : t.cloudHiA) * c.o)}"/>`)
    .join('');

  const ridge = (key, gradId, rimK) =>
    `<path d="${scene.ridges[key].d}" fill="url(#${gradId})"/><path d="${scene.ridges[key].crest}" fill="none" stroke="${t.rim}" stroke-width="1.4" stroke-opacity="${f(t.rimA * rimK)}"/>`;

  const mist = (i) => {
    const m = scene.mist[i];
    return `<ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.rx}" ry="${m.ry}" fill="url(#mist)"/>`;
  };

  const glintOpacity = Math.max(t.oSun, t.oMoon * 0.55);
  const lake = `<path d="${scene.lake.d}" fill="url(#lake)"/>
<ellipse cx="${sunX}" cy="${SHORE + 22}" rx="330" ry="80" fill="url(#water)"/>
<path d="${scene.lake.reflection}" fill="url(#refl)"/>
<g stroke="${t.ripple}" stroke-linecap="round" stroke-width="1.4">${scene.lake.ripples.map(([x, y, w, o]) => `<path d="M${x},${y}h${w}" opacity="${o}"/>`).join('')}</g>
<g fill="${t.glint}" opacity="${f(0.9 * glintOpacity)}">${scene.lake.glints.map(([x, y, w, h]) => `<rect x="${f(x + dx - w / 2)}" y="${y}" width="${w}" height="${h}" rx="${f(h / 2)}"/>`).join('')}</g>`;

  const place = (side) => {
    const s = pineScale;
    const x = side === 'left' ? 0 : VIEW.w - PINES_VIEW.w * s;
    return `translate(${f(x)} ${f(VIEW.h - VIEW.h * s)}) scale(${s})`;
  };
  const cluster = (c, side) => `<g transform="${place(side)}">
<path d="${c.back}" fill="${t.pineBack}"/><path d="${c.bank}" fill="${t.pine}"/><path d="${c.front}" fill="${t.pine}"/>${
    c.cabin
      ? `<circle cx="${c.cabin.glow[0]}" cy="${c.cabin.glow[1]}" r="${c.cabin.glow[2]}" fill="url(#win)" opacity="${t.oWindow}"/><path d="${c.cabin.body}" fill="${t.pine}"/><rect x="${c.cabin.win[0]}" y="${c.cabin.win[1]}" width="${c.cabin.win[2]}" height="${c.cabin.win[3]}" rx="1.5" fill="${t.windowLight}" opacity="${t.oWindow}"/>`
      : ''
  }</g>`;

  const [cx, cy, cw, ch] = crop;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${cx} ${cy} ${cw} ${ch}">
${defs}
<rect x="-20" y="-20" width="${VIEW.w + 40}" height="${VIEW.h + 40}" fill="url(#sky)"/>
${stars}${sunLayer}${moon}${clouds}
${ridge('far', 'far', 1)}${mist(0)}
${ridge('mid', 'mid', 0.7)}${mist(1)}
${ridge('near', 'near', 0.45)}
${lake}
${detail ? cluster(scene.pines.left, 'left') + cluster(scene.pines.right, 'right') : ''}
${scrim}
</svg>`;
}
