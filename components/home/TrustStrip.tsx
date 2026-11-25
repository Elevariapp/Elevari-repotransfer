import { tServer } from '@/lib/i18n-server';

const items = [
  { labelKey: 'trustVerified', detailKey: 'trustVerifiedDetail' },
  { labelKey: 'trustTransparent', detailKey: 'trustTransparentDetail' },
  { labelKey: 'trustSecure', detailKey: 'trustSecureDetail' },
  { labelKey: 'trustSupport', detailKey: 'trustSupportDetail' },
];

export default function TrustStrip() {
  return (
    <section aria-label={tServer('Common', 'trustAria')} className="border-y border-elevari-border/80 bg-elevari-ivory">
      <div className="elevari-container py-6 sm:py-8">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item) => (
            <li
              key={item.labelKey}
              className="rounded-2xl border border-elevari-border/80 bg-elevari-surface/90 px-3 py-4 text-center shadow-[var(--elevari-shadow-soft)] sm:px-4"
            >
              <p className="text-[11px] font-bold uppercase leading-snug tracking-[0.12em] text-elevari-slate sm:text-xs sm:tracking-[0.15em]">
                {tServer('Common', item.labelKey)}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-elevari-muted">{tServer('Common', item.detailKey)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
