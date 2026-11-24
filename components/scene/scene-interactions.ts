import { SCENE_ATTR } from '@/lib/scene/time-of-day';

type Poke = 'fire' | 'sun' | 'moon' | 'stars';

/** Which shapes answer to the pointer, in which scenes, and how far from the shape a hover or a tap still counts. */
const TARGETS: Record<Poke, { scenes: readonly string[]; pad: number; ms: number }> = {
  fire: { scenes: ['golden', 'night'], pad: 24, ms: 1100 },
  moon: { scenes: ['night'], pad: 28, ms: 1600 },
  sun: { scenes: ['day', 'golden'], pad: 28, ms: 1300 },
  stars: { scenes: ['night'], pad: 22, ms: 1600 },
};
const POKES = Object.keys(TARGETS) as Poke[];

const PARALLAX = 6;
const RAY_SWING = 7;
const HOVER_EVERY_MS = 70;
const CONTROLS = 'a, button, input, select, textarea, label, summary, [role="radio"], [role="radiogroup"], [role="listbox"], [role="dialog"], [data-sc-ignore]';

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/**
 * Pointer behaviour of a scene: a gentle parallax for mouse and pen, and (for the hero) the little reactions: the fire
 * flares when hovered or tapped, the sun and the moon swell, the stars sparkle and a shooting star crosses. Everything
 * is decoration, so none of it takes part in the accessibility tree. Returns the function that undoes it.
 */
export function attachSceneInteractions(root: HTMLElement, { hotspots }: { hotspots: boolean }): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const host = root.closest<HTMLElement>('[data-sc-host]') ?? root.parentElement ?? root;
  const layers = Array.from(root.querySelectorAll<HTMLElement>('.sc-l[data-d]'))
    .map((el) => ({ el, depth: Number(el.dataset.d) }))
    .filter(({ depth }) => depth >= 0.3);
  const rays = root.querySelector<SVGElement>('.sc-l[data-l="rays"] > .sc-s');
  const shapes = {
    fire: Array.from(root.querySelectorAll<SVGElement>('[data-h="fire"]')),
    sun: Array.from(root.querySelectorAll<SVGElement>('[data-h="sun"]')),
    moon: Array.from(root.querySelectorAll<SVGElement>('[data-h="moon"]')),
    stars: Array.from(root.querySelectorAll<SVGElement>('[data-h="stars"]')),
  } satisfies Record<Poke, SVGElement[]>;

  let pointer: { x: number; y: number; target: EventTarget | null } | null = null;
  let frame = 0;
  let lastHover = 0;
  let pokeTimer = 0;

  const sceneName = () =>
    root.dataset.scene && root.dataset.scene !== 'auto' ? root.dataset.scene : document.documentElement.getAttribute(SCENE_ATTR) ?? 'golden';
  const quiet = () => reduced.matches || root.dataset.paused === 'true';
  const isControl = (target: EventTarget | null) => target instanceof Element && target.closest(CONTROLS) !== null;

  function shift(nx: number, ny: number) {
    const k = PARALLAX * Math.min(1, root.clientWidth / 1280);
    for (const { el, depth } of layers) el.style.translate = `${(-nx * depth * k).toFixed(1)}px ${(-ny * depth * k * 0.6).toFixed(1)}px`;
    if (rays) rays.style.rotate = `${(nx * RAY_SWING).toFixed(1)}deg`;
  }

  function reset() {
    delete root.dataset.par;
    for (const { el } of layers) el.style.translate = '';
    if (rays) rays.style.rotate = '';
  }

  function hit(x: number, y: number, scale: number): Poke | null {
    const scene = sceneName();
    for (const name of POKES) {
      const target = TARGETS[name];
      if (!target.scenes.includes(scene)) continue;
      const pad = target.pad * scale;
      for (const el of shapes[name]) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return name;
      }
    }
    return null;
  }

  function poke(name: Poke) {
    if (reduced.matches) return;
    if (root.dataset.poke !== name) {
      // Removing and re-adding the attribute restarts the one-shot animations (shooting star, sparkle)
      delete root.dataset.poke;
      void root.offsetWidth;
      root.dataset.poke = name;
    }
    window.clearTimeout(pokeTimer);
    pokeTimer = window.setTimeout(() => delete root.dataset.poke, TARGETS[name].ms);
  }

  function tick() {
    frame = 0;
    if (!pointer || quiet()) return;
    const rect = root.getBoundingClientRect();
    const inside = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
    if (!inside || rect.width === 0) {
      reset();
      delete host.dataset.hot;
      return;
    }
    root.dataset.par = '';
    shift(clamp(((pointer.x - rect.left) / rect.width) * 2 - 1), clamp(((pointer.y - rect.top) / rect.height) * 2 - 1));

    if (!hotspots) return;
    const now = performance.now();
    if (now - lastHover < HOVER_EVERY_MS) return;
    lastHover = now;
    const found = isControl(pointer.target) ? null : hit(pointer.x, pointer.y, 1);
    if (found) {
      host.dataset.hot = '';
      poke(found);
    } else {
      delete host.dataset.hot;
    }
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY, target: event.target };
    schedule();
  };

  const onDown = (event: PointerEvent) => {
    if (!hotspots || quiet() || isControl(event.target)) return;
    const rect = root.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    // Fingers are less precise than a mouse
    const found = hit(event.clientX, event.clientY, event.pointerType === 'touch' ? 1.8 : 1);
    if (found) poke(found);
  };

  const onLeave = () => {
    pointer = null;
    reset();
    delete host.dataset.hot;
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onDown);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('blur', onLeave);
    if (frame) cancelAnimationFrame(frame);
    window.clearTimeout(pokeTimer);
    delete root.dataset.poke;
    delete host.dataset.hot;
    reset();
  };
}
