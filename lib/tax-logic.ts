/**
 * Pricing engine — Elevari (Colombia). Mirror of api/src/lib/fees.ts.
 *
 * MVP single pricing model — no tax engine:
 *   BASE_AMOUNT + PLATFORM_FEE (15%, configurable) = TOTAL_AMOUNT
 * Guest-facing label: "Tarifa de Servicio Elevari".
 */

export interface WanaFees {
  base_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  total_amount: number;
  /** Alias of total_amount for legacy readers */
  total_charge_to_guest: number;
  host_receives: number;
  /** Alias of base_amount for legacy readers */
  subtotal: number;
}

export function calculateWanaFees(baseAmount: number, feePercent: number = 15): WanaFees {
  const platform_fee_amount = baseAmount * (feePercent / 100);
  const total_amount = baseAmount + platform_fee_amount;

  return {
    base_amount: baseAmount,
    platform_fee_percent: feePercent,
    platform_fee_amount: Math.round(platform_fee_amount * 100) / 100,
    total_amount: Math.round(total_amount * 100) / 100,
    total_charge_to_guest: Math.round(total_amount * 100) / 100,
    host_receives: Math.round((baseAmount - platform_fee_amount) * 100) / 100,
    subtotal: baseAmount,
  };
}

/**
 * Audit log entry for compliance tracking
 */
export interface AuditLog {
  booking_id: string;
  transaction_id: string;
  fees_breakdown: WanaFees;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  method: 'alegra' | 'backup';
}
