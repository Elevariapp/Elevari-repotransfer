'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * CinematicHeroBackground
 *
 * Dynamic cinematic hero/background section for the booking area and other
 * main pages across the platform:
 *   - Multiple image layers (mountains, rivers, people at glampings) with
 *     independent parallax drift speeds.
 *   - Slow "ken burns" zoom across the whole background.
 *   - CSS particle overlay (floating motes) — no canvas, performant.
 *   - Amber gradient overlay blended with brand colors (#D97706 premium amber).
 *   - Dark readability overlay so hero text stays legible.
 *   - Time-of-day detection (day / afternoon / night) applied as
 *     data-time="day|afternoon|night" on the root container.
 *   - Night mode adds animated stars and a subtle moon glow.
 *   - Respects prefers-reduced-motion (animations disabled).
 *
 * Usage:
 *   <CinematicHeroBackground className="...">
 *     <h1 className="...">Your hero title</h1>
 *   </CinematicHeroBackground>
 */

type TimeOfDay = 'day' | 'afternoon' | 'night';

function detectTimeOfDay(): TimeOfDay {
  if (typeof window === 'undefined') return 'day';
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'day';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

interface CinematicHeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  /** Optional override for time of day (useful for previews/tests) */
  timeOfDayOverride?: TimeOfDay;
}

export default function CinematicHeroBackground({
  className = '',
  children,
  timeOfDayOverride,
}: CinematicHeroBackgroundProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(
    () => timeOfDayOverride ?? detectTimeOfDay()
  );
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeOfDayOverride) return;

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
  }, [timeOfDayOverride]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parallax offset based on mouse position (subtle, only when not reduced motion).
  const parallaxX = prefersReducedMotion ? 0 : mousePos.x * 12 - 6;
  const parallaxY = prefersReducedMotion ? 0 : mousePos.y * 12 - 6;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      data-time={timeOfDay}
      aria-hidden="true"
      style={{ minHeight: '100vh', width: '100%' }}
    >
      {/* Layer 1 — Mountains / distant landscape (slowest parallax) */}
      <div
        className="elevari-hero-layer elevari-hero-layer--mountains"
        style={{
          transform: `translate(${parallaxX * 0.25}px, ${parallaxY * 0.25}px)`,
        }}
      />

      {/* Layer 2 — Rivers / water (medium parallax) */}
      <div
        className="elevari-hero-layer elevari-hero-layer--rivers"
        style={{
          transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)`,
        }}
      />

      {/* Layer 3 — People at glampings / foreground (fastest parallax) */}
      <div
        className="elevari-hero-layer elevari-hero-layer--people"
        style={{
          transform: `translate(${parallaxX * 0.75}px, ${parallaxY * 0.75}px)`,
        }}
      />

      {/* Slow ken-burns zoom across the entire background */}
      <div className="elevari-hero-kenburns" />

      {/* Amber gradient overlay blended with brand colors (premium amber #D97706) */}
      <div className="elevari-hero-amber-overlay" />

      {/* Dark readability overlay so hero text stays legible */}
      <div className="elevari-hero-dark-overlay" />

      {/* CSS particle overlay — floating motes */}
      <div className="elevari-hero-particles">
        {[...Array(26)].map((_, i) => (
          <div
            key={i}
            className="elevari-hero-particle"
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
        <div className="elevari-hero-stars">
          {[...Array(45)].map((_, i) => (
            <div
              key={i}
              className="elevari-hero-star"
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
      {timeOfDay === 'night' && <div className="elevari-hero-moon" />}

      {/* Content wrapper (children render on top, z-40) */}
      <div className={`relative z-40 ${className}`}>{children}</div>
    </div>
  );
}
