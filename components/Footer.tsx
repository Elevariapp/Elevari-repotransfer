'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import WhatsAppLink from '@/components/whatsapp/WhatsAppLink';
import { useI18n } from '@/components/i18n/useI18n';
import { whatsappContext } from '@/lib/whatsapp';

export default function Footer() {
  const { t } = useI18n();

  const exploreLinks = [
    { href: '/properties', label: t('Common', 'footer.linkCollection') },
    { href: '/properties/glamping-wana', label: t('Common', 'footer.linkFeatured') },
    { href: '/#buscar', label: t('Common', 'footer.linkSearchDates') },
    { href: '/legal/faq', label: t('Common', 'legal.faq') },
    { href: '/app', label: t('Common', 'footer.linkInstallApp') },
  ];

  const hostLinks = [
    { href: '/host/add-property', label: t('Common', 'footer.linkPublish') },
    { href: '/host', label: t('Common', 'footer.linkHostPanel') },
  ];

  const legalLinks = [
    { href: '/legal/privacy', label: t('Common', 'legal.privacy') },
    { href: '/legal/terms', label: t('Common', 'legal.terms') },
    { href: '/legal/refund', label: t('Common', 'legal.refund') },
    { href: '/legal/account-deletion', label: t('Common', 'legal.accountDeletion') },
    { href: '/legal/content-moderation', label: t('Common', 'legal.contentModeration') },
    { href: '/legal/contact', label: t('Common', 'legal.contact') },
    { href: '/legal/accessibility', label: t('Common', 'legal.accessibility') },
  ];

  return (
    <footer className="elevari-footer mt-20">
      <div className="elevari-footer-glow" aria-hidden />
      <div className="elevari-container relative pb-20 pt-14 lg:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo onDark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/80">
              {t('Common', 'footer.tagline')}
            </p>
            <p className="mt-4 text-xs font-medium tracking-wide text-elevari-amber/90">
              {t('Common', 'footer.locations')}
            </p>
            <WhatsAppLink
              tone="onDark"
              label={t('Common', 'footer.writeWhatsapp')}
              message={whatsappContext('/').message}
              className="mt-3 min-h-11 text-[0.9375rem]"
            />
          </div>

          <div className="lg:col-span-2 lg:col-start-6">
            <p className="elevari-footer-heading">{t('Common', 'footer.explore')}</p>
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
            <p className="elevari-footer-heading">{t('Common', 'footer.hosts')}</p>
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
                  label={t('Common', 'footer.support')}
                  message={whatsappContext('/host').message}
                  className="text-[0.9375rem]"
                />
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="elevari-footer-heading">{t('Common', 'footer.moderation')}</p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="space-y-1">
                <p className="font-medium text-white">{t('Common', 'footer.photosVideos')}</p>
                <p className="text-xs text-white/60">{t('Common', 'footer.photosVideosDetail')}</p>
              </li>
              <li className="space-y-1">
                <p className="font-medium text-white">{t('Common', 'footer.descriptions')}</p>
                <p className="text-xs text-white/60">{t('Common', 'footer.descriptionsDetail')}</p>
              </li>
              <li>
                <Link href="/legal/content-moderation" className="elevari-footer-link text-xs">
                  {t('Common', 'footer.fullPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="elevari-footer-heading">{t('Common', 'footer.legalHeading')}</p>
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
            © {new Date().getFullYear()} Elevari. {t('Common', 'footer.rights')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <Link href="/auth/login" className="elevari-footer-link">
              {t('Common', 'nav.login')}
            </Link>
            <Link href="/auth/register" className="elevari-footer-link">
              {t('Common', 'nav.register')}
            </Link>
            <span className="text-white/45">·</span>
            <span className="text-white/55">{t('Common', 'footer.country')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
