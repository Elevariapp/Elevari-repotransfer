import { tServer } from '@/lib/i18n-server';

/**
 * Trust cards. Written from the locale files so EN/ES switching actually changes them
 * (this block used to be hardcoded Spanish on an otherwise translated page).
 */
export default function TrustSignals({ language = 'es' }: { language?: string }) {
  const cards = [
    { title: 'trustSecure', body: 'trustSecureDetail' },
    { title: 'trustTransparent', body: 'trustTransparentDetail' },
    { title: 'trustVerified', body: 'trustVerifiedDetail' },
    { title: 'trustSupport', body: 'trustSupportDetail' },
  ] as const;

  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-xl border border-elevari-border p-4">
          <p className="font-semibold">{tServer('Common', card.title, language)}</p>
          <p className="text-elevari-muted">{tServer('Common', card.body, language)}</p>
        </div>
      ))}
    </div>
  );
}
