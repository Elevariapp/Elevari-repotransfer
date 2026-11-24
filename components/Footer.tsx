import Link from 'next/link';
import Logo from '@/components/Logo';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { whatsappContext } from '@/lib/whatsapp';

const exploreLinks = [
  { href: '/properties', label: 'Colección completa' },
  { href: '/properties/glamping-wana', label: 'Glamping destacado' },
  { href: '/#buscar', label: 'Buscar fechas' },
  { href: '/legal/faq', label: 'Preguntas frecuentes' },
] as const;

const hostLinks = [
  { href: '/host/add-property', label: 'Publicar espacio' },
  { href: '/host', label: 'Panel anfitrión' },
] as const;

const legalLinks = [
  { href: '/legal/privacy', label: 'Privacidad' },
  { href: '/legal/terms', label: 'Términos' },
  { href: '/legal/refund', label: 'Reembolsos' },
  { href: '/legal/account-deletion', label: 'Eliminar mi cuenta' },
  { href: '/legal/content-moderation', label: 'Moderación de contenido' },
  { href: '/legal/contact', label: 'Contacto' },
  { href: '/legal/accessibility', label: 'Accesibilidad' },
] as const;

export default function Footer() {
  return (
    <footer className="elevari-footer mt-20">
      <div className="elevari-footer-glow" aria-hidden />
      <div className="elevari-container relative pb-20 pt-14 lg:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo onDark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">
              Plataforma curada de glamping en Colombia. Reserva con confianza, precios claros y
              experiencias que compiten con los mejores marketplaces del mundo.
            </p>
            <p className="mt-4 text-xs font-medium tracking-wide text-elevari-amber/90">
              Sutatausa · Cucunubá · Sabana de Bogotá
            </p>
            <WhatsAppLink
              tone="onDark"
              label="Escríbenos por WhatsApp"
              message={whatsappContext('/').message}
              className="mt-3 min-h-11 text-[0.9375rem]"
            />
          </div>

          <div className="lg:col-span-2 lg:col-start-6">
            <p className="elevari-footer-heading">Explorar</p>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="elevari-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="elevari-footer-heading">Anfitriones</p>
            <ul className="mt-4 space-y-3">
              {hostLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="elevari-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <WhatsAppLink
                  tone="onDark"
                  label="Soporte WhatsApp"
                  message={whatsappContext('/host').message}
                  className="text-[0.9375rem]"
                />
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="elevari-footer-heading">Legal</p>
            <ul className="mt-4 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="elevari-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/65">
            © {new Date().getFullYear()} Elevari. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/auth/login" className="elevari-footer-link">
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className="elevari-footer-link">
              Crear cuenta
            </Link>
            <span className="text-white/45">·</span>
            <span className="text-white/55">Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
