'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { SCENE_ATTR, sceneForHour } from '@/lib/scene/time-of-day';

const SYNC_MS = 60_000;
const EASE = 0.08;

/**
 * Brings a server-rendered <ScenicBackground> to life: keeps the time of day current, drives the pointer parallax and
 * pauses everything while the scene is off screen. It renders only a hidden marker and finds its scene through it.
 */
export default function SceneController() {
  const marker = useRef<HTMLSpanElement>(null);

  // Before paint, so a soft navigation never flashes a stale time of day
  useLayoutEffect(() => {
    const root = marker.current?.closest<HTMLElement>('.sc');
    if (!root || root.dataset.scene !== 'auto') return;
    const sync = () => {
      const scene = sceneForHour(new Date().getHours());
      if (document.documentElement.getAttribute(SCENE_ATTR) !== scene) {
        document.documentElement.setAttribute(SCENE_ATTR, scene);
      }
    };
    sync();
    const timer = window.setInterval(sync, SYNC_MS);
    return () => window.clearInterval(timer);
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

    // Parallax follows mouse and pen only; touch scrolls the page and would fight the gesture
    let target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let frame = 0;
    const tick = () => {
      current = { x: current.x + (target.x - current.x) * EASE, y: current.y + (target.y - current.y) * EASE };
      const settled = Math.abs(target.x - current.x) < 0.002 && Math.abs(target.y - current.y) < 0.002;
      if (settled) current = target;
      root.style.setProperty('--sc-px', current.x.toFixed(3));
      root.style.setProperty('--sc-py', current.y.toFixed(3));
      frame = settled ? 0 : requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || reduced.matches || root.dataset.paused === 'true') return;
      const rect = root.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      // Smaller screens get a calmer drift
      const amplitude = Math.min(1, rect.width / 1280);
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      target = { x: Math.max(-1, Math.min(1, x)) * amplitude, y: Math.max(-1, Math.min(1, y)) * amplitude };
      root.style.setProperty('--sc-gx', `${event.clientX - rect.left}px`);
      root.style.setProperty('--sc-gy', `${event.clientY - rect.top}px`);
      root.dataset.pointer = 'true';
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      target = { x: 0, y: 0 };
      delete root.dataset.pointer;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', applyPause);
      reduced.removeEventListener('change', applyPause);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={marker} hidden />;
}
