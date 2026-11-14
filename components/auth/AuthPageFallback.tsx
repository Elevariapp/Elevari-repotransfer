import Logo from '@/components/Logo';
import { AUTH_BACKGROUND_IMAGE } from '@/components/auth/AuthShell';

export default function AuthPageFallback() {
  return (
    <div className="elevari-auth-immersive relative min-h-[100svh]">
      <div className="elevari-auth-immersive-bg" aria-hidden>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${AUTH_BACKGROUND_IMAGE})` }}
        />
        <div className="elevari-auth-immersive-overlay" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <Logo onDark />
        <p className="mt-8 text-sm text-white/75">Cargando…</p>
      </div>
    </div>
  );
}
