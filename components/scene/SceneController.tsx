'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { startSceneSync } from '@/lib/scene/scene-state';

// requestIdleCallback is missing in Safari
type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Brings a server-rendered <ScenicBackground> to life. It keeps the scene current (time of day, site theme, the
 * visitor's choice), pauses every animation while the scene is off screen or the tab is hidden, and lazily loads the
 * pointer interactions and, for the full scenes, the quality governor (lib/scene/scene-quality.ts). It renders only a
 * hidden marker and finds its scene through it.
 */
export default function SceneController({ interactive = false }: { interactive?: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);

  // Before paint, so a soft navigation never flashes a stale scene
  useLayoutEffect(() => {
    const root = marker.current?.closest<HTMLElement>('.sc');
    if (root?.dataset.scene === 'auto') startSceneSync();
  }, []);

  useEffect(() => {
    const root = marker.current?.closest<HTMLElement>('.sc');
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let onScreen = true;
    const applyPause = () => {
      root.dataset.paused = String(!onScreen || document.hidden || reduced.matches);
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      applyPause();
    });
    observer.observe(root);
    document.addEventListener('visibilitychange', applyPause);
    reduced.addEventListener('change', applyPause);
    applyPause();

    // Mouse and pen get the parallax; touch only gets the taps of the interactive hero. The code loads once idle.
    let detach: (() => void) | undefined;
    let cancelled = false;
    const cancels: Array<() => void> = [];
    const whenIdle = (load: () => void) => {
      const idle = window as IdleWindow;
      if (idle.requestIdleCallback) {
        const handle = idle.requestIdleCallback(load, { timeout: 1500 });
        cancels.push(() => idle.cancelIdleCallback?.(handle));
      } else {
        const handle = window.setTimeout(load, 400);
        cancels.push(() => window.clearTimeout(handle));
      }
    };
    const wantsPointer = interactive || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (wantsPointer) {
      whenIdle(() => {
        import('./scene-interactions').then((mod) => {
          if (!cancelled) detach = mod.attachSceneInteractions(root, { hotspots: interactive });
        });
      });
    }
    // The governor measures the real frame rate of the full scenes (the strips are too small to matter)
    if (root.dataset.variant === 'full') {
      whenIdle(() => {
        import('@/lib/scene/scene-quality').then((mod) => {
          if (!cancelled) mod.startSceneQuality(root);
        });
      });
    }

    return () => {
      cancelled = true;
      cancels.forEach((cancel) => cancel());
      detach?.();
      observer.disconnect();
      document.removeEventListener('visibilitychange', applyPause);
      reduced.removeEventListener('change', applyPause);
    };
  }, [interactive]);

  return <span ref={marker} hidden />;
}
