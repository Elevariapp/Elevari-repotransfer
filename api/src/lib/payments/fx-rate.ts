/**
 * FX rate configuration — pure, dependency-free (testable without Prisma).
 *
 * CO            → COP (charge = display)
 * International → display USD, charge COP (frozen quote)
 */

export interface FxRateSource {
  name: string;
  /** COP per 1 USD */
  copPerUsd: number;
}

/** Configurable rate source. Default: static env rate (ops-controlled). */
export function getCopUsdRate(): FxRateSource {
  const rate = Number(process.env.FX_COP_USD_RATE ?? 4000);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('FX_COP_USD_RATE must be a positive number');
  }
  return { name: 'env:FX_COP_USD_RATE', copPerUsd: rate };
}

export function quoteTtlMinutes(): number {
  const ttl = Number(process.env.FX_QUOTE_TTL_MINUTES ?? 15);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 15;
}
