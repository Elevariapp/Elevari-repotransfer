'use client';

import { useRef, useSyncExternalStore, type KeyboardEvent, type ReactElement } from 'react';
import { SCENE_LABELS, SCENE_ORDER, type SceneThemeName } from '@/lib/scene/scene-data';
import { chooseScene, currentScene, subscribeScene } from '@/lib/scene/scene-state';
import './scene-switcher.css';

const ARIA: Record<SceneThemeName, string> = {
  day: 'Paisaje de día',
  golden: 'Paisaje de la tarde',
  night: 'Paisaje de noche',
};

const ICONS: Record<SceneThemeName, ReactElement> = {
  day: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <circle cx="10" cy="10" r="3.4" fill="currentColor" stroke="none" />
      <path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4" />
    </svg>
  ),
  golden: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <path d="M5.2 13a4.8 4.8 0 0 1 9.6 0" fill="currentColor" stroke="none" />
      <path d="M2 13.2h16M4.6 16.4h10.8M10 3.2v2M3.9 6.3l1.3 1.3M16.1 6.3l-1.3 1.3" />
    </svg>
  ),
  night: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden>
      <path d="M16.2 12.4A6.8 6.8 0 0 1 7.6 3.8a6.8 6.8 0 1 0 8.6 8.6Z" />
    </svg>
  ),
};

/**
 * Día · Tarde · Noche: lets a visitor preview the three landscapes. The choice lasts for the tab (sessionStorage) and
 * reaches every scene on the page through <html data-elevari-scene>. Which option looks selected is pure CSS on that
 * attribute, so the server-rendered markup never flashes the wrong one; aria-checked follows once the page is live.
 */
export default function SceneSwitcher({ className = '' }: { className?: string }) {
  const scene = useSyncExternalStore(subscribeScene, currentScene, () => null);
  const group = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const from = SCENE_ORDER.indexOf((event.target as HTMLElement).dataset.scene as SceneThemeName);
    let next = -1;
    if (step !== undefined && from >= 0) next = (from + step + SCENE_ORDER.length) % SCENE_ORDER.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = SCENE_ORDER.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const name = SCENE_ORDER[next];
    chooseScene(name);
    group.current?.querySelector<HTMLElement>(`[data-scene="${name}"]`)?.focus();
  };

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label="Momento del día del paisaje"
      className={`sc-sw ${className}`.trim()}
      onKeyDown={onKeyDown}
    >
      {SCENE_ORDER.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={scene === name}
          aria-label={ARIA[name]}
          tabIndex={scene === null || scene === name ? 0 : -1}
          data-scene={name}
          className="sc-sw__opt"
          onClick={() => chooseScene(name)}
        >
          {ICONS[name]}
          <span>{SCENE_LABELS[name]}</span>
        </button>
      ))}
    </div>
  );
}
