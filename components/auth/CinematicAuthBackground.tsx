'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * CinematicAuthBackground
 *
 * Replaces the static registration/login background with a layered, animated
 * cinematic hero section:
 *   - Multiple image layers (mountains, rivers, people at glampings) with
 *     independent parallax drift speeds.
 *   - Slow "ken burns" zoom across the whole background.
 *   - CSS particle overlay (floating motes) — no canvas, performant.
 *   - Amber gradient overlay blended with brand colors.
 *   - Dark readability overlay so the white auth form stays legible.
 *   - Time-of-day detection (day / afternoon / night) applied as
 *     data-time="day|afternoon|night" on the root container.
 *   - Night mode adds animated stars and a subtle moon glow.
 *   - Respects prefers-reduced-motion (animations disabled).
 */

type TimeOfDay = 'day' | 'afternoon' | 'night';

function detectTimeOfDay(): TimeOfDay {
  if (typeof window === 'undefined') return 'day';
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'day';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

export default function CinematicAuthBackground() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeOfDay(detectTimeOfDay());

    // Re-evaluate at hour boundaries so the background shifts naturally.
    const timer = setInterval(() => setTimeOfDay(detectTimeOfDay()), 60_000);

    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parallax offset based on mouse position (subtle, only when not reduced motion).
  const parallaxX = prefersReducedMotion ? 0 : mousePos.x * 12 - 6;
  const parallaxY = prefersReducedMotion ? 0 : mousePos.y * 12 - 6;

  return (
    <div
      ref={containerRef}
      className="elevari-auth-cinematic-bg"
      data-time={timeOfDay}
      aria-hidden="true"
    >
      {/* Layer 1 — Mountains / distant landscape (slowest parallax) */}
      <div
        className="elevari-auth-layer elevari-auth-layer--mountains"
        style={{
          transform: `translate(${parallaxX * 0.25}px, ${parallaxY * 0.25}px)`,
        }}
      />

      {/* Layer 2 — Rivers / water (medium parallax) */}
      <div
        className="elevari-auth-layer elevari-auth-layer--rivers"
        style={{
          transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)`,
        }}
      />

      {/* Layer 3 — People at glampings / foreground (fastest parallax) */}
      <div
        className="elevari-auth-layer elevari-auth-layer--people"
        style={{
          transform: `translate(${parallaxX * 0.75}px, ${parallaxY * 0.75}px)`,
        }}
      />

      {/* Slow ken-burns zoom across the entire background */}
      <div className="elevari-auth-kenburns" />

      {/* Amber gradient overlay blended with brand colors */}
      <div className="elevari-auth-amber-overlay" />

      {/* Dark readability overlay for the auth form */}
      <div className="elevari-auth-dark-overlay" />

      {/* CSS particle overlay — floating motes */}
      <div className="elevari-auth-particles">
        {[...Array(22)].map((_, i) => (
          <div
            key={i}
            className="elevari-auth-particle"
            style={{
              left: `${10 + (i * 13) % 90}%`,
              top: `${10 + (i * 17) % 80}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${14 + (i * 3)}s`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
            }}
          />
        ))}
      </div>

      {/* Night-only: animated stars */}
      {timeOfDay === 'night' && (
        <div className="elevari-auth-stars">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="elevari-auth-star"
              style={{
                left: `${10 + (i * 11) % 85}%`,
                top: `${5 + (i * 13) % 40}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i % 4)}s`,
                width: `${1 + (i % 2)}px`,
                height: `${1 + (i % 2)}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Night-only: subtle moon glow */}
      {timeOfDay === 'night' && (
        <div className="elevari-auth-moon" />
      )}
    </div>
  );
}
