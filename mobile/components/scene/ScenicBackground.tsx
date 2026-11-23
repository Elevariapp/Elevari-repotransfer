import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, AppState, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
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
  SCENE_SKY_STOPS,
  SCENE_STARS,
  SCENE_SUN,
  SCENE_THEMES,
  SCENE_VIEW,
  sceneForHour,
  type SceneThemeName,
} from '@/lib/scene-data';
import { useCalm, useLoop, useStableWindow, type SceneParallax } from './motion';

/*
 * The Elevari scene on native: the same vector art as the web (lib/scene-data.ts is generated from
 * scripts/scene, never edited by hand), drawn with react-native-svg. Every layer is one <Svg> using the web's
 * geometry (viewBox 1600x900, "xMidYMax slice", 3% overscan) so the ridges, sun and pines line up at any size.
 * Motion is native-driven (clouds, sunlight, stars, embers, shooting stars) plus touch parallax; like the web on
 * phones it leaves out mist drift, water shimmer and tree sway.
 */

export interface ScenicBackgroundProps {
  /** `auto` follows the local time of day. */
  theme?: 'auto' | SceneThemeName;
  /** Height in px when the scene is a hero above a sheet; omitted, it fills the screen behind a centred card. */
  stageHeight?: number;
  /** Hold still (screen not focused). Reduced motion and a backgrounded app are handled inside. */
  paused?: boolean;
  parallax?: SceneParallax;
}

const PARALLAX_K = 0.35;
const VIEW = `0 0 ${SCENE_VIEW.w} ${SCENE_VIEW.h}`;
const PINE_PAD = 120;
const SCRIM = '#180803';
/** Top darkening that keeps the white brand lockup and the status bar readable on the light day sky. */
const SCRIM_TOP = 0.8;
const CRATERS = [
  [-14, -10, 11],
  [12, 6, 8],
  [-4, 19, 6],
  [18, -16, 5],
] as const;
const EMBERS = [
  { x: 14, y: 9, s: 3, t: 13, w: 2, dx: 24 },
  { x: 27, y: 6, s: 2, t: 17, w: 9, dx: -18 },
  { x: 41, y: 12, s: 3, t: 15, w: 5, dx: 30 },
  { x: 58, y: 7, s: 2, t: 19, w: 12, dx: -26 },
  { x: 71, y: 10, s: 3, t: 14, w: 7, dx: 20 },
  { x: 86, y: 8, s: 2, t: 18, w: 3, dx: -22 },
] as const;
const SHOOTS = [
  { x: 72, y: 12, t: 17, w: 6 },
  { x: 38, y: 7, t: 26, w: 15 },
] as const;

function useSceneName(theme: 'auto' | SceneThemeName): SceneThemeName {
  const [name, setName] = useState<SceneThemeName>(() =>
    theme === 'auto' ? sceneForHour(new Date().getHours()) : theme,
  );

  useEffect(() => {
    if (theme !== 'auto') {
      setName(theme);
      return undefined;
    }
    const sync = () => setName(sceneForHour(new Date().getHours()));
    sync();
    const timer = setInterval(sync, 60_000);
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      clearInterval(timer);
      app.remove();
    };
  }, [theme]);

  return name;
}

/** Keeps the outgoing scene mounted underneath while the incoming one fades in (the web does the same). */
function useCrossfade(name: SceneThemeName, calm: boolean) {
  const [layers, setLayers] = useState<SceneThemeName[]>([name]);
  const fade = useRef(new Animated.Value(1)).current;
  const shown = useRef(name);

  useEffect(() => {
    if (shown.current === name) return;
    const previous = shown.current;
    shown.current = name;
    if (calm) {
      setLayers([name]);
      return;
    }
    fade.setValue(0);
    setLayers([previous, name]);
    Animated.timing(fade, { toValue: 1, duration: 1800, useNativeDriver: true, isInteraction: false }).start(
      ({ finished }) => {
        if (finished) setLayers([name]);
      },
    );
  }, [calm, fade, name]);

  return { layers, fade };
}

function Layer({
  depth,
  parallax,
  box = styles.layer,
  children,
}: {
  depth: number;
  parallax?: SceneParallax;
  box?: ViewStyle;
  children: ReactNode;
}) {
  const transform = useMemo(
    () =>
      parallax && depth > 0
        ? [
            { translateX: Animated.multiply(parallax.x, depth * PARALLAX_K) },
            { translateY: Animated.multiply(parallax.y, depth * PARALLAX_K * 0.5) },
          ]
        : undefined,
    [depth, parallax],
  );
  return <Animated.View style={[box, transform && { transform }]}>{children}</Animated.View>;
}

function Art({ children }: { children: ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox={VIEW} preserveAspectRatio="xMidYMax slice">
      {children}
    </Svg>
  );
}

/** Slow sideways drift, back and forth; `travel` is in px (negative runs the other way). */
function Drift({ seconds, travel, calm, children }: { seconds: number; travel: number; calm: boolean; children: ReactNode }) {
  const v = useLoop(seconds * 1000, calm, { bounce: true });
  const translateX = useMemo(() => v.interpolate({ inputRange: [0, 1], outputRange: [-travel, travel] }), [travel, v]);
  return <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>{children}</Animated.View>;
}

/** Opacity that breathes between `low` and `high`. */
function Breathe({
  seconds,
  low,
  high,
  calm,
  children,
}: {
  seconds: number;
  low: number;
  high: number;
  calm: boolean;
  children: ReactNode;
}) {
  const v = useLoop(seconds * 1000, calm, { bounce: true });
  const opacity = useMemo(() => v.interpolate({ inputRange: [0, 1], outputRange: [low, high] }), [high, low, v]);
  return <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>{children}</Animated.View>;
}

function Ember({
  x,
  y,
  size,
  seconds,
  delay,
  dx,
  peak,
  rise,
  color,
  calm,
}: {
  x: number;
  y: number;
  size: number;
  seconds: number;
  delay: number;
  dx: number;
  peak: number;
  rise: number;
  color: string;
  calm: boolean;
}) {
  const v = useLoop(seconds * 1000, calm, { phase: delay / seconds });
  const motion = useMemo(
    () => ({
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, peak, 0] }),
      transform: [
        { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
        { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) },
      ],
    }),
    [dx, peak, rise, v],
  );
  const halo = size * 4;
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: `${x}%`, bottom: `${y}%`, width: size, height: size },
        motion,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          left: (size - halo) / 2,
          top: (size - halo) / 2,
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundColor: color,
          opacity: 0.2,
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </Animated.View>
  );
}

function Shoot({
  id,
  x,
  y,
  seconds,
  delay,
  color,
  calm,
}: {
  id: string;
  x: number;
  y: number;
  seconds: number;
  delay: number;
  color: string;
  calm: boolean;
}) {
  const v = useLoop(seconds * 1000, calm, { phase: delay / seconds });
  const motion = useMemo(
    () => ({
      opacity: v.interpolate({ inputRange: [0, 0.88, 0.9, 1], outputRange: [0, 0, 1, 0] }),
      transform: [
        { rotate: '-208deg' },
        { translateX: v.interpolate({ inputRange: [0, 0.88, 1], outputRange: [0, 0, 260] }) },
      ],
    }),
    [v],
  );
  return (
    <Animated.View style={[{ position: 'absolute', top: `${y}%`, left: `${x}%`, width: 150, height: 2 }, motion]}>
      <Svg width={150} height={2}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width={150} height={2} rx={1} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

interface SceneArtProps {
  name: SceneThemeName;
  width: number;
  height: number;
  hero: boolean;
  calm: boolean;
  parallax?: SceneParallax;
  uid: string;
}

function SceneArt({ name, width: w, height: h, hero, calm, parallax, uid }: SceneArtProps) {
  const t = SCENE_THEMES[name];
  const id = (part: string) => `${uid}-${name}-${part}`;
  const url = (part: string) => `url(#${id(part)})`;
  const { x: sx, y: sy, r: sr } = SCENE_SUN;
  const aspect = w / h;

  // A centred card would hide the sun: on wide screens it slides right, like on the web.
  const shift = hero ? 0 : aspect >= 1.5 ? 352 : aspect >= 1.1 ? 192 : 0;
  const lift = t.liftSun * SCENE_VIEW.h;
  const sun = `translate(${shift} ${lift})`;
  const across = `translate(${shift} 0)`;

  // Pines are sized by height; on tall, narrow screens they shrink so the two clusters never meet.
  const k = Math.max(0.38, Math.min(0.92, 0.38 + (aspect - 0.8) * 0.9)) * ((h / SCENE_VIEW.h) * 1.06);
  const pineBox = (side: 'left' | 'right'): ViewStyle => ({
    position: 'absolute',
    bottom: -0.03 * h,
    [side]: -0.03 * w - PINE_PAD * k,
    width: (SCENE_PINES_VIEW.w + PINE_PAD * 2) * k,
    height: SCENE_PINES_VIEW.h * k,
  });

  const sky = [t.sky0, t.sky1, t.sky2, t.sky3, t.sky4];
  const ridges = {
    far: { top: t.farTop, lo: t.farLo, rim: 1 },
    mid: { top: t.midTop, lo: t.midLo, rim: 0.7 },
    near: { top: t.nearTop, lo: t.nearLo, rim: 0.45 },
  } as const;

  const ridge = (key: keyof typeof ridges) => {
    const r = SCENE_RIDGES[key];
    const c = ridges[key];
    return (
      <>
        <Defs>
          <LinearGradient id={id(key)} gradientUnits="userSpaceOnUse" x1="0" y1={r.top} x2="0" y2={r.top + 360}>
            <Stop offset="0" stopColor={c.top} />
            <Stop offset="1" stopColor={c.lo} />
          </LinearGradient>
        </Defs>
        <Path d={r.d} fill={url(key)} />
        <Path d={r.crest} fill="none" stroke={t.rim} strokeWidth={1.4} strokeOpacity={t.rimA * c.rim} />
      </>
    );
  };

  const mist = (index: number) => {
    const m = SCENE_MIST[index];
    return (
      <>
        <Defs>
          <RadialGradient id={id(`mist${index}`)}>
            <Stop offset="0" stopColor={t.mist} stopOpacity={t.mistA} />
            <Stop offset="1" stopColor={t.mist} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={m.cx} cy={m.cy} rx={m.rx} ry={m.ry} fill={url(`mist${index}`)} />
      </>
    );
  };

  const clouds = (layer: 0 | 1) => (
    <Art>
      {SCENE_CLOUDS.filter((c) => c.layer === layer).map((c, i) => (
        <Path
          key={i}
          d={c.d}
          fill={layer ? t.cloudLo : t.cloudHi}
          fillOpacity={(layer ? t.cloudLoA : t.cloudHiA) * c.o}
        />
      ))}
    </Art>
  );

  const stars = (groups: readonly number[]) => (
    <Art>
      <G fill={t.star}>
        {SCENE_STARS.filter((s) => groups.includes(s[3])).map(([x, y, r, , o]) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity={o} />
        ))}
      </G>
    </Art>
  );

  const pines = (side: 'left' | 'right') => {
    const c = SCENE_PINES[side];
    const cabin = c.cabin;
    return (
      <Layer depth={36} parallax={parallax} box={pineBox(side)}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`${-PINE_PAD} 0 ${SCENE_PINES_VIEW.w + PINE_PAD * 2} ${SCENE_PINES_VIEW.h}`}
          preserveAspectRatio="xMidYMax meet"
        >
          <Path d={c.back} fill={t.pineBack} />
          <Path d={c.bank} fill={t.pine} />
          <Path d={c.front} fill={t.pine} />
          {cabin && <Path d={cabin.body} fill={t.pine} />}
        </Svg>
        {cabin && <CabinLight cabin={cabin} k={k} id={id(`window-${side}`)} color={t.windowLight} level={t.oWindow} calm={calm} />}
      </Layer>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {hero && <View style={[styles.ground, { top: h - 1, backgroundColor: t.lake2 }]} />}
      <View style={[styles.stage, { height: h }]}>
        <Layer depth={0}>
          <Art>
            <Defs>
              <LinearGradient id={id('sky')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={SCENE_VIEW.h}>
                {SCENE_SKY_STOPS.map((offset, i) => (
                  <Stop key={i} offset={offset} stopColor={sky[i]} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width={SCENE_VIEW.w} height={SCENE_VIEW.h} fill={url('sky')} />
          </Art>
        </Layer>

        {t.oStars > 0 && (
          <>
            <Layer depth={4} parallax={parallax}>
              <Breathe seconds={4} low={0.3 * t.oStars} high={t.oStars} calm={calm}>
                {stars([0, 1])}
              </Breathe>
            </Layer>
            <Layer depth={4} parallax={parallax}>
              <Breathe seconds={5.8} low={0.3 * t.oStars} high={t.oStars} calm={calm}>
                {stars([2])}
              </Breathe>
            </Layer>
          </>
        )}
        {t.oShoot > 0 &&
          !calm &&
          SHOOTS.map((s) => (
            <Shoot key={s.x} id={id(`shoot${s.x}`)} x={s.x} y={s.y} seconds={s.t} delay={s.w} color={t.star} calm={calm} />
          ))}

        <Layer depth={10} parallax={parallax}>
          <Breathe seconds={18} low={0.8} high={1} calm={calm}>
            <Art>
              <Defs>
                <RadialGradient id={id('halo')}>
                  <Stop offset="0" stopColor={t.halo} stopOpacity={t.haloA * t.oHalo} />
                  <Stop offset="0.35" stopColor={t.halo} stopOpacity={t.haloA * t.oHalo * 0.4} />
                  <Stop offset="1" stopColor={t.halo} stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id={id('rays')} gradientUnits="userSpaceOnUse" cx={sx} cy={sy} r={1000}>
                  <Stop offset="0" stopColor={t.halo} stopOpacity={0.26} />
                  <Stop offset="1" stopColor={t.halo} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <G transform={sun}>
                <Circle cx={sx} cy={sy} r={640} fill={url('halo')} />
                <G opacity={0.9 * t.oSun} fill={url('rays')}>
                  {SCENE_RAYS.map((ray, i) => (
                    <Path key={i} d={ray.d} fillOpacity={ray.o} />
                  ))}
                </G>
              </G>
            </Art>
          </Breathe>
        </Layer>

        <Layer depth={10} parallax={parallax}>
          <Art>
            <Defs>
              <RadialGradient id={id('sun')}>
                <Stop offset="0" stopColor={t.sunCore} />
                <Stop offset="0.62" stopColor={t.sunMid} />
                <Stop offset="1" stopColor={t.sunEdge} />
              </RadialGradient>
              <RadialGradient id={id('moon')} cx="0.4" cy="0.38">
                <Stop offset="0" stopColor={t.moonCore} />
                <Stop offset="1" stopColor={t.moonEdge} />
              </RadialGradient>
              <RadialGradient id={id('moonHalo')}>
                <Stop offset="0" stopColor={t.moonHalo} stopOpacity={0.38} />
                <Stop offset="1" stopColor={t.moonHalo} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {t.oSun > 0 && (
              <G transform={sun}>
                <Circle cx={sx} cy={sy} r={sr} fill={url('sun')} opacity={t.oSun} />
              </G>
            )}
            {t.oMoon > 0 && (
              <G transform={across} opacity={t.oMoon}>
                <Circle cx={SCENE_MOON.x} cy={SCENE_MOON.y} r={200} fill={url('moonHalo')} />
                <Circle cx={SCENE_MOON.x} cy={SCENE_MOON.y} r={SCENE_MOON.r} fill={url('moon')} />
                {CRATERS.map(([dx, dy, r]) => (
                  <Circle key={`${dx}${dy}`} cx={SCENE_MOON.x + dx} cy={SCENE_MOON.y + dy} r={r} fill={t.moonCrater} opacity={0.2} />
                ))}
              </G>
            )}
          </Art>
        </Layer>

        <Layer depth={8} parallax={parallax}>
          <Drift seconds={60} travel={0.07 * w} calm={calm}>
            {clouds(0)}
          </Drift>
        </Layer>
        <Layer depth={12} parallax={parallax}>
          <Drift seconds={42} travel={-0.05 * w} calm={calm}>
            {clouds(1)}
          </Drift>
        </Layer>

        <Layer depth={12} parallax={parallax}>
          <Art>
            {ridge('far')}
            {mist(0)}
          </Art>
        </Layer>
        <Layer depth={18} parallax={parallax}>
          <Art>
            {ridge('mid')}
            {mist(1)}
          </Art>
        </Layer>

        <Layer depth={24} parallax={parallax}>
          <Art>
            {ridge('near')}
            <Defs>
              <LinearGradient id={id('lake')} gradientUnits="userSpaceOnUse" x1="0" y1={SCENE_SHORE} x2="0" y2={SCENE_VIEW.h}>
                <Stop offset="0" stopColor={t.lake0} />
                <Stop offset="0.45" stopColor={t.lake1} />
                <Stop offset="1" stopColor={t.lake2} />
              </LinearGradient>
              <LinearGradient id={id('refl')} gradientUnits="userSpaceOnUse" x1="0" y1={SCENE_SHORE} x2="0" y2={SCENE_SHORE + 150}>
                <Stop offset="0" stopColor={t.nearTop} stopOpacity={0.7} />
                <Stop offset="1" stopColor={t.nearTop} stopOpacity={0} />
              </LinearGradient>
              <RadialGradient id={id('water')}>
                <Stop offset="0" stopColor={t.halo} stopOpacity={0.5 * Math.max(t.oSun, t.oHalo * 0.5)} />
                <Stop offset="1" stopColor={t.halo} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Path d={SCENE_LAKE.d} fill={url('lake')} />
            <Path d={SCENE_LAKE.reflection} fill={url('refl')} />
            <G stroke={t.ripple} strokeWidth={1.4} strokeLinecap="round">
              {SCENE_LAKE.ripples.map(([x, y, rw, o]) => (
                <Path key={`${x}-${y}`} d={`M${x},${y}h${rw}`} opacity={o} />
              ))}
            </G>
            <G transform={across}>
              <Ellipse cx={sx} cy={SCENE_SHORE + 22} rx={330} ry={80} fill={url('water')} />
              <G fill={t.glint} opacity={0.9 * Math.max(t.oSun, t.oMoon * 0.55)}>
                {SCENE_LAKE.glints.map(([x, y, gw, gh]) => (
                  <Rect key={`${x}-${y}`} x={x - gw / 2} y={y} width={gw} height={gh} rx={gh / 2} />
                ))}
              </G>
            </G>
          </Art>
        </Layer>

        {pines('left')}
        {pines('right')}

        {!calm &&
          EMBERS.map((e) => (
            <Ember
              key={e.x}
              x={e.x}
              y={e.y}
              size={e.s}
              seconds={e.t}
              delay={e.w}
              dx={e.dx}
              peak={t.oEmber}
              rise={0.34 * h}
              color={t.ember}
              calm={calm}
            />
          ))}

        <View style={[styles.scrim, { height: h * 0.5 }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={id('scrim')} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={SCRIM} stopOpacity={SCRIM_TOP * t.scrimK} />
                <Stop offset="0.5" stopColor={SCRIM} stopOpacity={SCRIM_TOP * t.scrimK * 0.5} />
                <Stop offset="1" stopColor={SCRIM} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={url('scrim')} />
          </Svg>
        </View>
      </View>
    </View>
  );
}

/** The cabin window and the glow around it, flickering like a lit lamp. */
function CabinLight({
  cabin,
  k,
  id,
  color,
  level,
  calm,
}: {
  cabin: NonNullable<(typeof SCENE_PINES)['left']['cabin']>;
  k: number;
  id: string;
  color: string;
  level: number;
  calm: boolean;
}) {
  const v = useLoop(6000, calm);
  const opacity = useMemo(
    () =>
      v.interpolate({
        inputRange: [0, 0.46, 0.52, 0.73, 1],
        outputRange: [level, level * 0.88, level * 0.96, level * 0.8, level],
      }),
    [level, v],
  );
  const [gx, gy, gr] = cabin.glow;
  const [wx, wy, ww, wh] = cabin.win;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: (gx - gr + PINE_PAD) * k,
        top: (gy - gr) * k,
        width: gr * 2 * k,
        height: gr * 2 * k,
        opacity,
      }}
    >
      <Svg width="100%" height="100%" viewBox={`${gx - gr} ${gy - gr} ${gr * 2} ${gr * 2}`}>
        <Defs>
          <RadialGradient id={id}>
            <Stop offset="0" stopColor={color} stopOpacity={0.55} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={gx} cy={gy} r={gr} fill={`url(#${id})`} />
        <Rect x={wx} y={wy} width={ww} height={wh} rx={1.5} fill={color} />
      </Svg>
    </Animated.View>
  );
}

function ScenicBackground({ theme = 'auto', stageHeight, paused = false, parallax }: ScenicBackgroundProps) {
  const { width, height } = useStableWindow();
  const calm = useCalm(paused);
  const name = useSceneName(theme);
  const { layers, fade } = useCrossfade(name, calm);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hero = stageHeight !== undefined;

  return (
    <View style={styles.root} aria-hidden>
      {layers.map((layer) => (
        <Animated.View
          key={layer}
          style={[StyleSheet.absoluteFill, layers.length > 1 && layer === name ? { opacity: fade } : null]}
        >
          <SceneArt
            name={layer}
            width={width}
            height={hero ? stageHeight : height}
            hero={hero}
            calm={calm}
            parallax={parallax}
            uid={uid}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#7C2D12',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  stage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  layer: {
    position: 'absolute',
    top: '-3%',
    left: '-3%',
    right: '-3%',
    bottom: '-3%',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

export default memo(ScenicBackground);
