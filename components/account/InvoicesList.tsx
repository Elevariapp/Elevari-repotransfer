'use client';

import Link from 'next/link';
import { ListError, ListNote, ListSkeleton } from '@/components/account/ListStates';
import { useBilling } from '@/components/account/useBilling';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatInstantDate, formatMoney } from '@/lib/format';

export default function InvoicesList() {
  const { state, reload } = useBilling();

  if (state.status === 'loading') return <ListSkeleton />;
  if (state.status === 'error') return <ListError message={state.message} onRetry={reload} />;

  if (state.invoices.length === 0) {
    return (
      <EmptyState
        emoji="🧾"
        title="Aún no tienes facturas"
        description="Emitimos una factura electrónica por cada reserva pagada. La verás aquí en cuanto esté lista."
        actionLabel="Ver mis pagos"
        actionHref="/account/payments"
      />
    );
  }

  return (
    <>
      <ListNote>
        La factura electrónica se emite después de confirmar el pago. Si alguna sigue en proceso o necesitas una
        copia,{' '}
        <Link href="/legal/contact" className="elevari-link">
          escríbenos
        </Link>
        .
      </ListNote>
      <ul className="space-y-3">
        {state.invoices.map((invoice) => (
          <li key={invoice.id} className="elevari-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-elevari-slate">
                  {invoice.status === 'issued' && invoice.invoice_number
                    ? `Factura ${invoice.invoice_number}`
                    : 'Factura electrónica'}
                </p>
                <p className="mt-0.5 truncate text-sm text-elevari-muted">{invoice.property_title}</p>
                <p className="text-sm text-elevari-muted">{formatInstantDate(invoice.created_at)}</p>
              </div>
              {invoice.total != null && (
                <p className="shrink-0 font-semibold text-elevari-slate">
                  {formatMoney(invoice.total, invoice.currency)}
                </p>
              )}
            </div>
            <div className="mt-3">
              <Badge tone={invoice.status === 'issued' ? 'success' : 'warning'}>
                {invoice.status === 'issued' ? 'Emitida' : 'En proceso'}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
