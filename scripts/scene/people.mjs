/**
 * Flat-vector people. Every figure is a handful of merged strokes and fills in the scene's own colour tokens, so one
 * figure costs about 1 KB and re-lights with the theme (`$cl*`, `$skin*`, `$hair*`, `$pant*` are graded per theme).
 *
 * Coordinates are absolute scene units with the feet at (x, y); body proportions are fractions of the height `h`.
 */
import { P, S, C } from './nodes.mjs';
import { num, circlePath } from './geom.mjs';

const BODY = {
  adult: { headR: 0.074, headY: -0.925, shY: -0.8, shHalf: 0.125, hipY: -0.5, hipHalf: 0.1, legW: 0.085, legX: 0.052, armW: 0.064, up: 0.17, fore: 0.165 },
  kid: { headR: 0.108, headY: -0.885, shY: -0.745, shHalf: 0.14, hipY: -0.46, hipHalf: 0.12, legW: 0.1, legX: 0.062, armW: 0.08, up: 0.19, fore: 0.18 },
};

/** Two-bone arm: returns the elbow for a shoulder and a hand, bending down and outwards like a relaxed arm. */
function elbow(s, t, l1, l2, side) {
  let [dx, dy] = [t[0] - s[0], t[1] - s[1]];
  let d = Math.hypot(dx, dy) || 1;
  const reach = l1 + l2 - 0.6;
  if (d > reach) {
    t = [s[0] + (dx * reach) / d, s[1] + (dy * reach) / d];
    dx = t[0] - s[0];
    dy = t[1] - s[1];
    d = reach;
  }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d;
  const uy = dy / d;
  const e1 = [s[0] + ux * a - uy * hh, s[1] + uy * a + ux * hh];
  const e2 = [s[0] + ux * a + uy * hh, s[1] + uy * a - ux * hh];
  const score = (e) => e[1] * 0.6 + side * e[0] * 0.8;
  return { e: score(e1) >= score(e2) ? e1 : e2, t };
}

/** Hair cap, fringe and extras around a head centred at (cx, cy) with radius r. */
function hairNodes({ cx, cy, r, face, style, hair, hat, k }) {
  const R = r * 1.07;
  const px = (a, b) => `${num(cx + a)},${num(cy + b)}`;
  const out = [];
  const cap = (fringe) =>
    `M${px(-0.985 * R, 0.174 * R)}A${num(R)},${num(R)} 0 1 1 ${px(0.985 * R, 0.174 * R)}Q${px(face * fringe * R, -0.774 * R)} ${px(-0.985 * R, 0.174 * R)}Z`;
  if (hat) {
    const rr = R * 1.08;
    out.push(P(`M${px(-rr, -0.05 * R)}A${num(rr)},${num(rr)} 0 0 1 ${px(rr, -0.05 * R)}Z`, hat));
    out.push(S(`M${px(face * 0.2 * R, -0.12 * R)}L${px(face * 1.75 * R, 0.02 * R)}`, hat, 0.3 * R));
    return { back: [], front: out };
  }
  if (style === 'bald') return { back: [], front: [] };
  const back = [];
  if (style === 'long') back.push(P(`M${px(-1.08 * R, -0.1 * R)}L${px(-1.3 * R, 1.9 * R)}Q${px(0, 2.4 * R)} ${px(1.3 * R, 1.9 * R)}L${px(1.08 * R, -0.1 * R)}Z`, hair));
  if (style === 'pony') back.push(S(`M${px(-face * 0.8 * R, -0.25 * R)}Q${px(-face * 2.1 * R, 0.2 * R)} ${px(-face * 1.6 * R, 1.6 * R)}`, hair, 0.6 * R));
  if (style === 'bun') back.push(C(cx - face * 0.45 * R, cy - 1.0 * R, 0.46 * R, hair));
  if (style === 'curly') {
    for (const [a, b, s] of [[-0.8, -0.55, 0.5], [0, -1.02, 0.55], [0.8, -0.55, 0.5], [-1.0, 0.1, 0.4], [1.0, 0.1, 0.4]]) back.push(C(cx + a * R, cy + b * R, s * R, hair));
  }
  out.push(P(cap(style === 'curly' ? 0.1 : 0.34), hair));
  return { back, front: out };
}

export const glassAt = (x, y, h, fill = '$glass') => {
  const s = h * 0.024;
  return P(`M${num(x - 1.1 * s)},${num(y - 4.4 * s)}L${num(x + 1.1 * s)},${num(y - 4.4 * s)}L${num(x + 0.7 * s)},${num(y - 0.6 * s)}L${num(x - 0.7 * s)},${num(y - 0.6 * s)}Z`, fill, { o: 0.9 });
};

/**
 * A front-facing person. `hands` gives optional absolute targets { L: [x, y], R: [x, y] } (screen left / right arm);
 * `drop` shifts the body down (seated behind a table); `legs:false` skips the legs (hidden by a table cloth).
 */
export function figure(o) {
  const {
    x, y, h, kid = false, dress = false, legs = true, drop = 0, skin = '$skin1', hair = '$hair1', top = '$cl1', bottom = '$pant1',
    face = 1, style = 'short', hands = {}, hat = null, glass = null,
  } = o;
  const b = BODY[kid ? 'kid' : 'adult'];
  const X = (lx) => x + lx * h;
  const Y = (ly) => y + (ly + drop) * h;
  const pt = (lx, ly) => `${num(X(lx))},${num(Y(ly))}`;
  const back = [];
  const body = [];
  const front = [];
  const hair_ = hairNodes({ cx: X(0), cy: Y(b.headY), r: b.headR * h, face, style, hair, hat });
  back.push(...hair_.back);

  if (legs) {
    const hem = kid ? -0.27 : -0.33;
    const legTop = dress ? hem : b.hipY + 0.02;
    const lx = b.legX;
    const lines = [-1, 1].map((s) => `M${pt(s * lx, legTop)}L${pt(s * (lx + 0.012), -0.02)}`).join('');
    body.push(S(lines, dress ? skin : bottom, num(b.legW * h * (dress ? 0.82 : 1))));
    const feet = [-1, 1].map((s) => `M${pt(s * (lx + 0.012), -0.02)}L${pt(s * (lx + 0.012) + face * 0.07, -0.02)}`).join('');
    body.push(S(feet, '$shoe', num(0.05 * h)));
  }

  const sh = b.shHalf;
  const shY = b.shY;
  let torso = `M${pt(-sh, shY + 0.025)}Q${pt(-sh, shY - 0.012)} ${pt(-sh + 0.035, shY - 0.014)}L${pt(sh - 0.035, shY - 0.014)}Q${pt(sh, shY - 0.012)} ${pt(sh, shY + 0.025)}`;
  if (dress) {
    const hem = kid ? -0.27 : -0.33;
    const flare = kid ? 0.19 : 0.185;
    torso += `L${pt(b.hipHalf * 0.9, b.hipY + 0.02)}L${pt(flare, hem)}Q${pt(0, hem + 0.035)} ${pt(-flare, hem)}L${pt(-b.hipHalf * 0.9, b.hipY + 0.02)}Z`;
  } else {
    torso += `L${pt(b.hipHalf, b.hipY)}Q${pt(0, b.hipY + 0.03)} ${pt(-b.hipHalf, b.hipY)}Z`;
  }
  body.push(S(`M${pt(0, shY - 0.01)}L${pt(0, b.headY + b.headR * 0.7)}`, skin, num(0.052 * h)));
  body.push(P(torso, top));

  const upper = [];
  const fore = [];
  const handDots = [];
  for (const side of [-1, 1]) {
    const s = [X(side * sh * 0.8), Y(shY + 0.03)];
    const rest = [X(side * (sh + 0.035)), Y(-0.5)];
    const given = hands[side < 0 ? 'L' : 'R'];
    const target = given ? [given[0], given[1]] : rest;
    const { e, t } = elbow(s, target, b.up * h, b.fore * h, side);
    upper.push(`M${num(s[0])},${num(s[1])}L${num(e[0])},${num(e[1])}`);
    fore.push(`M${num(e[0])},${num(e[1])}L${num(t[0])},${num(t[1])}`);
    handDots.push(circlePath(t[0], t[1], b.armW * h * 0.55));
    if (glass && glass === (side < 0 ? 'L' : 'R')) front.push(glassAt(t[0], t[1], h));
  }
  front.unshift(S(upper.join(''), top, num(b.armW * h)), S(fore.join(''), skin, num(b.armW * h * 0.9)), P(handDots.join(''), skin));
  front.push(C(X(0), Y(b.headY), b.headR * h, skin), ...hair_.front);

  return { nodes: [...back, ...body, ...front], height: h };
}

/** Side view of someone sitting on a log, holding a mug. `face` is the direction they look at (towards the fire). */
export function sitSide(o) {
  const { x, y, h, face = 1, skin = '$skin1', hair = '$hair1', top = '$cl1', bottom = '$pant1', style = 'short', mug = '$cl2' } = o;
  const X = (lx) => x + face * lx * h;
  const Y = (ly) => y + ly * h;
  const pt = (lx, ly) => `${num(X(lx))},${num(Y(ly))}`;
  const nodes = [];
  const headY = -0.69;
  const hairN = hairNodes({ cx: X(0.03), cy: Y(headY), r: 0.074 * h, face, style, hair, hat: null });
  nodes.push(...hairN.back);
  nodes.push(S(`M${pt(0, -0.27)}L${pt(0.24, -0.29)}L${pt(0.265, -0.03)}`, bottom, num(0.085 * h)));
  nodes.push(S(`M${pt(0.265, -0.022)}L${pt(0.34, -0.022)}`, '$shoe', num(0.05 * h)));
  nodes.push(P(`M${pt(-0.085, -0.26)}L${pt(-0.098, -0.54)}Q${pt(-0.09, -0.588)} ${pt(0, -0.588)}Q${pt(0.1, -0.588)} ${pt(0.095, -0.54)}L${pt(0.105, -0.26)}Z`, top));
  nodes.push(S(`M${pt(0.02, -0.585)}L${pt(0.03, headY + 0.05)}`, skin, num(0.052 * h)));
  const s = [X(0.01), Y(-0.55)];
  const target = [X(0.2), Y(-0.43)];
  const { e, t } = elbow(s, target, 0.17 * h, 0.165 * h, face);
  nodes.push(S(`M${num(s[0])},${num(s[1])}L${num(e[0])},${num(e[1])}`, top, num(0.064 * h)));
  nodes.push(S(`M${num(e[0])},${num(e[1])}L${num(t[0])},${num(t[1])}`, skin, num(0.058 * h)));
  nodes.push(P(`M${num(t[0] - 0.026 * h)},${num(t[1] - 0.05 * h)}h${num(0.052 * h)}v${num(0.06 * h)}h${num(-0.052 * h)}Z`, mug));
  nodes.push(C(X(0.03), Y(headY), 0.074 * h, skin), ...hairN.front);
  return { nodes, height: h };
}

/** Long shadow quad cast away from the sun (golden-hour sun at sx), stretched towards the viewer. */
export function shadowOf(x, y, w, len, sx = 1220, head = true) {
  const dx = Math.max(-1, Math.min(1, (x - sx) / 520)) * 0.95;
  const vx = dx * len;
  const vy = 0.5 * len;
  const hw = w / 2;
  const quad = `M${num(x - hw)},${num(y)}L${num(x + hw)},${num(y)}L${num(x + hw * 0.55 + vx)},${num(y + vy)}L${num(x - hw * 0.55 + vx)},${num(y + vy)}Z`;
  return head ? `${quad}${circlePath(x + vx, y + vy, hw * 0.62)}` : quad;
}
