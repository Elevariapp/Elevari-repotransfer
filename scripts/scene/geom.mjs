/**
 * Dependency-free geometry helpers for the Elevari scene generator: a seeded PRNG, value noise, path builders
 * and a few small organic shapes. Everything is deterministic, so `generate-scene.mjs --check` can prove the
 * committed output still matches the generator.
 */
export const VIEW = { w: 1600, h: 900 };

export const round = (n, p = 1) => {
  const m = 10 ** p;
  return Math.round(n * m) / m;
};
export const num = (n, p = 1) => String(round(n, p));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoise(rand, size = 256) {
  const lattice = Array.from({ length: size }, () => rand());
  const at = (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = lattice[((i % size) + size) % size];
    const b = lattice[(((i + 1) % size) + size) % size];
    return a + (b - a) * smooth(f);
  };
  const fbm = (x, octaves) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += at(x * freq + o * 17.3) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  };
  // Squaring the creased value sharpens summits and keeps valleys soft.
  const ridged = (x, octaves) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      const r = 1 - Math.abs(2 * at(x * freq + o * 31.7) - 1);
      sum += r * r * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2.13;
    }
    return sum / norm;
  };
  return { at, fbm, ridged };
}

/** Piecewise smooth curve through [x, y] anchors. */
export function envelope(points) {
  return (x) => {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      if (x <= x1) return y0 + (y1 - y0) * smooth((x - x0) / (x1 - x0));
    }
    return points[points.length - 1][1];
  };
}

export const polyline = (pts, prec = 0) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${num(x, prec)},${num(y, prec)}`).join('');

/** Catmull-Rom spline as cubic Beziers: smooth shapes without hand-placed control points. */
export function splinePath(pts, { close = false, tension = 6 } = {}) {
  const n = pts.length;
  const at = (i) => (close ? pts[((i % n) + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${num(pts[0][0])},${num(pts[0][1])}`;
  const segs = close ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / tension, p1[1] + (p2[1] - p0[1]) / tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / tension, p2[1] - (p3[1] - p1[1]) / tension];
    d += `C${num(c1[0])},${num(c1[1])} ${num(c2[0])},${num(c2[1])} ${num(p2[0])},${num(p2[1])}`;
  }
  return close ? `${d}Z` : d;
}

/** Circle as a path, so many dots can share one element. */
export const circlePath = (cx, cy, r) =>
  `M${num(cx - r)},${num(cy)}a${num(r)},${num(r)} 0 1,0 ${num(r * 2)},0a${num(r)},${num(r)} 0 1,0 ${num(-r * 2)},0Z`;

/** Four-point sparkle (stars, glints). */
export const sparklePath = (cx, cy, r, pinch = 0.2) => {
  const k = r * pinch;
  return `M${num(cx)},${num(cy - r)}Q${num(cx + k)},${num(cy - k)} ${num(cx + r)},${num(cy)}Q${num(cx + k)},${num(cy + k)} ${num(cx)},${num(cy + r)}Q${num(cx - k)},${num(cy + k)} ${num(cx - r)},${num(cy)}Q${num(cx - k)},${num(cy - k)} ${num(cx)},${num(cy - r)}Z`;
};

/** Rounded rectangle path. */
export const roundRect = (x, y, w, h, r) => {
  const k = Math.min(r, w / 2, h / 2);
  return `M${num(x + k)},${num(y)}h${num(w - 2 * k)}a${num(k)},${num(k)} 0 0,1 ${num(k)},${num(k)}v${num(h - 2 * k)}a${num(k)},${num(k)} 0 0,1 ${num(-k)},${num(k)}h${num(-(w - 2 * k))}a${num(k)},${num(k)} 0 0,1 ${num(-k)},${num(-k)}v${num(-(h - 2 * k))}a${num(k)},${num(k)} 0 0,1 ${num(k)},${num(-k)}Z`;
};

/** Applies a scale/flip/translate to local coordinates. */
export function placer({ x = 0, y = 0, s = 1, flip = false }) {
  return ([px, py]) => [x + (flip ? -px : px) * s, y + py * s];
}

/** Ridge crest sampled over the scene width; returns the crest points and a closed path. */
export function buildRidge({ seed, step, env, amp, freq, octaves, ridged, spline = false, floor = 1000, offset = 0.3 }) {
  const noise = makeNoise(mulberry32(seed));
  const base = envelope(env);
  const pts = [];
  // Overshoot both edges so a ridge never leaves a gap when the scene is cropped or the parallax shifts it.
  for (let x = -step * 2; x <= VIEW.w + step * 2 + 0.001; x += step) {
    const n = ridged ? noise.ridged(x * freq, octaves) - offset : noise.fbm(x * freq, octaves) - 0.5;
    pts.push([x, base(x) - amp * n]);
  }
  const crest = spline ? splinePath(pts) : polyline(pts);
  return { pts, crest, d: `${crest}L${pts[pts.length - 1][0]},${floor}L${pts[0][0]},${floor}Z`, top: round(Math.min(...pts.map((p) => p[1])), 0) };
}

/**
 * Faceted light/shade planes for a ridge: every local summit gets a lit triangle on its right flank (the sun side) and a
 * shaded one on its left flank. It reads as low-poly depth without any extra assets.
 */
export function ridgeFacets(pts, { minRise = 14, depth = 0.42 } = {}) {
  const lit = [];
  const shade = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    if (!(y <= pts[i - 1][1] && y < pts[i + 1][1])) continue;
    let r = i;
    while (r < pts.length - 1 && pts[r + 1][1] >= pts[r][1]) r++;
    let l = i;
    while (l > 0 && pts[l - 1][1] >= pts[l][1]) l--;
    const rise = Math.min(pts[r][1] - y, pts[l][1] - y);
    if (rise < minRise) continue;
    const rr = pts[r];
    const ll = pts[l];
    const inner = [x + (rr[0] - x) * 0.18, y + (rr[1] - y) * 1.05 + rise * depth];
    lit.push(`${polyline([[x, y], ...pts.slice(i + 1, r + 1), inner])}Z`);
    const innerL = [x - (x - ll[0]) * 0.2, y + (ll[1] - y) * 1.05 + rise * depth];
    shade.push(`${polyline([[x, y], ...pts.slice(l, i).reverse(), innerL])}Z`);
  }
  return { lit: lit.join(''), shade: shade.join('') };
}

/** Samples a centre-line spline with per-point widths into a closed ribbon (river, path). */
export function ribbon(points, { samples = 60 } = {}) {
  const pts = points.map(([x, y]) => [x, y]);
  const widths = points.map((p) => p[2]);
  const at = (arr, t) => {
    const f = clamp(t, 0, 1) * (arr.length - 1);
    const i = Math.min(arr.length - 2, Math.floor(f));
    const u = f - i;
    const get = (k) => arr[clamp(k, 0, arr.length - 1)];
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const cr = (a, b, c, d, u) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    if (Array.isArray(p1)) return [cr(p0[0], p1[0], p2[0], p3[0], u), cr(p0[1], p1[1], p2[1], p3[1], u)];
    return cr(p0, p1, p2, p3, u);
  };
  const left = [];
  const right = [];
  const centre = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const [x, y] = at(pts, t);
    const [x2, y2] = at(pts, Math.min(1, t + 0.01));
    const [x1, y1] = at(pts, Math.max(0, t - 0.01));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const w = at(widths, t);
    // Rivers read as flatter than they are long: squash the normal so the banks follow the ground plane.
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w * 0.34;
    left.push([x + nx, y + ny]);
    right.push([x - nx, y - ny]);
    centre.push([x, y, w]);
  }
  return { left, right, centre };
}

/** One fir: stacked skirts with notches, a thin trunk and asymmetric left/right jitter. */
export function fir(rand, cx, baseY, h, halfW, mirror = (x) => x) {
  const tiers = 5 + Math.floor(rand() * 3);
  const trunkHalf = Math.max(1.5, halfW * 0.07);
  const bodyH = h * 0.94;
  const apexY = baseY - h;
  const half = () => {
    const out = [];
    for (let i = 0; i < tiers; i++) {
      const t = (i + 1) / tiers;
      const tipY = apexY + bodyH * Math.pow(t, 0.96);
      const tipW = halfW * (0.2 + 0.8 * Math.pow(t, 1.05)) * (0.88 + rand() * 0.24);
      out.push([tipW, tipY]);
      if (i < tiers - 1) out.push([tipW * (0.42 + rand() * 0.1), tipY - (bodyH / tiers) * (0.16 + rand() * 0.08)]);
    }
    out.push([trunkHalf, apexY + bodyH], [trunkHalf, baseY]);
    return out;
  };
  const right = half().map(([w, y]) => [mirror(cx + w), y]);
  const left = half()
    .map(([w, y]) => [mirror(cx - w), y])
    .reverse();
  return `${polyline([[mirror(cx), apexY], ...right, ...left])}Z`;
}

/** Lumpy canopy blob: a closed spline through jittered points of an ellipse. */
export function blob(rand, cx, cy, rx, ry, { lumps = 9, jitter = 0.16 } = {}) {
  const pts = [];
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    const k = 1 + (rand() - 0.5) * 2 * jitter;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return splinePath(pts, { close: true });
}

/** Puffy cumulus: a flat base with overlapping domes on top. */
export function cumulus(rand, cx, cy, w, h) {
  // Scalloped top built from arcs whose knots follow a bell, so the cloud swells in the middle and tapers at the ends.
  const n = 5 + Math.floor(rand() * 3);
  const cuts = [0];
  let total = 0;
  const parts = Array.from({ length: n }, () => {
    const v = 0.6 + rand() * 0.9;
    total += v;
    return v;
  });
  let acc = 0;
  for (const v of parts) {
    acc += v / total;
    cuts.push(acc);
  }
  const x0 = cx - w / 2;
  const knot = (t) => [x0 + t * w, cy - h * (0.12 + 0.46 * Math.sin(t * Math.PI) ** 0.8) * (0.85 + rand() * 0.3)];
  let d = `M${num(x0)},${num(cy)}`;
  let prev = [x0, cy];
  for (let i = 1; i <= n; i++) {
    const to = i === n ? [x0 + w, cy] : knot(cuts[i]);
    const chord = Math.hypot(to[0] - prev[0], to[1] - prev[1]);
    const r = chord * (0.56 + rand() * 0.18);
    d += `A${num(r)},${num(r)} 0 0 1 ${num(to[0])},${num(to[1])}`;
    prev = to;
  }
  return `${d}Q${num(cx)},${num(cy + h * 0.14)} ${num(x0)},${num(cy)}Z`;
}
export function lens(cx, cy, w, h) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  return `M${num(x0)},${num(cy)}Q${num(cx)},${num(cy - h)} ${num(x1)},${num(cy)}Q${num(cx)},${num(cy + h * 0.55)} ${num(x0)},${num(cy)}Z`;
}

/** Tufts of grass blades along a baseline: thin curved triangles, merged into one path. */
export function grass(rand, x0, x1, baseY, { count, hMin, hMax, spread = 7, lean = 0.5 }) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + ((i + rand() * 0.8) / count) * (x1 - x0);
    const blades = 3 + Math.floor(rand() * 4);
    for (let b = 0; b < blades; b++) {
      const bx = x + (b - blades / 2) * (spread * 0.4) + (rand() - 0.5) * 3;
      const h = hMin + rand() * (hMax - hMin);
      const tilt = (rand() - 0.5 + lean * (rand() - 0.5)) * h * 0.55;
      const w = 1.8 + rand() * 1.8;
      d += `M${num(bx - w, 0)},${num(baseY, 0)}Q${num(bx - w * 0.2 + tilt * 0.35, 0)},${num(baseY - h * 0.55, 0)} ${num(bx + tilt, 0)},${num(baseY - h, 0)}Q${num(bx + w * 0.6 + tilt * 0.4, 0)},${num(baseY - h * 0.5, 0)} ${num(bx + w, 0)},${num(baseY, 0)}Z`;
    }
  }
  return d;
}
