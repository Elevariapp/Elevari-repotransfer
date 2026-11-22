import { cx } from '@/lib/cx';

export type PriceBreakdownFees = {
  price_per_night: number;
  nights: number;
  subtotal: number;
  platform_fee_amount: number;
  total_charge_to_guest: number;
};

/**
 * Canonical price breakdown: base + "Tarifa de Servicio Elevari" = total.
 * No tax lines by design (MVP pricing model, see ROADMAP Phase 2).
 */
export default function PriceBreakdown({
  fees,
  format,
  className,
  totalLabel = 'Total',
}: {
  fees: PriceBreakdownFees;
  format: (amount: number) => string;
  className?: string;
  totalLabel?: string;
}) {
  return (
    <dl className={cx('space-y-2.5 text-sm', className)}>
      <div className="flex justify-between gap-4 text-elevari-slate">
        <dt>
          {format(fees.price_per_night)} × {fees.nights} {fees.nights === 1 ? 'noche' : 'noches'}
        </dt>
        <dd>{format(fees.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4 text-elevari-muted">
        <dt>Tarifa de Servicio Elevari</dt>
        <dd>{format(fees.platform_fee_amount)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-elevari-border pt-3 text-base font-semibold text-elevari-ink">
        <dt>{totalLabel}</dt>
        <dd>{format(fees.total_charge_to_guest)}</dd>
      </div>
    </dl>
  );
}
