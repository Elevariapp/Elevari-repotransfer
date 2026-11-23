import Logo from '@/components/Logo';
import ScenicBackground from '@/components/scene/ScenicBackground';

export default function AuthPageFallback() {
  return (
    <div className="relative min-h-[100svh]">
      <ScenicBackground idPrefix="auth-fb" scrim="auth" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <Logo onDark />
        <p className="mt-8 text-sm text-white/75">Cargando…</p>
      </div>
    </div>
  );
}
