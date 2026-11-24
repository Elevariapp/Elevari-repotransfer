import { SCENE_HOURS } from './scene-data';

// The boundaries and sceneForHour live in the generated scene-data
export { SCENE_HOURS, sceneForHour } from './scene-data';

/** Attribute on <html> that scenes with data-scene="auto" follow. */
export const SCENE_ATTR = 'data-elevari-scene';

/** sessionStorage key of the Día · Tarde · Noche choice a visitor made with the switcher. */
export const SCENE_STORAGE_KEY = 'elevari-scene';

/** localStorage key of the site theme (light / dark), written by components/theme/ThemeToggle.tsx. */
export const SITE_THEME_STORAGE_KEY = 'elevari-theme';

const { dawn, day, dusk, night } = SCENE_HOURS;

/**
 * Runs in <head> before first paint so server-rendered scenes already show the right scene. The order of precedence:
 * the visitor's choice with the switcher (this tab), then an explicitly chosen dark site theme (night), then the local
 * time of day. Keep it identical to resolveScene in scene-state.ts.
 */
export const sceneInitScript = `(function(){try{var d=document.documentElement,c=null,t=null;try{c=sessionStorage.getItem('${SCENE_STORAGE_KEY}');t=localStorage.getItem('${SITE_THEME_STORAGE_KEY}')}catch(e){}var h=new Date().getHours();d.setAttribute('${SCENE_ATTR}',c==='day'||c==='golden'||c==='night'?c:t==='dark'||h>=${night}||h<${dawn}?'night':h>=${day}&&h<${dusk}?'day':'golden')}catch(e){}})();`;
