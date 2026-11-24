import { SCENE_HOURS } from './scene-data';

// The boundaries and sceneForHour live in the generated scene-data
export { SCENE_HOURS, sceneForHour } from './scene-data';

/** Attribute on <html> that scenes with data-scene="auto" follow. */
export const SCENE_ATTR = 'data-elevari-scene';

/** sessionStorage key of the Día · Tarde · Noche choice a visitor made with the switcher. */
export const SCENE_STORAGE_KEY = 'elevari-scene';

/** localStorage key of the site theme (light / dark), written by components/theme/ThemeToggle.tsx. */
export const SITE_THEME_STORAGE_KEY = 'elevari-theme';

/** Attribute on <html> with the motion level the quality governor settled on: 'calm' or 'still' (absent = full). */
export const SCENE_QUALITY_ATTR = 'data-scene-q';

/** sessionStorage key of that level, so a slow device does not start every page with the full motion. */
export const SCENE_QUALITY_KEY = 'elevari-scene-q';

const { dawn, day, dusk, night } = SCENE_HOURS;

/**
 * Runs in <head> before first paint so server-rendered scenes already show the right scene. The order of precedence:
 * the visitor's choice with the switcher (this tab), then an explicitly chosen dark site theme (night), then the local
 * time of day. Keep it identical to resolveScene in scene-state.ts. It also restores the motion level the quality
 * governor settled on earlier in this tab (scene-quality.ts).
 */
export const sceneInitScript = `(function(){try{var d=document.documentElement,c=null,t=null,q=null;try{c=sessionStorage.getItem('${SCENE_STORAGE_KEY}');t=localStorage.getItem('${SITE_THEME_STORAGE_KEY}');q=sessionStorage.getItem('${SCENE_QUALITY_KEY}')}catch(e){}var h=new Date().getHours();d.setAttribute('${SCENE_ATTR}',c==='day'||c==='golden'||c==='night'?c:t==='dark'||h>=${night}||h<${dawn}?'night':h>=${day}&&h<${dusk}?'day':'golden');if(q==='calm'||q==='still')d.setAttribute('${SCENE_QUALITY_ATTR}',q)}catch(e){}})();`;
