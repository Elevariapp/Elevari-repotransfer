'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * MovingBackground
 *
 * Reusable slow-moving background layer for main pages across the platform.
 * Applies a gentle "ken burns" scale animation plus optional mouse parallax.
 *
 * Props:
 *   src          — image URL (required)
 *   alt          — alt text (aria-hidden decorative)
 *   className    — extra Tailwind classes
 *   style        — extra inline styles
 *   speed        — animation duration in seconds (default 20)
 *   drift        — enable mouse parallax drift (default true)
 *   overlay      — optional CSS overlay string (e.g. a gradient)
 */

interface MovingBackgroundProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
  drift?: boolean;
  overlay?: string;
}

export default function MovingBackground({
  src,
  alt = '',
  className = '',
  style,
  speed = 20,
  drift = true,
  overlay,
}: MovingBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!drift || prefersReducedMotion) return;

    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [drift, prefersReducedMotion]);

  const driftX = prefersReducedMotion || !drift ? 0 : mousePos.x * 8 - 4;
  const driftY = prefersReducedMotion || !drift ? 0 : mousePos.y * 8 - 4;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 ${className}`}
      style={{
        backgroundImage: overlay ? `url(${src}), ${overlay}` : `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        willChange: 'transform',
        ...style,
      }}
      aria-hidden="true"
    >
      <style jsx>{`
        :host {
          animation: heroKenburns ${speed}s ease-in-out infinite alternate;
        }
        @keyframes heroKenburns {
          from {
            transform: scale(1) translate(${driftX}px, ${driftY}px);
          }
          to {
            transform: scale(1.12) translate(${driftX * 1.5}px, ${driftY * 1.5}px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :host {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
