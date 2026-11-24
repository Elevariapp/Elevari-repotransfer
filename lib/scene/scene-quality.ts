import { SCENE_ATTR, SCENE_QUALITY_ATTR, SCENE_QUALITY_KEY } from './time-of-day';

/**
 * The quality governor. The scene is a lot of moving vector art, which a phone from a few years ago, a software
 * renderer or a battery-saving mode may not be able to keep at a smooth frame rate. Once the page has settled, this
 * measures the real frame rate of the hero for a couple of seconds and, if it is poor, steps the motion down: "calm"
 * (only the clouds, the mist and the fire move), then "still" (a static picture, as with prefers-reduced-motion).
 * The verdict lasts for the tab (sessionStorage) and is applied before first paint by sceneInitScript, so a slow
 * device never starts a page with the full motion again. Capable devices only pay for a short rAF loop.
 */

export type SceneQuality = 'full' | 'calm' | 'still';

/** Median frame time above which the scene counts as janky: slower than about 26 fps (a 30 Hz power-saving cap passes). */
const SLOW_FRAME_MS = 38;
/** One measurement, and the quiet time after load / a scene change before it (hydration, first paint, cross-fade). */
const SAMPLE_MS = 2400;
const SETTLE_MS = 1500;
const MIN_FRAMES = 4;
const MAX_ATTEMPTS = 4;
const MAX_VISIBLE_POLLS = 90;

type SavingNavigator = Navigator & { connection?: { saveData?: boolean } };

let running = false;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function stored(): SceneQuality | null {
  try {
    const value = sessionStorage.getItem(SCENE_QUALITY_KEY);
    return value === 'full' || value === 'calm' || value === 'still' ? value : null;
  } catch {
    return null;
  }
}

function setLevel(level: SceneQuality) {
  const root = document.documentElement;
  if (level === 'full') root.removeAttribute(SCENE_QUALITY_ATTR);
  else root.setAttribute(SCENE_QUALITY_ATTR, level);
}

function remember(level: SceneQuality) {
  try {
    sessionStorage.setItem(SCENE_QUALITY_KEY, level);
  } catch {
    // Storage can be blocked: the verdict then lasts until the next navigation
  }
}

const isLive = (probe: HTMLElement) => probe.isConnected && !document.hidden && probe.dataset.paused !== 'true';

/** Resolves true once the scene is on screen in a visible tab and has had a moment to settle; false to give up. */
async function settle(probe: HTMLElement): Promise<boolean> {
  if (document.readyState !== 'complete') {
    await new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
  }
  for (let polls = 0; polls < MAX_VISIBLE_POLLS; polls++) {
    if (!probe.isConnected) return false;
    if (isLive(probe)) {
      await wait(SETTLE_MS);
      if (isLive(probe)) return true;
    } else {
      await wait(1000);
    }
  }
  return false;
}

/** The median frame time over one window, or null when something disturbed it (hidden tab, off screen, scene change). */
function sampleFrames(probe: HTMLElement): Promise<number | null> {
  return new Promise((resolve) => {
    const deltas: number[] = [];
    let first = 0;
    let last = 0;
    let done = false;
    const finish = (value: number | null) => {
      if (done) return;
      done = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      resolve(value);
    };
    const onVisibility = () => finish(null);
    const observer = new MutationObserver(() => finish(null));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [SCENE_ATTR] });
    document.addEventListener('visibilitychange', onVisibility);

    const tick = (now: number) => {
      if (done) return;
      if (!isLive(probe)) return finish(null);
      if (last) deltas.push(now - last);
      else first = now;
      last = now;
      if (now - first < SAMPLE_MS) {
        requestAnimationFrame(tick);
        return;
      }
      // A device that manages only a few frames in the window is the slowest case, not a disturbed one
      if (deltas.length < MIN_FRAMES) return finish(null);
      deltas.sort((a, b) => a - b);
      finish(deltas[deltas.length >> 1]);
    };
    requestAnimationFrame(tick);
  });
}

async function govern(probe: HTMLElement) {
  let level: SceneQuality = 'full';
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (!(await settle(probe))) return;
    const median = await sampleFrames(probe);
    if (median === null) continue;
    if (median <= SLOW_FRAME_MS) {
      remember(level);
      return;
    }
    level = level === 'full' ? 'calm' : 'still';
    setLevel(level);
    remember(level);
    if (level === 'still') return;
  }
}

/**
 * Starts the governor for a full scene (the hero, the login pages). One measurement runs at a time and only when the
 * tab has no verdict yet; a scene that unmounts mid-measurement hands over to the next one that mounts.
 */
export function startSceneQuality(probe: HTMLElement) {
  if (running || stored() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ((navigator as SavingNavigator).connection?.saveData) {
    setLevel('calm');
    remember('calm');
    return;
  }
  running = true;
  govern(probe)
    .catch(() => {})
    .finally(() => {
      running = false;
    });
}
