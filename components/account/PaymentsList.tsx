'use client';

import { ListError, ListNote, ListSkeleton } from '@/components/account/ListStates';
import { useBilling } from '@/components/account/useBilling';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatInstantDate, formatMoney } from '@/lib/format';

type Tone = Parameters<typeof Badge>[0]['tone'];

const STATUS: Record<string, { label: string; tone: Tone }> = {
  succeeded: { label: 'Pagado', tone: 'success' },
  processing: { label: 'En proceso', tone: 'warning' },
  failed: { label: 'No se completó', tone: 'error' },
  partially_refunded: { label: 'Reembolso parcial', tone: 'accent' },
  refunded: { label: 'Reembolsado', tone: 'neutral' },
};

export default function PaymentsList() {
  const { state, reload } = useBilling();

  if (state.status === 'loading') return <ListSkeleton />;
  if (state.status === 'error') return <ListError message={state.message} onRetry={reload} />;

  if (state.payments.length === 0) {
    return (
      <EmptyState
        emoji="💳"
        title="Aún no tienes pagos"
        description="Cuando reserves y pagues una estadía, el pago y cualquier reembolso aparecerán aquí."
        actionLabel="Explorar espacios"
        actionHref="/properties"
      />
    );
  }

  return (
    <>
      <ListNote>
        Los pagos se procesan de forma segura con Wompi. Los reembolsos pueden tardar unos días hábiles en
        reflejarse en tu medio de pago.
      </ListNote>
      <ul className="space-y-3">
        {state.payments.map((payment) => {
          const status = STATUS[payment.status] ?? { label: payment.status, tone: 'neutral' as Tone };
          return (
            <li key={payment.id} className="elevari-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-elevari-slate">{payment.property_title}</p>
                  <p className="mt-0.5 text-sm text-elevari-muted">{formatInstantDate(payment.created_at)}</p>
                </div>
                <p className="shrink-0 font-semibold text-elevari-slate">
                  {formatMoney(payment.amount, payment.currency)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={status.tone}>{status.label}</Badge>
                {payment.refunded_amount > 0 && (
                  <span className="text-sm text-elevari-muted">
                    Reembolsado: {formatMoney(payment.refunded_amount, payment.currency)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
