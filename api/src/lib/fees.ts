/**
 * Waná pricing engine — MVP (Phase 2).
 *
 * Single pricing model. No active tax engine. No INC. No Parafiscal.
 * No VAT line shown to customers. No tax breakdown shown to customers.
 *
 *   BASE_AMOUNT + PLATFORM_FEE = TOTAL_AMOUNT
 *
 * Platform fee is configurable via PLATFORM_FEE_PERCENT (default 15%).
 * Guest-facing label: "Tarifa de Servicio Elevari".
 *
 * Persisted per booking in fees_breakdown:
 *   base_amount, platform_fee_percent, platform_fee_amount, total_amount
 * Keep in sync with web `lib/tax-logic.ts`.
 */
export interface WanaFees {
  /** Base: price_per_night × nights */
  base_amount: number;
  /** Configurable percent (default 15) */
  platform_fee_percent: number;
  platform_fee_amount: number;
  /** base_amount + platform_fee_amount — authoritative charge */
  total_amount: number;
  /** Alias of total_amount for legacy readers (payments, marketing, cancellation) */
  total_charge_to_guest: number;
  /** base_amount − platform_fee_amount */
  host_receives: number;
  /** Alias of base_amount for legacy readers (widget, emails, alegra) */
  subtotal: number;
  nights: number;
  price_per_night: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Platform fee percent — configurable, default 15%. */
export function getPlatformFeePercent(): number {
  const raw = Number(process.env.PLATFORM_FEE_PERCENT ?? 15);
  if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
    throw new Error('PLATFORM_FEE_PERCENT must be a number between 0 and 100');
  }
  return raw;
}

/** Core pricing math from base amount (price × nights). */
export function calculateWanaFeesFromBase(
  baseAmount: number,
  feePercent: number = getPlatformFeePercent(),
): Omit<WanaFees, 'nights' | 'price_per_night'> {
  const platform_fee_amount = baseAmount * (feePercent / 100);
  const total_amount = baseAmount + platform_fee_amount;
  const host_receives = baseAmount - platform_fee_amount;

  return {
    base_amount: round(baseAmount),
    platform_fee_percent: feePercent,
    platform_fee_amount: round(platform_fee_amount),
    total_amount: round(total_amount),
    total_charge_to_guest: round(total_amount),
    host_receives: round(host_receives),
    subtotal: round(baseAmount),
  };
}

export function calculateWanaFees(pricePerNight: number, nights: number): WanaFees {
  const baseAmount = pricePerNight * nights;
  return {
    ...calculateWanaFeesFromBase(baseAmount),
    nights,
    price_per_night: pricePerNight,
  };
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}
