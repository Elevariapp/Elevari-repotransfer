import { SCENE_HOURS } from './scene-data';

// The boundaries and sceneForHour live in the generated scene-data (shared with the mobile app)
export { SCENE_HOURS, sceneForHour } from './scene-data';

/** Attribute on <html> that scenes with data-scene="auto" follow. */
export const SCENE_ATTR = 'data-elevari-scene';

const { dawn, day, dusk, night } = SCENE_HOURS;

/**
 * Runs in <head> before first paint so server-rendered scenes already show the visitor's local time of day.
 * Keep the expression identical to sceneForHour.
 */
export const sceneInitScript = `(function(){try{var h=new Date().getHours();document.documentElement.setAttribute('${SCENE_ATTR}',h>=${night}||h<${dawn}?'night':h>=${day}&&h<${dusk}?'day':'golden')}catch(e){}})();`;
