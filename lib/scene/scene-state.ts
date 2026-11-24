import { SCENE_ORDER, sceneForHour, type SceneThemeName } from './scene-data';
import { SCENE_ATTR, SCENE_STORAGE_KEY, SITE_THEME_STORAGE_KEY } from './time-of-day';

/**
 * The page-wide scene state. <html data-elevari-scene> is the single source the scenes render from (sceneInitScript
 * sets it before first paint); this module keeps it current. Precedence: the visitor's choice with the switcher (this
 * tab only), then an explicitly chosen dark site theme (night), then the local time of day.
 */

export const isSceneName = (value: unknown): value is SceneThemeName =>
  typeof value === 'string' && (SCENE_ORDER as readonly string[]).includes(value);

export function readChoice(): SceneThemeName | null {
  try {
    const value = sessionStorage.getItem(SCENE_STORAGE_KEY);
    return isSceneName(value) ? value : null;
  } catch {
    return null;
  }
}

function writeChoice(choice: SceneThemeName | null) {
  try {
    if (choice) sessionStorage.setItem(SCENE_STORAGE_KEY, choice);
    else sessionStorage.removeItem(SCENE_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, embedded views): the choice then lasts until the next navigation
  }
}

/** Keep identical to sceneInitScript. */
export function resolveScene(): SceneThemeName {
  const choice = readChoice();
  if (choice) return choice;
  try {
    if (localStorage.getItem(SITE_THEME_STORAGE_KEY) === 'dark') return 'night';
  } catch {
    // ignore
  }
  return sceneForHour(new Date().getHours());
}

export function currentScene(): SceneThemeName | null {
  const value = document.documentElement.getAttribute(SCENE_ATTR);
  return isSceneName(value) ? value : null;
}

export function applyScene(name: SceneThemeName = resolveScene()): SceneThemeName {
  if (document.documentElement.getAttribute(SCENE_ATTR) !== name) {
    document.documentElement.setAttribute(SCENE_ATTR, name);
  }
  return name;
}

/** The switcher: remember the choice for this tab and show it everywhere on the page. */
export function chooseScene(name: SceneThemeName) {
  writeChoice(name);
  applyScene(name);
}

let started = false;

/**
 * Keeps the scene current for the life of the page: re-reads the clock every minute and when the tab comes back, and
 * follows the site theme toggle (dark -> night, light -> the time of day; either way it replaces the visitor's choice,
 * so the toggle in the header never feels ignored). Idempotent.
 */
export function startSceneSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  applyScene();
  window.setInterval(() => applyScene(), 60_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) applyScene();
  });
  window.addEventListener('pageshow', () => applyScene());
  let theme = document.documentElement.dataset.theme;
  new MutationObserver(() => {
    if (document.documentElement.dataset.theme === theme) return;
    theme = document.documentElement.dataset.theme;
    writeChoice(null);
    // The attribute changes before the toggle has necessarily written localStorage, so read the attribute itself
    applyScene(theme === 'dark' ? 'night' : sceneForHour(new Date().getHours()));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function subscribeScene(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [SCENE_ATTR] });
  return () => observer.disconnect();
}
