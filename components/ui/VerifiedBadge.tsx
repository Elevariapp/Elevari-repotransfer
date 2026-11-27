'use client';

import { useI18n } from '@/components/i18n/useI18n';

/**
 * The blue check Airbnb shows next to verified hosts. Only rendered when the API reports
 * `host.verified` (users.id_verified), never as decoration: the badge is a claim about identity.
 */
export default function VerifiedBadge({
  verified,
  withLabel = true,
  className = '',
}: {
  verified: boolean | null | undefined;
  withLabel?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  if (!verified) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-[#0B67E5]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0B67E5] ring-1 ring-[#0B67E5]/25 ${className}`}
      aria-label={t('Common', 'verifiedBadgeAria')}
      title={t('Common', 'verifiedHostDetail')}
      data-testid="verified-badge"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.5l2.6 1.9 3.2-.1 1.1 3 2.6 1.9-1.1 3 1.1 3-2.6 1.9-1.1 3-3.2-.1L12 21.9l-2.6-1.9-3.2.1-1.1-3-2.6-1.9 1.1-3-1.1-3 2.6-1.9 1.1-3 3.2.1L12 2.5z"
          fill="#0B67E5"
        />
        <path d="M8.6 12.2l2.2 2.2 4.6-4.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withLabel && <span>{t('Common', 'verifiedHost')}</span>}
    </span>
  );
}
