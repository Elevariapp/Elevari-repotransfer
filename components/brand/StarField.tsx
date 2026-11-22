'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * StarField
 *
 * Reusable animated star-field background effect for main pages across the
 * platform (login, registration, booking hero, landing, etc.).
 *
 * - Stars twinkle at different rates and positions.
 * - Optional slow drift (parallax) based on mouse position.
 * - Respects prefers-reduced-motion.
 *
 * Props:
 *   count        — number of stars (default 60)
 *   opacity      — base star opacity (default 0.6)
 *   sizeRange    — [min, max] star size in px (default [1, 2])
 *   drift        — enable mouse parallax drift (default true)
 *   className    — extra Tailwind classes
 *   style        — extra inline styles
 */

interface StarFieldProps {
  count?: number;
  opacity?: number;
  sizeRange?: [number, number];
  drift?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function StarField({
  count = 60,
  opacity = 0.6,
  sizeRange = [1, 2],
  drift = true,
  className = '',
  style,
}: StarFieldProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Generate deterministic star positions so they don't shift on re-render.
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${10 + (i * 17) % 85}%`,
    top: `${5 + (i * 13) % 45}%`,
    size: `${sizeRange[0] + (i % (sizeRange[1] - sizeRange[0] + 1))}px`,
    delay: `${i * 0.4}s`,
    duration: `${2.5 + (i % 6)}s`,
  }));

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

  const driftX = prefersReducedMotion || !drift ? 0 : mousePos.x * 10 - 5;
  const driftY = prefersReducedMotion || !drift ? 0 : mousePos.y * 10 - 5;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${className}`}
      style={style}
      aria-hidden="true"
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className="elevari-star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: String(opacity),
            animationDelay: star.delay,
            animationDuration: star.duration,
            transform: `translate(${driftX}px, ${driftY}px)`,
          }}
        />
      ))}
      <style jsx>{`
        .elevari-star {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          animation: starTwinkle ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes starTwinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .elevari-star {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
