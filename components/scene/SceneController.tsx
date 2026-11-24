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
 * pointer interactions. It renders only a hidden marker and finds its scene through it.
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
    let cancelLoad = () => {};
    const wantsPointer = interactive || window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (wantsPointer) {
      const load = () => {
        import('./scene-interactions').then((mod) => {
          if (!cancelled) detach = mod.attachSceneInteractions(root, { hotspots: interactive });
        });
      };
      const idle = window as IdleWindow;
      if (idle.requestIdleCallback) {
        const handle = idle.requestIdleCallback(load, { timeout: 1500 });
        cancelLoad = () => idle.cancelIdleCallback?.(handle);
      } else {
        const handle = window.setTimeout(load, 400);
        cancelLoad = () => window.clearTimeout(handle);
      }
    }

    return () => {
      cancelled = true;
      cancelLoad();
      detach?.();
      observer.disconnect();
      document.removeEventListener('visibilitychange', applyPause);
      reduced.removeEventListener('change', applyPause);
    };
  }, [interactive]);

  return <span ref={marker} hidden />;
}
