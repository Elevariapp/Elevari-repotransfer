import type { CSSProperties, ReactNode } from 'react';
import {
  SCENE_CLOUDS,
  SCENE_LAKE,
  SCENE_MIST,
  SCENE_MOON,
  SCENE_PINES,
  SCENE_PINES_VIEW,
  SCENE_RAYS,
  SCENE_RIDGES,
  SCENE_SHORE,
  SCENE_STARS,
  SCENE_SUN,
  SCENE_VIEW,
  type SceneThemeName,
} from '@/lib/scene/scene-data';
import SceneController from './SceneController';
import './scene-themes.css';
import './scene.css';

export interface ScenicBackgroundProps {
  /** `full` is the whole picture (login, registration); `lite` is a horizon strip for bands and heroes. */
  variant?: 'full' | 'lite';
  /** `auto` follows the visitor's local time of day. */
  theme?: 'auto' | SceneThemeName;
  /** Darkening that keeps the text placed on top of the scene legible. */
  scrim?: 'auth' | 'center';
  /** Unique per scene on a page; the SVG gradient ids derive from it. */
  idPrefix: string;
  className?: string;
}

type Vars = CSSProperties & { [name: `--${string}`]: string | number };

const VIEW_FULL = `0 0 ${SCENE_VIEW.w} ${SCENE_VIEW.h}`;
const VIEW_LITE = `0 340 ${SCENE_VIEW.w} 420`;
const CRATERS = [
  [-14, -10, 11],
  [12, 6, 8],
  [-4, 19, 6],
  [18, -16, 5],
] as const;
const EMBERS = [
  { x: '14%', y: '9%', s: 3, t: 13, w: -2, dx: 24 },
  { x: '27%', y: '6%', s: 2, t: 17, w: -9, dx: -18 },
  { x: '41%', y: '12%', s: 3, t: 15, w: -5, dx: 30 },
  { x: '58%', y: '7%', s: 2, t: 19, w: -12, dx: -26 },
  { x: '71%', y: '10%', s: 3, t: 14, w: -7, dx: 20 },
  { x: '86%', y: '8%', s: 2, t: 18, w: -3, dx: -22 },
] as const;
const SHOOTS = [
  { x: '72%', y: '12%', t: 17, w: -6 },
  { x: '38%', y: '7%', t: 26, w: -15 },
] as const;

const fill = (name: string): CSSProperties => ({ fill: `var(--sc-${name})` });
const stop = (name: string, opacity?: string): CSSProperties => ({
  stopColor: `var(--sc-${name})`,
  ...(opacity ? { stopOpacity: opacity } : null),
});

function Layer({ name, depth, children }: { name: string; depth: number; children: ReactNode }) {
  return (
    <div className={`sc-l sc-${name}`} style={{ '--d': depth } as Vars}>
      {children}
    </div>
  );
}

function Art({ view, children }: { view: string; children: ReactNode }) {
  return (
    <svg className="sc-svg" viewBox={view} preserveAspectRatio="xMidYMax slice" focusable="false">
      {children}
    </svg>
  );
}

export default function ScenicBackground({
  variant = 'full',
  theme = 'auto',
  scrim,
  idPrefix,
  className,
}: ScenicBackgroundProps) {
  const lite = variant === 'lite';
  const view = lite ? VIEW_LITE : VIEW_FULL;
  const id = (name: string) => `${idPrefix}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const { x: sx, y: sy, r: sr } = SCENE_SUN;

  const ridge = (key: 'far' | 'mid' | 'near', rim: number) => {
    const r = SCENE_RIDGES[key];
    return (
      <Art view={view}>
        <defs>
          <linearGradient id={id(key)} gradientUnits="userSpaceOnUse" x1="0" y1={r.top} x2="0" y2={r.top + 360}>
            <stop offset="0" style={stop(`${key}-top`)} />
            <stop offset="1" style={stop(`${key}-lo`)} />
          </linearGradient>
        </defs>
        <path d={r.d} fill={url(key)} />
        <path
          d={r.crest}
          fill="none"
          strokeWidth="1.4"
          style={{ stroke: 'var(--sc-rim)', strokeOpacity: `calc(var(--sc-rim-a) * ${rim})` }}
        />
      </Art>
    );
  };

  const mist = (index: number) => {
    const m = SCENE_MIST[index];
    return (
      <div className="sc-drift">
        <Art view={view}>
          <defs>
            <radialGradient id={id(`mist${index}`)}>
              <stop offset="0" style={stop('mist', 'var(--sc-mist-a)')} />
              <stop offset="1" style={stop('mist', '0')} />
            </radialGradient>
          </defs>
          <ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill={url(`mist${index}`)} />
        </Art>
      </div>
    );
  };

  const clouds = (layer: 0 | 1) => (
    <div className="sc-drift">
      <Art view={view}>
        {SCENE_CLOUDS.filter((c) => c.layer === layer).map((c) => (
          <path
            key={c.d.slice(0, 24)}
            d={c.d}
            style={{
              fill: layer ? 'var(--sc-cloud-lo)' : 'var(--sc-cloud-hi)',
              fillOpacity: `calc(var(--sc-cloud-${layer ? 'lo' : 'hi'}-a) * ${c.o})`,
            }}
          />
        ))}
      </Art>
    </div>
  );

  const pines = (side: 'left' | 'right') => {
    const c = SCENE_PINES[side];
    const l = side === 'left';
    return (
      <div className={`sc-pines sc-pines-${l ? 'l' : 'r'}`} style={{ '--d': 36 } as Vars}>
        <div className="sc-sway">
          <svg
            viewBox={`0 0 ${SCENE_PINES_VIEW.w} ${SCENE_PINES_VIEW.h}`}
            preserveAspectRatio={l ? 'xMinYMax meet' : 'xMaxYMax meet'}
            overflow="visible"
            focusable="false"
          >
            <defs>
              <radialGradient id={id(`win-${side}`)}>
                <stop offset="0" style={stop('window-light')} stopOpacity=".55" />
                <stop offset="1" style={stop('window-light')} stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d={c.back} style={fill('pine-back')} />
            <path d={c.bank} style={fill('pine')} />
            <path d={c.front} style={fill('pine')} />
            {c.cabin && (
              <>
                <g style={{ opacity: 'var(--sc-o-window)' }}>
                  <circle
                    className="sc-flicker"
                    cx={c.cabin.glow[0]}
                    cy={c.cabin.glow[1]}
                    r={c.cabin.glow[2]}
                    fill={url(`win-${side}`)}
                  />
                </g>
                <path d={c.cabin.body} style={fill('pine')} />
                <g style={{ opacity: 'var(--sc-o-window)' }}>
                  <rect
                    className="sc-flicker"
                    x={c.cabin.win[0]}
                    y={c.cabin.win[1]}
                    width={c.cabin.win[2]}
                    height={c.cabin.win[3]}
                    rx="1.5"
                    style={fill('window-light')}
                  />
                </g>
              </>
            )}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className={className ? `sc ${className}` : 'sc'} data-scene={theme} data-variant={variant} data-scrim={scrim} aria-hidden="true">
      <div className="sc-sky" />
      <div className="sc-glow" />

      {!lite && (
        <Layer name="stars" depth={4}>
          <Art view={view}>
            {[0, 1, 2].map((group) => (
              <g key={group} className={`sc-tw-${group}`} style={fill('star')}>
                {SCENE_STARS.filter((s) => s[3] === group).map(([x, y, r, , o]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity={o} />
                ))}
              </g>
            ))}
          </Art>
        </Layer>
      )}
      {!lite && (
        <div className="sc-shoots">
          {SHOOTS.map((s) => (
            <i
              key={s.x}
              className="sc-shoot"
              style={{ '--x': s.x, '--y': s.y, '--t': `${s.t}s`, '--w': `${s.w}s` } as Vars}
            />
          ))}
        </div>
      )}

      <Layer name="light" depth={10}>
        <div className="sc-pulse">
          <Art view={view}>
            <defs>
              <radialGradient id={id('halo')}>
                <stop offset="0" style={stop('halo', 'calc(var(--sc-halo-a) * var(--sc-o-halo))')} />
                <stop offset=".35" style={stop('halo', 'calc(var(--sc-halo-a) * var(--sc-o-halo) * .4)')} />
                <stop offset="1" style={stop('halo', '0')} />
              </radialGradient>
              <radialGradient id={id('rays')} gradientUnits="userSpaceOnUse" cx={sx} cy={sy} r="1000">
                <stop offset="0" style={stop('halo')} stopOpacity=".26" />
                <stop offset="1" style={stop('halo')} stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="sc-sx">
              <g className="sc-lift">
                <circle cx={sx} cy={sy} r="640" fill={url('halo')} />
                <g fill={url('rays')} style={{ opacity: 'calc(.9 * var(--sc-o-sun))' }}>
                  {SCENE_RAYS.map((ray) => (
                    <path key={ray.d} d={ray.d} fillOpacity={ray.o} />
                  ))}
                </g>
              </g>
            </g>
          </Art>
        </div>
      </Layer>

      <Layer name="orb" depth={10}>
        <Art view={view}>
          <defs>
            <radialGradient id={id('sun')}>
              <stop offset="0" style={stop('sun-core')} />
              <stop offset=".62" style={stop('sun-mid')} />
              <stop offset="1" style={stop('sun-edge')} />
            </radialGradient>
            <radialGradient id={id('moon')} cx=".4" cy=".38">
              <stop offset="0" style={stop('moon-core')} />
              <stop offset="1" style={stop('moon-edge')} />
            </radialGradient>
            <radialGradient id={id('moon-halo')}>
              <stop offset="0" style={stop('moon-halo')} stopOpacity=".38" />
              <stop offset="1" style={stop('moon-halo')} stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="sc-sx">
            <g className="sc-lift">
              <circle cx={sx} cy={sy} r={sr} fill={url('sun')} style={{ opacity: 'var(--sc-o-sun)' }} />
            </g>
            <g style={{ opacity: 'var(--sc-o-moon)' }}>
              <circle cx={SCENE_MOON.x} cy={SCENE_MOON.y} r="200" fill={url('moon-halo')} />
              <circle cx={SCENE_MOON.x} cy={SCENE_MOON.y} r={SCENE_MOON.r} fill={url('moon')} />
              {CRATERS.map(([dx, dy, r]) => (
                <circle
                  key={`${dx}${dy}`}
                  cx={SCENE_MOON.x + dx}
                  cy={SCENE_MOON.y + dy}
                  r={r}
                  opacity=".2"
                  style={fill('moon-crater')}
                />
              ))}
            </g>
          </g>
        </Art>
      </Layer>

      <Layer name="clouds-0" depth={8}>
        {clouds(0)}
      </Layer>
      <Layer name="clouds-1" depth={12}>
        {clouds(1)}
      </Layer>

      <Layer name="far" depth={10}>
        {ridge('far', 1)}
      </Layer>
      <Layer name="mist-0" depth={14}>
        {mist(0)}
      </Layer>
      <Layer name="mid" depth={16}>
        {ridge('mid', 0.7)}
      </Layer>
      <Layer name="mist-1" depth={20}>
        {mist(1)}
      </Layer>
      <Layer name="near" depth={24}>
        {ridge('near', 0.45)}
      </Layer>

      {!lite && (
        <>
          <Layer name="lake" depth={24}>
            <Art view={view}>
              <defs>
                <linearGradient id={id('lake')} gradientUnits="userSpaceOnUse" x1="0" y1={SCENE_SHORE} x2="0" y2={SCENE_VIEW.h}>
                  <stop offset="0" style={stop('lake-0')} />
                  <stop offset=".45" style={stop('lake-1')} />
                  <stop offset="1" style={stop('lake-2')} />
                </linearGradient>
                <linearGradient id={id('refl')} gradientUnits="userSpaceOnUse" x1="0" y1={SCENE_SHORE} x2="0" y2={SCENE_SHORE + 150}>
                  <stop offset="0" style={stop('near-top')} stopOpacity=".7" />
                  <stop offset="1" style={stop('near-top')} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={SCENE_LAKE.d} fill={url('lake')} />
              <path d={SCENE_LAKE.reflection} fill={url('refl')} />
              <g strokeLinecap="round" strokeWidth="1.4" style={{ stroke: 'var(--sc-ripple)' }}>
                {SCENE_LAKE.ripples.map(([x, y, w, o]) => (
                  <path key={`${x}-${y}`} d={`M${x},${y}h${w}`} opacity={o} />
                ))}
              </g>
            </Art>
          </Layer>
          <Layer name="glints" depth={10}>
            <div className="sc-shimmer">
              <Art view={view}>
                <defs>
                  <radialGradient id={id('water')}>
                    <stop offset="0" style={stop('halo', 'calc(.5 * max(var(--sc-o-sun), var(--sc-o-halo) * .5))')} />
                    <stop offset="1" style={stop('halo', '0')} />
                  </radialGradient>
                </defs>
                <g className="sc-sx">
                  <ellipse cx={sx} cy={SCENE_SHORE + 22} rx="330" ry="80" fill={url('water')} />
                  <g style={{ ...fill('glint'), opacity: 'calc(.9 * max(var(--sc-o-sun), var(--sc-o-moon) * .55))' }}>
                    {SCENE_LAKE.glints.map(([x, y, w, h]) => (
                      <rect key={`${x}-${y}`} x={x - w / 2} y={y} width={w} height={h} rx={h / 2} />
                    ))}
                  </g>
                </g>
              </Art>
            </div>
          </Layer>

          {pines('left')}
          {pines('right')}

          <div className="sc-embers">
            {EMBERS.map((e) => (
              <i
                key={e.x}
                className="sc-ember"
                style={{ '--x': e.x, '--y': e.y, '--s': `${e.s}px`, '--t': `${e.t}s`, '--w': `${e.w}s`, '--dx': `${e.dx}px` } as Vars}
              />
            ))}
          </div>
        </>
      )}

      <div className="sc-scrim" />
      <SceneController />
    </div>
  );
}
