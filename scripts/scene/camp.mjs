/**
 * The camp: glamping domes with timber decks, string lights, a long table, the family, the fire and the trees.
 * Everything is authored in scene units (1600 x 900) with feet / base lines in absolute coordinates, so the layout
 * can be tuned by reading the numbers at the top of each builder.
 */
import { P, S, C, G, rad, lin } from './nodes.mjs';
import { num, mulberry32, circlePath, sparklePath, splinePath, fir, blob, roundRect } from './geom.mjs';
import { figure, sitSide, glassAt, shadowOf } from './people.mjs';

const ellipsePt = (cx, cy, rx, ry, a) => [cx + rx * Math.cos(a), cy - ry * Math.sin(a)];

/** A string of bulbs sagging between two posts; returns the wire, lit bulbs and soft halos as nodes. */
export function stringLights(x1, y1, x2, y2, sag, count, seed = 1) {
  const rand = mulberry32(seed);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 + sag * 2;
  const bulbs = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    bulbs.push([bx, by + 2.6]);
  }
  const dots = (r) => bulbs.map(([x, y]) => circlePath(x, y, r)).join('');
  const twinkle = bulbs.filter((_, i) => i % 3 === 1);
  return [
    S(`M${num(x1)},${num(y1)}Q${num(cx)},${num(cy)} ${num(x2)},${num(y2)}`, '$post', 1, { o: 0.75 }),
    P(dots(2.4), '$wood'),
    P(dots(8), '$bulbGlow', { o: '$oLights', ok: 0.2 }),
    P(dots(2.4), '$bulb', { o: '$oLights' }),
    twinkle.length ? P(twinkle.map(([x, y]) => circlePath(x, y, 5)).join(''), '$bulb', { o: '$oLights', ok: 0.45, a: 'bulb', dl: rand() * 2, du: 2.6 + rand() * 1.4 }) : null,
  ];
}

/**
 * A geodesic glamping dome on a timber deck. `x` is the centre, `base` the ground line where dome and deck meet and
 * `rx` the half-width. Returns { nodes, glow, shadow }: `glow` is the soft light spilling from the door.
 */
export function dome({ x, base, rx, flag = false, rail = 'both', id = 'd' }) {
  const ry = rx * 0.9;
  const pt = (a) => ellipsePt(x, base, rx, ry, a);
  const nodes = [];
  const body = `M${num(x - rx)},${num(base)}A${num(rx)},${num(ry)} 0 0 1 ${num(x + rx)},${num(base)}Z`;
  nodes.push(P(body, '$dome'));
  // Shade crescent on the side away from the sun.
  const [tx, ty] = pt(Math.PI * 0.56);
  nodes.push(P(`M${num(x - rx)},${num(base)}A${num(rx)},${num(ry)} 0 0 1 ${num(tx)},${num(ty)}Q${num(x - rx * 0.5)},${num(base - ry * 0.55)} ${num(x - rx * 0.34)},${num(base)}Z`, '$domeShade', { o: 0.75 }));
  // Seams: two latitudes and three meridians.
  let seams = '';
  for (const z of [0.36, 0.68]) {
    const w = rx * Math.sqrt(1 - z * z);
    seams += `M${num(x - w)},${num(base - ry * z)}Q${num(x)},${num(base - ry * z + 7)} ${num(x + w)},${num(base - ry * z)}`;
  }
  for (const k of [-0.62, -0.2, 0.34, 0.74]) {
    seams += `M${num(x + k * rx)},${num(base)}C${num(x + k * rx * 1.04)},${num(base - ry * 0.5)} ${num(x + k * rx * 0.52)},${num(base - ry * 0.92)} ${num(x + k * rx * 0.08)},${num(base - ry * 0.995)}`;
  }
  nodes.push(S(seams, '$domeLine', 1.25, { o: 0.8 }));
  // Terracotta band around the base, the brand accent.
  nodes.push(P(`M${num(x - rx)},${num(base)}h${num(rx * 2)}v${num(-5)}h${num(-rx * 2)}Z`, '$trim'));
  // Door (right of centre) and porthole (left) with warm light behind the glass.
  const dcx = x + rx * 0.3;
  const dw = rx * 0.17;
  const dh = ry * 0.52;
  const door = `M${num(dcx - dw)},${num(base)}V${num(base - dh + dw)}A${num(dw)},${num(dw)} 0 0 1 ${num(dcx + dw)},${num(base - dh + dw)}V${num(base)}Z`;
  const pcx = x - rx * 0.42;
  const pcy = base - ry * 0.34;
  const pr = rx * 0.11;
  nodes.push(P(door, '$glass'), P(circlePath(pcx, pcy, pr), '$glass'));
  nodes.push(P(door + circlePath(pcx, pcy, pr), '$glassLit', { o: '$oWindow' }));
  nodes.push(S(door, '$trim', 2.2), S(`M${num(dcx)},${num(base - dh + 2)}V${num(base)}`, '$trim', 1.2, { o: 0.8 }), S(circlePath(pcx, pcy, pr), '$trim', 2));
  const [ax, ay] = pt(Math.PI / 2);
  nodes.push(C(ax, ay, 3, '$domeLine'));
  if (flag) nodes.push(S(`M${num(ax)},${num(ay)}V${num(ay - 20)}`, '$post', 1.6), P(`M${num(ax)},${num(ay - 20)}l17,4.5l-17,4.5Z`, '$trim'));

  // Timber deck: top surface, front face, planks, posts and railing.
  const dx0 = x - rx * 1.2;
  const dx1 = x + rx * 1.2;
  const deck = [];
  deck.push(P(`M${num(dx0 + 8)},${num(base - 5)}L${num(dx1 - 8)},${num(base - 5)}L${num(dx1)},${num(base + 12)}L${num(dx0)},${num(base + 12)}Z`, '$deck'));
  deck.push(P(`M${num(dx0)},${num(base + 12)}L${num(dx1)},${num(base + 12)}V${num(base + 23)}H${num(dx0)}Z`, '$deckShade'));
  let planks = '';
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    planks += `M${num(dx0 + 8 + (dx1 - dx0 - 16) * t)},${num(base - 5)}L${num(dx0 + (dx1 - dx0) * t)},${num(base + 12)}`;
  }
  deck.push(S(planks, '$deckShade', 0.9, { o: 0.45 }));
  let posts = '';
  for (let i = 0; i <= 5; i++) posts += `M${num(dx0 + 6 + ((dx1 - dx0 - 12) * i) / 5)},${num(base + 23)}v18`;
  deck.push(S(posts, '$post', 4.2, { o: 0.8 }));
  const rails = [];
  if (rail === 'both' || rail === 'left') rails.push(dx0 + 5);
  if (rail === 'both' || rail === 'right') rails.push(dx1 - 5);
  for (const rx0 of rails) deck.push(S(`M${num(rx0)},${num(base + 11)}V${num(base - 30)}`, '$post', 3.4));
  nodes.push(...deck);
  const lightsA = [dx0 + 5, base - 30];
  const lightsB = [dx1 - 5, base - 30];
  const glow = rad(`dg-${id}`, dcx, base - dh * 0.4, rx * 1.05, [[0, '$glassLit', 0.55], [0.45, '$glassLit', 0.16], [1, '$glassLit', 0]]);
  return { nodes, glow, lightsA, lightsB, door: [dcx, base - dh * 0.4], shadow: { x, base, rx, ry } };
}

/** Long table with a cloth, a bench of people behind it raising their glasses, a lantern and a few dishes. */
export function gathering({ x, y, h }) {
  const w = 168;
  const top = y - 0.44 * h;
  const people = [
    { dx: -66, skin: '$skin2', hair: '$hair2', top: '$cl6', style: 'long', hands: { R: [x - 30, top - 0.5 * h] }, glass: 'R' },
    { dx: -33, skin: '$skin1', hair: '$hair1', top: '$cl5', style: 'short', hands: { R: [x - 4, top - 0.56 * h] }, glass: 'R', face: 1 },
    { dx: 0, skin: '$skin3', hair: '$hair4', top: '$cl4', style: 'bun', hands: { L: [x + 2, top - 0.6 * h] }, glass: 'L' },
    { dx: 33, skin: '$skin2', hair: '$hair2', top: '$cl3', style: 'curly', hands: { L: [x + 8, top - 0.56 * h], R: [x + 58, top - 0.22 * h] }, glass: 'L', face: -1 },
    { dx: 66, skin: '$skin1', hair: '$cl2', top: '$cl7', style: 'bun', hands: { L: [x + 46, top - 0.5 * h] }, glass: 'L', face: -1 },
  ];
  const nodes = [];
  for (const p of people) {
    const f = figure({ x: x + p.dx, y, h: h * (p.dx === 0 ? 1.02 : 1), legs: false, drop: 0.19, skin: p.skin, hair: p.hair, top: p.top, style: p.style, hands: p.hands, glass: p.glass, face: p.face ?? -1 });
    nodes.push(...f.nodes);
  }
  // Table top, cloth and what is on it.
  nodes.push(P(`M${num(x - w / 2 - 6)},${num(top - 6)}L${num(x + w / 2 + 6)},${num(top - 6)}L${num(x + w / 2)},${num(top)}L${num(x - w / 2)},${num(top)}Z`, '$cloth'));
  nodes.push(P(`M${num(x - w / 2)},${num(top)}H${num(x + w / 2)}V${num(y - 4)}Q${num(x + w / 4)},${num(y + 3)} ${num(x)},${num(y - 4)}Q${num(x - w / 4)},${num(y + 3)} ${num(x - w / 2)},${num(y - 4)}Z`, '$cloth'));
  let folds = '';
  for (let i = 1; i < 7; i++) folds += `M${num(x - w / 2 + (w * i) / 7)},${num(top + 2)}V${num(y - 5)}`;
  nodes.push(S(folds, '$clothShade', 1.6, { o: 0.7 }));
  nodes.push(P(`M${num(x - w / 2)},${num(top)}H${num(x + w / 2)}v3H${num(x - w / 2)}Z`, '$clothShade', { o: 0.8 }));
  nodes.push(P(`M${num(x - 52)},${num(top - 6)}l3,-14h5l3,14Z`, '$cl3'), P(circlePath(x - 49, top - 22, 2.4), '$cl3'));
  nodes.push(P(`M${num(x + 28)},${num(top - 6)}a10,5 0 0 1 20,0Z`, '$cl1'));
  nodes.push(P(`M${num(x - 6)},${num(top - 6)}h12v-12h-12Z`, '$wood'), P(`M${num(x - 4.5)},${num(top - 8)}h9v-8h-9Z`, '$glassLit', { o: '$oLights', ok: 1 }), P(circlePath(x, top - 12, 22), '$bulbGlow', { o: '$oLights', ok: 0.18 }));
  const glasses = [x - 90, x - 78, x + 78, x + 90];
  nodes.push(...glasses.map((gx) => glassAt(gx, top - 6, h * 0.75)));
  nodes.push(P(sparklePath(x + 2, top - 0.64 * h, 10, 0.16), '$glint', { a: 'glint', du: 2.4, dl: 0.4 }));
  return { nodes, w, top, shadowX: [x - 66, x - 33, x, x + 33, x + 66] };
}

/** Parents and kids in a row, holding hands, the smallest one pointing at the sky. */
export function family({ x, y, h }) {
  const dadH = h;
  const momH = h * 0.93;
  const girlH = h * 0.64;
  const boyH = h * 0.52;
  const dadX = x;
  const girlX = x + 40;
  const momX = x + 82;
  const boyX = x + 122;
  const handY = y - 0.4 * girlH - 4;
  const nodes = [];
  nodes.push(...figure({ x: dadX, y, h: dadH, skin: '$skin2', hair: '$hair1', top: '$cl5', bottom: '$pant1', hands: { R: [dadX + 20, handY - 6] } }).nodes);
  nodes.push(...figure({ x: girlX, y, h: girlH, kid: true, dress: true, skin: '$skin2', hair: '$hair3', top: '$cl4', style: 'pony', hands: { L: [dadX + 20, handY - 6], R: [momX - 20, handY - 2] } }).nodes);
  nodes.push(...figure({ x: momX, y, h: momH, dress: true, skin: '$skin1', hair: '$hair2', top: '$cl3', style: 'long', hands: { L: [momX - 20, handY - 2], R: [momX + 22, handY - 4] } }).nodes);
  nodes.push(...figure({ x: boyX, y, h: boyH, kid: true, skin: '$skin1', hair: '$hair1', top: '$cl7', bottom: '$pant2', hat: '$cl1', face: -1, hands: { L: [momX + 22, handY - 4], R: [boyX + 20, y - 1.12 * boyH] } }).nodes);
  return { nodes, shadowX: [[dadX, dadH], [girlX, girlH], [momX, momH], [boyX, boyH]] };
}

/** The fire pit: stones, logs, four layered flames, embers and the glow they throw. */
export function fire({ x, y }) {
  const rand = mulberry32(77);
  const back = [];
  const front = [];
  const stones = (arr, from, to) => {
    const n = 7;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = from + ((to - from) * (i + 0.5)) / n;
      d += circlePath(x + Math.cos(a) * 54, y + 2 + Math.sin(a) * 14, 7.5 + rand() * 2.5);
    }
    arr.push(P(d, '$stone'));
  };
  stones(back, Math.PI, Math.PI * 2);
  back.push(P(`M${num(x - 44)},${num(y + 1)}a44,11 0 1 1 88,0a44,11 0 1 1 -88,0Z`, '$log', { o: 0.9 }));
  back.push(S(`M${num(x - 40)},${num(y - 2)}L${num(x + 30)},${num(y - 15)}M${num(x + 40)},${num(y - 2)}L${num(x - 30)},${num(y - 15)}`, '$log', 13));
  back.push(P(circlePath(x + 30, y - 15, 6) + circlePath(x - 30, y - 15, 6), '$logEnd'));
  stones(front, 0, Math.PI);

  // Flames are authored around the origin (the fire's base) so `pos` can translate and scale them with `fireK`.
  const flame = (dx, dy, w, h, f, du, dl) =>
    P(
      `M${num(dx - w)},${num(dy)}C${num(dx - w * 1.1)},${num(dy - h * 0.35)} ${num(dx - w * 0.5)},${num(dy - h * 0.62)} ${num(dx - w * 0.1)},${num(dy - h)}C${num(dx + w * 0.05)},${num(dy - h * 0.7)} ${num(dx + w * 0.55)},${num(dy - h * 0.5)} ${num(dx + w * 0.85)},${num(dy - h * 0.28)}C${num(dx + w * 1.2)},${num(dy - h * 0.12)} ${num(dx + w * 0.7)},${num(dy + 2)} ${num(dx)},${num(dy + 2)}C${num(dx - w * 0.6)},${num(dy + 2)} ${num(dx - w)},${num(dy)} ${num(dx - w)},${num(dy)}Z`,
      f,
      { a: 'flame', du, dl, h: 'fire' },
    );
  const flames = [
    flame(0, -2, 30, 76, '$flame0', 1.5, 0),
    flame(-7, -2, 22, 58, '$flame1', 1.2, 0.3),
    flame(5, -2, 15, 40, '$flame2', 0.95, 0.15),
    flame(-1, -2, 8, 22, '$flame3', 0.8, 0.4),
  ];
  // Tongues dancing beside the main flame.
  const tongues = [
    P('M-24,-4Q-34,-30 -20,-44Q-16,-26 -10,-4Z', '$flame1', { a: 'flame', du: 1.1, dl: 0.2, h: 'fire' }),
    P('M22,-4Q36,-26 24,-40Q14,-24 8,-4Z', '$flame0', { a: 'flame', du: 1.3, dl: 0.5, h: 'fire' }),
  ];
  const embers = [];
  for (let i = 0; i < 12; i++) {
    const sx = x + (rand() - 0.5) * 30;
    embers.push(C(sx, y - 40, 1.2 + rand() * 1.6, '$ember', { a: 'ember', dl: rand() * 4, du: 2.8 + rand() * 2.4, v: { dx: (rand() - 0.5) * 46, dy: -(80 + rand() * 90) }, o: '$oFire', box: [sx - 3, y - 190, 6, 150] }));
  }
  const glow = [
    rad('fireGlowBig', 0, 0, 340, [[0, '$fireGlow', 0.62], [0.35, '$fireGlow', 0.26], [1, '$fireGlow', 0]], 'scale(1 .5)'),
    rad('fireGlowCore', 0, 0, 120, [[0, '$flame2', 0.8], [0.5, '$flame1', 0.28], [1, '$flame1', 0]], 'scale(1 .9)'),
  ];
  return {
    back,
    front,
    flames: G([...flames, ...tongues], { pos: [x, y, 'fireK'], o: '$oFire' }),
    embers,
    glow,
    glowNodes: [
      G([C(0, 0, 340, '@fireGlowBig')], { pos: [x, y - 26, 1], o: '$oFireGlow', a: 'flick', du: 3.1 }),
      G([C(0, 0, 120, '@fireGlowCore')], { pos: [x, y - 34, 'fireK'], o: '$oFire', ok: 0.9, a: 'flick', du: 1.7, dl: 0.4 }),
    ],
  };
}

/** A log bench with someone on it, facing the fire. */
export function fireside({ x, y, h, face, skin, hair, top, bottom, style }) {
  const nodes = [];
  nodes.push(P(`M${num(x - 36)},${num(y - 25)}h72a12,12 0 0 1 0,24h-72a12,12 0 0 1 0,-24Z`, '$log'));
  nodes.push(P(`M${num(x + face * 36)},${num(y - 25)}a6,12 0 1 1 0,24a6,12 0 1 1 0,-24Z`, '$logEnd'));
  nodes.push(...sitSide({ x, y: y - 25, h, face, skin, hair, top, bottom, style }).nodes);
  return nodes;
}

/** Broadleaf tree with a lumpy two-tone canopy; sways as one piece. */
export function broadleaf({ x, base, h, seed }) {
  const rand = mulberry32(seed);
  const cy = base - h * 0.72;
  const rx = h * 0.46;
  const ry = h * 0.4;
  return [
    P(`M${num(x - 6)},${num(base)}Q${num(x - 3)},${num(base - h * 0.4)} ${num(x - 9)},${num(cy + ry * 0.4)}L${num(x + 9)},${num(cy + ry * 0.4)}Q${num(x + 4)},${num(base - h * 0.4)} ${num(x + 7)},${num(base)}Z`, '$trunk'),
    P(blob(rand, x, cy, rx, ry, { lumps: 15, jitter: 0.1 }), '$leaf1'),
    P(blob(rand, x - rx * 0.2, cy - ry * 0.2, rx * 0.68, ry * 0.64, { lumps: 11, jitter: 0.12 }), '$leaf2', { o: 0.85 }),
    P(blob(rand, x - rx * 0.4, cy - ry * 0.42, rx * 0.3, ry * 0.26, { lumps: 8, jitter: 0.14 }), '$leaf2'),
    P(blob(rand, x + rx * 0.34, cy + ry * 0.2, rx * 0.34, ry * 0.3, { lumps: 8, jitter: 0.14 }), '$leaf1', { o: 0.7 }),
  ];
}

export { fir, splinePath, roundRect, lin, shadowOf };
