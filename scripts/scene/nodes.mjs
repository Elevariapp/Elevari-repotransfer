/**
 * Scene node constructors. A node is plain JSON that three renderers understand (inline SVG on the web, react-native-svg,
 * and the flat composer used for email banners and previews):
 *
 *   p path        { t:'p', d, f, s, sw }              f / s: '$token' | '#hex' | '@gradient' | 'none'; strokes are always round
 *   c circle      { t:'c', cx, cy, r, f }
 *   g group       { t:'g', n:[...], tx }              tx: static transform
 *
 * Shared options: o (opacity number or '$token'), ok (multiplier for a token opacity), a (named animation),
 * dl / du (delay / duration in seconds), v (animation variables), box ([x, y, w, h] used by native renderers).
 */
export const P = (d, f, x = {}) => ({ t: 'p', d, f, ...x });
export const S = (d, s, sw, x = {}) => ({ t: 'p', d, f: 'none', s, sw, ...x });
export const C = (cx, cy, r, f, x = {}) => ({ t: 'c', cx, cy, r, f, ...x });
export const G = (n, x = {}) => ({ t: 'g', n: n.filter(Boolean), ...x });

/** Gradient definitions are scoped to a layer; nodes reference them as '@id'. Stops: [offset, '$token'|'#hex', alpha]. */
export const lin = (id, x1, y1, x2, y2, stops) => ({ id, k: 'l', x1, y1, x2, y2, stops });
export const rad = (id, cx, cy, r, stops, gt) => ({ id, k: 'r', cx, cy, r, stops, ...(gt ? { gt } : {}) });

export const layer = (id, depth, nodes, x = {}) => ({ id, depth, nodes: nodes.filter(Boolean), ...x });

/** Walks every node (depth first). */
export function walk(nodes, fn) {
  for (const n of nodes) {
    fn(n);
    if (n.t === 'g') walk(n.n, fn);
  }
}
