/**
 * Elevari scene v2: one 1600 x 900 composition that is re-lit for the three times of day. The layout never changes
 * between themes (so a theme change morphs instead of cutting): the sun, the moon, the glow and the shadows move, the
 * colours cross-fade, and the lights, the fire and the stars fade in.
 *
 * Layers run back to front. `depth` drives pointer parallax. `a` names an animation implemented by each renderer:
 * on a layer it moves the whole layer (compositor only); on a node it animates that element.
 */
import { VIEW, mulberry32, buildRidge, ridgeFacets, ribbon, fir, cumulus, lens, grass, circlePath, sparklePath, polyline, num, envelope } from './geom.mjs';
import { P, S, C, G, lin, rad, layer } from './nodes.mjs';
import { SKY_STOPS } from './themes.mjs';
import { dome, gathering, family, fire, fireside, broadleaf, stringLights } from './camp.mjs';
import { shadowOf } from './people.mjs';

const W = VIEW.w;
const H = VIEW.h;
const FULL = `M0,0H${W}V${H}H0Z`;
const dots = (pts) => pts.map(([x, y]) => `M${num(x, 0)},${num(y, 0)}h.1`).join('');

function sky() {
  const stops = SKY_STOPS.map((s, i) => [s, `$sky${i}`, 1]);
  return layer('sky', 0, [P(FULL, '@sky')], { defs: [lin('sky', 0, 0, 0, H, stops)] });
}

function orbs() {
  const defs = [
    rad('sunBloom', 0, 0, 440, [[0, '$glow', 0.95], [0.2, '$glow', 0.55], [0.55, '$glow', 0.16], [1, '$glow', 0]]),
    rad('sunDisc', 0, 0, 60, [[0, '$sunCore', 1], [0.6, '$sunMid', 1], [1, '$sunEdge', 1]]),
    rad('moonHalo', 0, 0, 340, [[0, '$moonHalo', 0.5], [0.18, '$moonHalo', 0.3], [0.5, '$moonHalo', 0.08], [1, '$moonHalo', 0]]),
    rad('moonDisc', -14, -14, 62, [[0, '$moonCore', 1], [1, '$moonEdge', 1]]),
  ];
  const craters = [[-16, -12, 9], [14, 10, 12], [-2, 22, 6], [20, -20, 5], [-26, 14, 5]].map(([x, y, r]) => circlePath(x, y, r)).join('');
  return layer('orbs', 0.1, [
    G([C(0, 0, 440, '@sunBloom', { o: '$haloA' }), C(0, 0, 60, '@sunDisc', { h: 'sun' })], { pos: ['sunX', 'sunY', 'sunK'], o: '$oSun' }),
    G([C(0, 0, 340, '@moonHalo', { o: '$haloA', h: 'moonHalo' }), C(0, 0, 54, '@moonDisc', { h: 'moon' }), P(craters, '$moonCrater', { o: 0.32 })], { pos: ['moonX', 'moonY', 'moonK'], o: '$oMoon' }),
  ], { defs });
}

function rays() {
  const rand = mulberry32(5);
  const pt = (ang, r) => `${num(Math.cos(ang) * r, 0)},${num(Math.sin(ang) * r, 0)}`;
  const fan = (n, halfMin, halfSpan, r1) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.3;
      const half = halfMin + rand() * halfSpan;
      d += `M${pt(a - half * 0.3, 90)}L${pt(a - half, r1)}L${pt(a + half, r1)}L${pt(a + half * 0.3, 90)}Z`;
    }
    return d;
  };
  return layer('rays', 0.15, [
    G([P(fan(8, 0.05, 0.05, 1000), '@rays', { o: 0.5 }), P(fan(13, 0.012, 0.02, 1100), '@rays')], { pos: ['sunX', 'sunY', 'sunK'], o: '$oRays' }),
  ], { defs: [rad('rays', 0, 0, 1000, [[0, '$glow', 0.45], [0.45, '$glow', 0.14], [1, '$glow', 0]])], a: 'rays', du: 120 });
}

function milkyWay() {
  const rand = mulberry32(13);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const dust = [];
  const bright = [];
  for (let i = 0; i < 240; i++) {
    const t = rand();
    const cx = 330 + t * 800;
    const cy = 520 - t * 520;
    const off = gauss() * 64;
    (i % 5 === 0 ? bright : dust).push([cx + off * 0.55, cy + off * 0.84]);
  }
  const defs = [
    rad('mw1', 0, 0, 260, [[0, '$mw1', 0.36], [0.5, '$mw1', 0.13], [1, '$mw1', 0]], 'scale(1 .32)'),
    rad('mw2', 0, 0, 200, [[0, '$mw2', 0.3], [0.55, '$mw2', 0.09], [1, '$mw2', 0]], 'scale(1 .3)'),
  ];
  const glows = [[520, 340, 340, '@mw1'], [760, 200, 390, '@mw2'], [980, 70, 320, '@mw1']];
  return layer('mw', 0.05, [
    G([
      ...glows.map(([x, y, r, f]) => G([C(0, 0, r, f)], { tx: `translate(${x} ${y}) rotate(-57)` })),
      S(dots(dust), '$mw1', 1.3, { o: 0.75 }),
      S(dots(bright), '$star', 1.9),
    ], { o: '$oMw' }),
  ], { defs, a: 'skydrift', du: 260 });
}

function stars() {
  const rand = mulberry32(11);
  const field = [[], [], []];
  for (let i = 0; i < 126; i++) field[i % 3].push([rand() * W, Math.pow(rand(), 1.35) * 540]);
  const twinkle = [];
  for (let i = 0; i < 20; i++) {
    twinkle.push(C(40 + rand() * (W - 80), 20 + Math.pow(rand(), 1.4) * 480, 1.5 + rand() * 1.5, '$star', { a: 'twinkle', du: 2.6 + rand() * 3.4, dl: rand() * 5 }));
  }
  const sparkles = [[640, 74, 7], [1030, 124, 6], [300, 214, 5], [1380, 84, 6], [860, 254, 5], [140, 84, 5], [1490, 304, 4], [470, 40, 4]].map(([x, y, r], i) =>
    P(sparklePath(x, y, r, 0.14), '$star', { a: 'twinkle', du: 3 + (i % 3), dl: i * 0.7, h: 'stars' }));
  return layer('stars', 0.06, [
    G([
      S(dots(field[0]), '$star', 2),
      S(dots(field[1]), '$star', 2.8, { o: 0.85 }),
      S(dots(field[2]), '$star', 3.6, { o: 0.7 }),
      ...twinkle,
      ...sparkles,
    ], { o: '$oStars' }),
  ], { a: 'skydrift', du: 260 });
}

function shoot() {
  const wrap = (x, y, dx, dy, du, dl) => {
    const L = 120;
    const ang = Math.atan2(dy, dx);
    const tx = -Math.cos(ang) * L;
    const ty = -Math.sin(ang) * L;
    return G([
      G([
        P(`M0,0L${num(tx, 1)},${num(ty - 1.6, 1)}L${num(tx, 1)},${num(ty + 1.6, 1)}Z`, '@shoot'),
        C(0, 0, 2.2, '$star'),
      ], { a: 'shoot', du, dl, v: { dx, dy } }),
    ], { tx: `translate(${x} ${y})`, o: '$oShoot' });
  };
  return layer('shoot', 0.08, [wrap(1040, 80, -300, 120, 17, 4), wrap(700, 150, 320, 90, 23, 13)], {
    defs: [lin('shoot', 0, 0, -120, 0, [[0, '$star', 1], [1, '$star', 0]])],
  });
}

function clouds(id, depth, specs, seed, du, dx) {
  const rand = mulberry32(seed);
  const items = specs.flatMap(([cx, cy, w, h]) => [
    P(cumulus(rand, cx, cy, w, h), '$cloudHi'),
    P(lens(cx, cy - h * 0.04, w * 0.94, h * 0.3), '$cloudLo', { o: 0.55 }),
  ]);
  return layer(id, depth, [G(items, { o: '$oCloud' })], { a: 'drift', du, v: { dx } });
}

function birds() {
  const wing = 'M-8,0Q-4,-6 0,0Q4,-6 8,0';
  const pos = [[0, 0, 1.2], [26, 12, 1], [-30, 14, 0.9], [52, 28, 0.8], [-58, 30, 0.75]];
  const flock = pos.map(([x, y, s], i) => G([S(wing, '$bird', 1.9, { a: 'flap', du: 0.9 + i * 0.08, dl: i * 0.17 })], { tx: `translate(${x} ${y}) scale(${s})` }));
  const sw = 'M-9,-1Q-4,-8 2,-2Q6,-6 11,-5Q8,-1 3,1L10,6L1,3L-4,7L-3,1Z';
  const swallows = [[0, 0, 1.1], [90, -28, 0.9], [-80, 24, 1], [160, 30, 0.8], [-150, -6, 0.85]].map(([x, y, s], i) =>
    G([P(sw, '$bird', { a: 'flap', du: 0.7 + i * 0.07, dl: i * 0.2 })], { tx: `translate(${x} ${y}) scale(${s})` }));
  return layer('birds', 0.3, [
    G([G(flock, { tx: 'translate(760 270)' })], { a: 'birds', du: 80, v: { dx: 260, dy: -26 }, o: '$oBirds' }),
    G([G(swallows, { tx: 'translate(900 560)' })], { a: 'swoop', du: 26, v: { dx: -220, dy: 50 }, o: '$oSwallow' }),
  ]);
}

const RIDGES = [
  { i: 1, seed: 21, env: [[0, 505], [250, 490], [520, 455], [760, 420], [960, 436], [1100, 474], [1220, 488], [1330, 430], [1440, 372], [1520, 332], [1600, 350]], amp: 54, freq: 0.012, octaves: 4, depth: 0.3, fade: 260, haze: 0.5, facets: { minRise: 16 } },
  { i: 2, seed: 33, env: [[0, 556], [300, 540], [600, 506], [820, 496], [1000, 508], [1180, 500], [1300, 470], [1420, 432], [1520, 420], [1600, 438]], amp: 46, freq: 0.014, octaves: 4, depth: 0.5, fade: 220, haze: 0.46, facets: { minRise: 14 } },
  { i: 3, seed: 47, env: [[0, 602], [300, 592], [620, 562], [860, 550], [1060, 554], [1250, 530], [1420, 514], [1600, 530]], amp: 36, freq: 0.017, octaves: 4, depth: 0.8, fade: 180, haze: 0.42, facets: { minRise: 12 } },
  { i: 4, seed: 59, env: [[0, 650], [260, 636], [560, 614], [900, 602], [1180, 598], [1400, 584], [1600, 598]], amp: 26, freq: 0.02, octaves: 3, depth: 1.2, fade: 150, haze: 0.4, trees: 'tiny' },
  { i: 5, seed: 71, env: [[0, 704], [260, 690], [520, 666], [820, 654], [1100, 650], [1350, 642], [1600, 654]], amp: 20, freq: 0.024, octaves: 3, depth: 1.6, fade: 120, haze: 0.3, trees: 'tiny' },
];

function ridges() {
  return RIDGES.map((cfg) => {
    const r = buildRidge({ seed: cfg.seed, step: 14, env: cfg.env, amp: cfg.amp, freq: cfg.freq, octaves: cfg.octaves, ridged: !cfg.trees, floor: 960 });
    const fac = cfg.facets ? ridgeFacets(r.pts, cfg.facets) : null;
    const defs = [
      lin(`r${cfg.i}`, 0, r.top, 0, r.top + cfg.fade, [[0, `$r${cfg.i}a`, 1], [1, `$r${cfg.i}b`, 1]]),
      lin(`h${cfg.i}`, 0, r.top, 0, r.top + cfg.fade, [[0, '$mist', 0], [1, '$mist', cfg.haze]]),
    ];
    const nodes = [P(r.d, `@r${cfg.i}`)];
    if (fac) nodes.push(P(fac.lit, '$lit', { o: '$litA' }), P(fac.shade, '$shade', { o: '$shadeA' }));
    if (cfg.trees) {
      const rand = mulberry32(cfg.seed);
      let d = '';
      for (let k = 0; k < r.pts.length - 1; k++) {
        if (rand() < 0.45) continue;
        const [x, y] = r.pts[k];
        const h = 12 + rand() * 16;
        d += `M${num(x - h * 0.28, 0)},${num(y + 3, 0)}L${num(x, 0)},${num(y - h, 0)}L${num(x + h * 0.28, 0)},${num(y + 3, 0)}Z`;
      }
      nodes.push(P(d, cfg.i === 4 ? '$pineBack' : '$pine', { o: 0.55 }));
    }
    nodes.push(P(r.d, `@h${cfg.i}`));
    if (cfg.i <= 3) nodes.push(S(r.crest, '$rim', 1.5, { o: '$rimA' }));
    return { layer: layer(`r${cfg.i}`, cfg.depth, nodes, { defs }), crest: r };
  });
}

function mist() {
  return layer('mist', 1.3, [
    P('M-100,640Q300,600 800,628T1700,616V690H-100Z', '@mistG', { o: '$oMist' }),
    P('M-100,700Q400,676 900,700T1700,690V760H-100Z', '@mistG', { o: '$oMist', ok: 0.7 }),
  ], { defs: [lin('mistG', 0, 600, 0, 770, [[0, '$mist', 0], [0.5, '$mist', 0.55], [1, '$mist', 0]])], a: 'drift', du: 160, v: { dx: -70 } });
}

// River: winds across the middle ground behind the camp, then widens towards the bottom-left corner.
const RIVER = [[1650, 704, 52], [1560, 714, 60], [1460, 734, 72], [1360, 752, 84], [1260, 754, 80], [1160, 738, 68], [1070, 720, 56], [990, 718, 58], [900, 732, 72], [810, 750, 88], [730, 762, 100], [650, 782, 112], [570, 810, 126], [490, 850, 146], [400, 888, 172], [300, 942, 202], [190, 1000, 234], [80, 1056, 262]];

function riverGeometry() {
  const r = ribbon(RIVER, { samples: 96 });
  const upper = r.left;
  const lower = r.right;
  const d = `${polyline(upper)}L${polyline([...lower].reverse()).slice(1)}Z`;
  return { ...r, upper, lower, d };
}

function river(rg) {
  const rand = mulberry32(91);
  const defs = [
    lin('water', 0, 700, 0, 1000, [[0, '$w0', 1], [0.4, '$w1', 1], [1, '$w2', 1]]),
    rad('sunRefl', 0, 0, 170, [[0, '$glow', 0.95], [0.5, '$glow', 0.34], [1, '$glow', 0]], 'scale(.5 1)'),
    rad('moonRefl', 0, 0, 170, [[0, '$moonHalo', 0.9], [0.5, '$moonHalo', 0.3], [1, '$moonHalo', 0]], 'scale(.5 1)'),
    { id: 'riv', k: 'c', d: rg.d },
  ];
  const mixPt = (i, f) => [rg.upper[i][0] * (1 - f) + rg.lower[i][0] * f, rg.upper[i][1] * (1 - f) + rg.lower[i][1] * f];
  const streak = (f, from) => polyline(rg.upper.map((_, i) => mixPt(i, f)).filter((_, i) => i >= from));
  const glints = [];
  for (let k = 0; k < 24; k++) {
    const i = 4 + Math.floor(rand() * 88);
    const [x, y] = mixPt(i, 0.15 + rand() * 0.7);
    const w = rg.centre[i][2];
    glints.push(P(sparklePath(x, y, 3.5 + w * 0.05, 0.16), '$glint', { a: 'glint', du: 2.4 + rand() * 2.4, dl: rand() * 4 }));
  }
  const inner = [
    S(streak(0.3, 3), '$flow', 1.6, { o: 0.45, da: '30 48 12 64' }),
    S(streak(0.55, 3), '$flow', 1.3, { o: 0.4, da: '18 60 36 40' }),
    S(streak(0.78, 3), '$flow', 1.6, { o: 0.35, da: '40 36 14 70' }),
    S(polyline(rg.lower), '$wBank', 3, { o: 0.9 }),
    S(polyline(rg.upper), '$wBank', 1.6, { o: 0.5 }),
    G([C(0, 0, 170, '@sunRefl')], { pos: ['sunX', 748, 1], o: '$oSun' }),
    G([C(0, 0, 170, '@moonRefl')], { pos: ['moonX', 746, 1], o: '$oMoon' }),
    ...glints,
  ];
  return layer('river', 2, [P(rg.d, '@water'), G(inner, { cp: 'riv' })], { defs });
}

function meadow() {
  const top = envelope([[0, 706], [200, 694], [460, 702], [760, 694], [1000, 690], [1300, 676], [1600, 680]]);
  const farDome = dome({ x: 1330, base: 706, rx: 40, id: 'c', rail: 'none' });
  const rand = mulberry32(103);
  let tufts = '';
  const put = (x0, x1, n) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i + rand() * 0.7) / n) * (x1 - x0);
      if (Math.abs(x - 1330) < 56) continue;
      const h = 20 + rand() * 22;
      tufts += fir(rand, x, top(x) + 5 + rand() * 7, h, h * 0.22);
    }
  };
  put(360, 780, 9);
  put(1110, 1590, 15);
  const pts = [];
  for (let x = 0; x <= W; x += 40) pts.push([x, top(x)]);
  const ground = `${polyline(pts)}V960H0Z`;
  return layer('meadow', 1.8, [
    P(ground, '@g1'),
    P(tufts, '$pineBack', { o: 0.8 }),
    ...farDome.nodes,
    P(circlePath(farDome.door[0], farDome.door[1], 46), '@dg-c', { o: '$oWindow' }),
  ], { defs: [lin('g1', 0, 670, 0, 900, [[0, '$g1a', 1], [1, '$g1b', 1]]), farDome.glow] });
}

function bank(rg, shadows) {
  const lower = rg.lower;
  const first = lower[0];
  const last = lower[lower.length - 1];
  const d = `${polyline(lower)}L${num(last[0], 0)},1120L1700,1120L1700,${num(first[1], 0)}Z`;
  const rand = mulberry32(131);
  let patches = '';
  for (let i = 0; i < 9; i++) {
    const x = 640 + rand() * 860;
    const y = 800 + rand() * 90;
    patches += `M${num(x - 60, 0)},${num(y, 0)}a60,10 0 1 1 120,0a60,10 0 1 1 -120,0Z`;
  }
  return layer('bank', 2.4, [
    P(d, '@g2'),
    P(patches, '$lit', { o: 0.1 }),
    S(polyline(lower), '$grass2', 3.4, { o: 0.9 }),
    P('M1159,858a96,15 0 1 1 192,0a96,15 0 1 1 -192,0Z', '$dirt', { o: 0.6 }),
    ...shadows,
  ], { defs: [lin('g2', 0, 740, 0, 920, [[0, '$g2a', 1], [1, '$g2b', 1]])] });
}

const sh = (x, y, w, len, head = true) => P(shadowOf(x, y, w, len, 1220, head), '$shadow', { o: '$oShadow', shd: [x, y] });

function buildCamp() {
  const domeA = dome({ x: 712, base: 826, rx: 96, rail: 'both', id: 'a' });
  const domeB = dome({ x: 1450, base: 812, rx: 92, rail: 'both', flag: true, id: 'b' });
  const table = gathering({ x: 905, y: 802, h: 84 });
  const fam = family({ x: 1005, y: 852, h: 106 });
  const pit = fire({ x: 1255, y: 854 });

  const pole = (x, y, h) => S(`M${num(x)},${num(y)}V${num(y - h)}`, '$post', 4);
  const lights = [
    ...stringLights(domeA.lightsB[0], domeA.lightsB[1], 813, 733, 9, 5, 3),
    ...stringLights(813, 733, 997, 733, 13, 9, 5),
    ...stringLights(domeA.lightsA[0], domeA.lightsA[1], domeA.lightsB[0], domeA.lightsB[1], 10, 12, 7),
    ...stringLights(domeB.lightsA[0], domeB.lightsA[1], domeB.lightsB[0], domeB.lightsB[1], 15, 13, 9),
  ];
  const camp = [
    ...domeA.nodes,
    ...domeB.nodes,
    pole(813, 802, 69),
    pole(997, 802, 69),
    ...table.nodes,
    ...fam.nodes,
    ...fireside({ x: 1187, y: 854, h: 100, face: 1, skin: '$skin1', hair: '$hair3', top: '$cl1', bottom: '$pant1', style: 'long' }),
    ...fireside({ x: 1323, y: 854, h: 104, face: -1, skin: '$skin2', hair: '$hair1', top: '$cl5', bottom: '$pant2', style: 'short' }),
    ...lights,
  ];
  const domeGlows = [
    P(circlePath(domeA.door[0], domeA.door[1], 100), '@dg-a', { o: '$oWindow' }),
    P(circlePath(domeB.door[0], domeB.door[1], 96), '@dg-b', { o: '$oWindow' }),
  ];
  const shadows = [
    sh(712, 842, 190, 70, false),
    sh(1450, 828, 180, 66, false),
    sh(905, 806, 160, 40, false),
    ...fam.shadowX.map(([x, h]) => sh(x, 852, h * 0.22, h * 0.74)),
    sh(1187, 858, 60, 50),
    sh(1323, 858, 60, 50),
  ];
  return { camp, domeGlows, shadows, domeA, domeB, pit };
}

function fireLayers(pit, domeGlowNodes, defs) {
  const [big, core] = pit.glowNodes;
  return [
    layer('glow', 3.1, domeGlowNodes, { defs }),
    layer('fireglow', 3.1, [{ ...big, a: undefined, du: undefined }], { defs: pit.glow, a: 'flick', du: 3.1 }),
    layer('fire', 3.2, [...pit.back, core, pit.flames, ...pit.embers, ...pit.front]),
  ];
}

function trees() {
  const rand = mulberry32(151);
  const left = [];
  const right = [];
  const row = (arr, xs, hs, base, fill) => {
    let d = '';
    xs.forEach((x, i) => {
      d += fir(rand, x, base, hs[i], hs[i] * 0.2);
    });
    arr.push(P(d, fill));
  };
  row(left, [20, 120, 220, 330], [340, 290, 310, 250], 900, '$pineBack');
  row(left, [-20, 70, 170, 270], [270, 330, 230, 190], 930, '$pine');
  row(right, [1560, 1620, 1670], [310, 350, 290], 890, '$pineBack');
  row(right, [1545, 1600, 1655], [220, 270, 210], 910, '$pine');
  const mid = broadleaf({ x: 868, base: 792, h: 150, seed: 161 });
  return {
    mid: layer('treesM', 2.6, mid),
    sides: [layer('treesL', 3.6, left, { a: 'sway', du: 9, dl: 0 }), layer('treesR', 3.6, right, { a: 'sway', du: 8.5, dl: 0.8 })],
  };
}

function fore() {
  const rand = mulberry32(173);
  let tall = '';
  tall += grass(rand, -20, 560, 906, { count: 22, hMin: 30, hMax: 86, spread: 9 });
  tall += grass(rand, 1120, 1640, 906, { count: 20, hMin: 28, hMax: 78, spread: 9 });
  tall += grass(rand, 560, 1120, 906, { count: 14, hMin: 12, hMax: 30, spread: 9 });
  const low = grass(rand, -20, 1640, 908, { count: 26, hMin: 14, hMax: 40, spread: 8 });
  const flowers = [[], [], [], []];
  let stems = '';
  const put = (x0, x1, n, hMin, hMax) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + rand() * (x1 - x0);
      const h = hMin + rand() * (hMax - hMin);
      const lean = (rand() - 0.5) * 16;
      stems += `M${num(x, 0)},906Q${num(x + lean * 0.4, 0)},${num(906 - h * 0.55, 0)} ${num(x + lean, 0)},${num(906 - h, 0)}`;
      flowers[Math.floor(rand() * 4)].push([x + lean, 906 - h]);
    }
  };
  put(-10, 560, 20, 40, 110);
  put(1130, 1620, 18, 36, 100);
  put(560, 1130, 6, 14, 34);
  return layer('fore', 5, [
    P(tall, '$grass1'),
    P(low, '$grass2', { o: 0.9 }),
    S(stems, '$grass1', 1.3),
    S(dots(flowers[0]), '$fl1', 6),
    S(dots(flowers[1]), '$fl2', 6.6),
    S(dots(flowers[2]), '$fl3', 6.2),
    S(dots(flowers[3]), '$fl4', 6),
  ], { a: 'sway2', du: 7, dl: 0.4 });
}

function fx() {
  const rand = mulberry32(191);
  const flies = [];
  for (let i = 0; i < 14; i++) {
    const x = 300 + rand() * 1200;
    const y = 640 + rand() * 230;
    flies.push(G([C(x, y, 8, '$firefly', { o: 0.22 }), C(x, y, 2.2, '$firefly')], { a: 'fly', du: 5 + rand() * 5, dl: rand() * 6, v: { dx: (rand() - 0.5) * 120, dy: (rand() - 0.5) * 60 }, box: [x - 60, y - 30, 120, 60] }));
  }
  const pollen = [];
  for (let i = 0; i < 26; i++) {
    pollen.push(C(200 + rand() * 1250, 600 + rand() * 280, 1.2 + rand() * 1.4, '$pollen', { a: 'pollen', du: 12 + rand() * 12, dl: rand() * 14, v: { dx: (rand() - 0.3) * 70, dy: -(60 + rand() * 60) } }));
  }
  return layer('fx', 4, [G(flies, { o: '$oFly' }), G(pollen, { o: '$oPollen' })]);
}

export function buildScene() {
  const rg = riverGeometry();
  const rid = ridges();
  const c = buildCamp();
  const t = trees();
  const layers = [
    sky(),
    orbs(),
    rays(),
    milkyWay(),
    stars(),
    shoot(),
    clouds('clouds1', 0.2, [[1010, 302, 320, 66], [1490, 232, 280, 56], [300, 62, 260, 50], [1740, 110, 300, 58]], 3, 170, 120),
    clouds('clouds2', 0.4, [[780, 52, 400, 70], [1300, 124, 400, 84], [20, 256, 300, 60]], 5, 120, -90),
    birds(),
    ...rid.slice(0, 3).map((r) => r.layer),
    mist(),
    ...rid.slice(3).map((r) => r.layer),
    meadow(),
    river(rg),
    bank(rg, c.shadows),
    t.mid,
    layer('camp', 3, c.camp),
    ...fireLayers(c.pit, c.domeGlows, [c.domeA.glow, c.domeB.glow]),
    ...t.sides,
    fx(),
    fore(),
  ];
  const lite = ['sky', 'orbs', 'rays', 'mw', 'stars', 'shoot', 'clouds1', 'clouds2', 'birds', 'r1', 'r2', 'r3', 'mist', 'r4', 'r5'];
  return { view: VIEW, layers, lite, crest: rid[0].crest };
}
