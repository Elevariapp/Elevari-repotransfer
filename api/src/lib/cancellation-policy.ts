/** Default Waná policy: moderate — aligns with knowledge/policies.txt after update. */
export type CancellationTier = 'flexible' | 'moderate' | 'strict';

export interface RefundCalculation {
  eligible: boolean;
  refund_percent: number;
  refund_amount: number;
  total_paid: number;
  reason: string;
  policy: CancellationTier;
}

function daysUntilCheckIn(checkIn: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const checkInUtc = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((checkInUtc - nowUtc) / msPerDay);
}

function getTotalPaid(fees: unknown): number {
  if (!fees || typeof fees !== 'object') return 0;
  const total = (fees as { total_charge_to_guest?: number }).total_charge_to_guest;
  return Number(total ?? 0);
}

export function calculateCancellationRefund(params: {
  checkIn: Date;
  feesBreakdown: unknown;
  tier?: CancellationTier;
  now?: Date;
}): RefundCalculation {
  const tier = params.tier ?? 'moderate';
  const now = params.now ?? new Date();
  const totalPaid = getTotalPaid(params.feesBreakdown);
  const days = daysUntilCheckIn(params.checkIn, now);

  if (tier === 'flexible') {
    if (days >= 1) {
      return {
        eligible: true,
        refund_percent: 100,
        refund_amount: totalPaid,
        total_paid: totalPaid,
        reason: 'Cancelación con al menos 24 h de antelación — reembolso completo.',
        policy: tier,
      };
    }
    return {
      eligible: false,
      refund_percent: 0,
      refund_amount: 0,
      total_paid: totalPaid,
      reason: 'Cancelación el mismo día del check-in — sin reembolso (flexible).',
      policy: tier,
    };
  }

  if (tier === 'strict') {
    return {
      eligible: false,
      refund_percent: 0,
      refund_amount: 0,
      total_paid: totalPaid,
      reason: 'Política estricta — no hay reembolso tras confirmar el pago.',
      policy: tier,
    };
  }

  // moderate (default)
  if (days >= 5) {
    return {
      eligible: true,
      refund_percent: 100,
      refund_amount: totalPaid,
      total_paid: totalPaid,
      reason: 'Cancelación con 5 o más días antes del check-in — reembolso completo.',
      policy: tier,
    };
  }
  if (days >= 2) {
    const amount = Math.round(totalPaid * 0.5);
    return {
      eligible: true,
      refund_percent: 50,
      refund_amount: amount,
      total_paid: totalPaid,
      reason: 'Cancelación entre 2 y 4 días antes del check-in — reembolso del 50%.',
      policy: tier,
    };
  }
  return {
    eligible: false,
    refund_percent: 0,
    refund_amount: 0,
    total_paid: totalPaid,
    reason: 'Cancelación con menos de 48 h antes del check-in — sin reembolso.',
    policy: tier,
  };
}
