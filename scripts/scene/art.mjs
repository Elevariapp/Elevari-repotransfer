/**
 * Procedural vector art for the Elevari scene (viewBox 1600x900). Dependency-free and fully seeded,
 * so `generate-scene.mjs --check` can prove the committed output still matches the generator.
 */
export const VIEW = { w: 1600, h: 900 };
export const PINES_VIEW = { w: 560, h: 900 };
// Horizon anchors shared by every renderer. The sun sits half-set behind the far ridge saddle.
export const SUN = { x: 800, y: 548, r: 92 };
export const MOON = { x: 800, y: 236, r: 50 };
export const SHORE = 758;

const round = (n, p = 1) => {
  const m = 10 ** p;
  return Math.round(n * m) / m;
};
const num = (n, p = 1) => String(round(n, p));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

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

function makeNoise(rand, size = 256) {
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

function envelope(points) {
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

const polyline = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${num(x)},${num(y)}`).join('');

// Catmull-Rom spline as cubic Beziers: smooth hills without hand-placed control points.
function splinePath(pts) {
  let d = `M${num(pts[0][0])},${num(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${num(c1[0])},${num(c1[1])} ${num(c2[0])},${num(c2[1])} ${num(p2[0])},${num(p2[1])}`;
  }
  return d;
}

function buildRidge({ seed, step, env, amp, freq, octaves, ridged, spline }) {
  const noise = makeNoise(mulberry32(seed));
  const base = envelope(env);
  const pts = [];
  for (let x = 0; x <= VIEW.w + 0.001; x += step) {
    const n = ridged ? noise.ridged(x * freq, octaves) - 0.3 : noise.fbm(x * freq, octaves) - 0.5;
    pts.push([x, base(x) - amp * n]);
  }
  const crest = spline ? splinePath(pts) : polyline(pts);
  const floor = 1000;
  const closed = `${crest}L${VIEW.w},${floor}L0,${floor}Z`;
  return {
    d: closed,
    crest,
    top: round(Math.min(...pts.map((p) => p[1])), 0),
    // Mirrored crest, used for the water reflection of the nearest ridge.
    pts,
  };
}

// One fir: stacked skirts with notches, a thin trunk and asymmetric left/right jitter.
function fir(rand, cx, baseY, h, halfW, mirror) {
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

function pineCluster(seed, flip, withCabin) {
  const rand = mulberry32(seed);
  const mirror = (x) => (flip ? PINES_VIEW.w - x : x);
  const back = [];
  const front = [];
  for (let i = 0; i < 10; i++) {
    const u = (i + rand() * 0.8) / 10;
    const h = (400 - 230 * Math.pow(u, 0.85)) * (0.82 + rand() * 0.36);
    back.push(fir(rand, -20 + u * 520, 892, h, h * (0.2 + rand() * 0.04), mirror));
  }
  for (let i = 0; i < 5; i++) {
    const u = (i + rand() * 0.7) / 5.6;
    const h = (600 - 370 * Math.pow(u, 0.8)) * (0.86 + rand() * 0.28);
    front.push(fir(rand, 0 + u * 400, 912, h, h * (0.19 + rand() * 0.04), mirror));
  }
  const bankY = [
    [-60, 826],
    [60, 808],
    [170, 814],
    [270, 836],
    [370, 860],
    [470, 884],
    [600, 902],
  ].map(([x, y]) => [mirror(x), y]);
  const bank = `${splinePath(bankY)}L${num(mirror(600))},910L${num(mirror(-60))},910Z`;
  const cabin = withCabin
    ? (() => {
        const x = 350;
        const base = 866;
        return {
          body: `M${num(mirror(x - 26))},${base}L${num(mirror(x))},${base - 44}L${num(mirror(x + 26))},${base}Z`,
          win: [round(mirror(x) - 5.5, 1), base - 21, 11, 13],
          glow: [round(mirror(x), 1), base - 15, 34],
        };
      })()
    : null;
  return { back: back.join(''), front: front.join(''), bank, cabin };
}

function buildStars(seed, count) {
  const rand = mulberry32(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * VIEW.w;
    const y = Math.pow(rand(), 1.5) * 560;
    const r = 0.55 + rand() * rand() * 1.5;
    out.push([round(x, 0), round(y, 0), round(r, 2), Math.floor(rand() * 3), round(0.4 + rand() * 0.6, 2)]);
  }
  return out;
}

// Thin lens-shaped strata: reads as painted vector cloud streaks and costs a few bytes each.
function lens(cx, cy, w, h) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  return `M${num(x0)},${num(cy)}Q${num(cx)},${num(cy - h)} ${num(x1)},${num(cy)}Q${num(cx)},${num(cy + h * 0.55)} ${num(x0)},${num(cy)}Z`;
}

function buildClouds(seed) {
  const rand = mulberry32(seed);
  const clusters = [];
  const make = (layer, n, yMin, yMax, wMin, wMax, hMin, hMax, o) => {
    for (let i = 0; i < n; i++) {
      const cx = 140 + (i + rand() * 0.7) * ((VIEW.w - 280) / n);
      const cy = yMin + rand() * (yMax - yMin);
      const parts = 3 + Math.floor(rand() * 3);
      let d = '';
      for (let k = 0; k < parts; k++) {
        const w = (wMin + rand() * (wMax - wMin)) * (1 - k * 0.14);
        d += lens(cx + (rand() - 0.5) * 120, cy + k * (hMin + 6), w, hMin + rand() * (hMax - hMin));
      }
      clusters.push({ layer, o: round(o * (0.7 + rand() * 0.3), 2), d });
    }
  };
  make(0, 5, 110, 330, 220, 520, 7, 15, 0.9);
  make(1, 4, 400, 500, 320, 700, 9, 20, 1);
  return clusters;
}

function buildLake(seed) {
  const rand = mulberry32(seed);
  const shore = [];
  for (let x = 0; x <= VIEW.w; x += 40) {
    shore.push([x, SHORE + Math.sin(x / 90) * 4 + Math.sin(x / 37 + 1) * 2.5]);
  }
  const d = `${polyline(shore)}L${VIEW.w},${VIEW.h + 10}L0,${VIEW.h + 10}Z`;
  const glints = [];
  const n = 20;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const y = SHORE + 12 + (VIEW.h - 18 - SHORE - 12) * Math.pow(t, 1.15);
    const w = (16 + 230 * Math.pow(t, 0.9)) * (0.6 + rand() * 0.8);
    const h = 1.6 + 3.4 * t;
    glints.push([round(SUN.x + (rand() - 0.5) * (14 + 70 * t), 0), round(y, 0), round(w, 0), round(h, 1)]);
  }
  const ripples = [];
  for (let k = 0; k < 26; k++) {
    const t = rand();
    const y = SHORE + 10 + t * (VIEW.h - 20 - SHORE);
    ripples.push([round(60 + rand() * (VIEW.w - 120), 0), round(y, 0), round(26 + 160 * t * (0.5 + rand() * 0.5), 0), round(0.1 + rand() * 0.22, 2)]);
  }
  return { d, shore, glints, ripples };
}

// Soft god-rays fanning out of the sun: thin wedges that a radial gradient fades with distance.
function buildRays(seed) {
  const rand = mulberry32(seed);
  const n = 11;
  const reach = 1700;
  const rays = [];
  for (let i = 0; i < n; i++) {
    const a = 180 + (i + 0.5) * (180 / n) + (rand() - 0.5) * 8;
    const w = 2.4 + rand() * 4.2;
    const at = (deg) => [SUN.x + reach * Math.cos((deg * Math.PI) / 180), SUN.y + reach * Math.sin((deg * Math.PI) / 180)];
    const [x1, y1] = at(a - w / 2);
    const [x2, y2] = at(a + w / 2);
    rays.push({ d: `M${SUN.x},${SUN.y}L${num(x1, 0)},${num(y1, 0)}L${num(x2, 0)},${num(y2, 0)}Z`, o: round(0.35 + rand() * 0.65, 2) });
  }
  return rays;
}

export function buildScene() {
  const far = buildRidge({
    seed: 7,
    step: 16,
    ridged: true,
    freq: 1 / 80,
    octaves: 4,
    amp: 62,
    env: [[0, 500], [120, 448], [250, 404], [380, 452], [520, 424], [650, 500], [770, 552], [900, 562], [1100, 556], [1260, 540], [1380, 494], [1490, 468], [1600, 512]],
  });
  const mid = buildRidge({
    seed: 21,
    step: 20,
    ridged: true,
    freq: 1 / 110,
    octaves: 3,
    amp: 44,
    env: [[0, 610], [150, 566], [320, 606], [470, 640], [620, 612], [790, 652], [960, 642], [1130, 622], [1290, 586], [1450, 612], [1600, 580]],
  });
  const near = buildRidge({
    seed: 5,
    step: 32,
    ridged: false,
    spline: true,
    freq: 1 / 160,
    octaves: 3,
    amp: 26,
    env: [[0, 688], [200, 700], [420, 672], [640, 704], [860, 688], [1080, 712], [1300, 682], [1500, 702], [1600, 686]],
  });
  const lake = buildLake(33);
  // Reflection of the nearest ridge: crest mirrored about the shore, closed along the shoreline.
  const mirrored = near.pts.map(([x, y]) => [x, clamp(2 * SHORE - y, SHORE, VIEW.h + 40)]);
  const reflection = `${polyline(lake.shore.map(([x, y]) => [x, y]))}${mirrored
    .slice()
    .reverse()
    .map(([x, y]) => `L${num(x)},${num(y)}`)
    .join('')}Z`;

  return {
    view: VIEW,
    pinesView: PINES_VIEW,
    sun: SUN,
    moon: MOON,
    shore: SHORE,
    ridges: {
      far: { d: far.d, crest: far.crest, top: far.top },
      mid: { d: mid.d, crest: mid.crest, top: mid.top },
      near: { d: near.d, crest: near.crest, top: near.top },
    },
    lake: { d: lake.d, reflection, glints: lake.glints, ripples: lake.ripples },
    mist: [
      { cx: 520, cy: 640, rx: 760, ry: 62 },
      { cx: 1180, cy: 706, rx: 820, ry: 54 },
    ],
    pines: {
      left: pineCluster(101, false, true),
      right: pineCluster(202, true, false),
    },
    stars: buildStars(17, 150),
    clouds: buildClouds(9),
    rays: buildRays(3),
  };
}
