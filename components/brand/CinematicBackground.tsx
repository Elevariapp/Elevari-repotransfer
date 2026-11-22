import React from 'react';

interface CinematicBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  className = '',
  children,
}) => {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: '100vh' }}
    >
      {/* Background image layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url("/images/registration-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      {/* Amber gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Parallax mountain layer */}
      <div
        className="absolute inset-0 z-20"
        style={{
          backgroundImage:
            'url("/images/mountains-overlay.svg")',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat',
          opacity: '0.6',
        }}
        aria-hidden="true"
      />

      {/* Particle overlay */}
      <div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(245, 158, 11, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* Content wrapper with dark overlay for readability */}
      <div className={`relative z-40 ${className}`}>
        {children}
      </div>

      <style jsx>{`
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        @keyframes parallax {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .animate-slow-zoom {
          animation: slowZoom 20s ease-in-out infinite alternate;
        }
        .animate-parallax {
          animation: parallax 10s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-slow-zoom,
          .animate-parallax,
          .animate-float {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CinematicBackground;