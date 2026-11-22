import Logo from '@/components/Logo';
import CinematicAuthBackground from './CinematicAuthBackground';

export default function AuthPageFallback() {
  return (
    <div className="elevari-auth-immersive relative min-h-[100svh]">
      <CinematicAuthBackground />
      <div className="elevari-auth-immersive-overlay" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <Logo onDark />
        <p className="mt-8 text-sm text-white/75">Cargando…</p>
      </div>
    </div>
  );
}
