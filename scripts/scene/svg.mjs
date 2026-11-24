/**
 * Turns scene nodes into SVG markup.
 *
 *  - mode 'css'  : colours and light values are CSS variables (`var(--sc-*)`), so the browser cross-fades a theme change.
 *                  Gradient / clip ids carry the placeholder `@@`, replaced with an instance prefix at render time.
 *  - mode 'flat' : every token is resolved against one theme and animation is dropped (email banners, previews).
 */
import { num } from './geom.mjs';

export const kebab = (k) => k.replace(/([a-z])([A-Z0-9])/g, '$1-$2').replace(/([0-9])([a-z])/g, '$1-$2').toLowerCase();
export const cssVar = (k) => `--sc-${kebab(k)}`;

export function makeRenderer(mode, theme = null) {
  const css = mode === 'css';
  const tok = (v) => (css ? `var(${cssVar(v.slice(1))})` : String(theme[v.slice(1)]));
  const paint = (v) => {
    if (v === undefined) return undefined;
    if (v === 'none') return 'none';
    if (v.startsWith('@')) return `url(#${css ? '@@' : 'f-'}${v.slice(1)})`;
    if (v.startsWith('$')) return tok(v);
    return v;
  };
  const numval = (v) => (typeof v === 'string' && v.startsWith('$') ? tok(v) : v);
  const px = (v) => (typeof v === 'string' && v.startsWith('$') ? `calc(${tok(v)}*1px)` : `${v}px`);

  function attrs(n) {
    const at = [];
    const st = [];
    if (n.t === 'p') at.push(`d="${n.d}"`);
    if (n.t === 'c') at.push(`cx="${num(n.cx, 1)}" cy="${num(n.cy, 1)}" r="${num(n.r, 1)}"`);
    if (n.f !== undefined && n.t !== 'g') at.push(`fill="${paint(n.f)}"`);
    if (n.s) at.push(`stroke="${paint(n.s)}" stroke-width="${n.sw}" stroke-linecap="round" stroke-linejoin="round"`);
    if (n.da) at.push(`stroke-dasharray="${n.da}"`);
    if (n.o !== undefined) {
      const o = n.o;
      const k = n.ok ?? 1;
      if (typeof o === 'number') {
        if (o * k !== 1) at.push(`opacity="${num(o * k, 2)}"`);
      } else if (css) st.push(`opacity:${k === 1 ? tok(o) : `calc(${tok(o)}*${k})`}`);
      else at.push(`opacity="${num(Number(tok(o)) * k, 3)}"`);
    }
    if (n.tx) at.push(`transform="${n.tx}"`);
    if (n.pos) {
      const [x, y, k] = n.pos;
      if (css) st.push(`transform:translate(${px(x)},${px(y)}) scale(${numval(k)})`);
      else {
        const [fx, fy, fk] = n.pos.map((v) => (typeof v === 'string' ? theme[v] : v));
        at.push(`transform="translate(${num(fx, 1)} ${num(fy, 1)}) scale(${num(fk, 3)})"`);
      }
    }
    return { at, st };
  }

  function node(n) {
    if (!css && n.a === 'shoot') return '';
    const { at, st } = attrs(n);
    const cls = [];
    if (css) {
      if (n.a) {
        cls.push(`a-${n.a}`);
        if (n.dl) st.push(`--dl:${n.dl}s`);
        if (n.du) st.push(`--du:${n.du}s`);
        if (n.v) for (const [k, v] of Object.entries(n.v)) st.push(`--${k}:${num(v, 1)}px`);
      }
      if (n.shd) {
        cls.push('sc-shd');
        st.push(`transform-origin:${num(n.shd[0], 0)}px ${num(n.shd[1], 0)}px`);
      }
      if (n.h) at.push(`data-h="${n.h}"`);
    } else if (n.shd) {
      const [ox, oy] = n.shd;
      at.push(`transform="translate(${num(ox, 1)} ${num(oy, 1)}) scale(${theme.shdLen}) translate(${num(-ox, 1)} ${num(-oy, 1)})"`);
    }
    if (n.cp) at.push(`clip-path="url(#${css ? '@@' : 'f-'}${n.cp})"`);
    if (cls.length) at.push(`class="${cls.join(' ')}"`);
    if (st.length) at.push(`style="${st.join(';')}"`);
    const a = at.length ? ` ${at.join(' ')}` : '';
    if (n.t === 'g') return `<g${a}>${n.n.map(node).join('')}</g>`;
    if (n.t === 'c') return `<circle${a}/>`;
    return `<path${a}/>`;
  }

  function def(d) {
    const id = `${css ? '@@' : 'f-'}${d.id}`;
    if (d.k === 'c') return `<clipPath id="${id}"><path d="${d.d}"/></clipPath>`;
    const stops = d.stops
      .map(([off, c, al]) => {
        const colour = paint(c);
        return css
          ? `<stop offset="${num(off, 3)}" style="stop-color:${colour}${al === 1 ? '' : `;stop-opacity:${al}`}"/>`
          : `<stop offset="${num(off, 3)}" stop-color="${colour}"${al === 1 ? '' : ` stop-opacity="${al}"`}/>`;
      })
      .join('');
    if (d.k === 'l') return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}">${stops}</linearGradient>`;
    return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${d.cx}" cy="${d.cy}" r="${d.r}"${d.gt ? ` gradientTransform="${d.gt}"` : ''}>${stops}</radialGradient>`;
  }

  return {
    layer: (l) => `${l.defs?.length ? `<defs>${l.defs.map(def).join('')}</defs>` : ''}${l.nodes.map(node).join('')}`,
  };
}
