/**
 * FX engine — Phase 2.
 *
 * CO            → COP (charge = display)
 * International → display USD, charge COP (frozen quote)
 *
 * Quotes are persisted in `fx_quotes`, locked at creation, and expire
 * after FX_QUOTE_TTL_MINUTES (default 15). The charged COP amount is
 * authoritative; the USD display amount is informational only.
 */
import { randomUUID } from 'node:crypto';
import type { FxQuote } from '@prisma/client';
import { prisma } from '../prisma.js';
import { assertMinorUnits, toMinorUnits } from './money.js';

export interface FxRateSource {
  name: string;
  /** COP per 1 USD */
  copPerUsd: number;
}

/** Configurable rate source. Default: static env rate (ops-controlled). */
export function getCopUsdRate(): FxRateSource {
  const rate = Number(process.env.FX_COP_USD_RATE ?? process.env.STRIPE_COP_USD_RATE ?? 4000);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('FX_COP_USD_RATE must be a positive number');
  }
  return { name: 'env:FX_COP_USD_RATE', copPerUsd: rate };
}

export function quoteTtlMinutes(): number {
  const ttl = Number(process.env.FX_QUOTE_TTL_MINUTES ?? 15);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 15;
}

/**
 * Create and persist a locked FX quote for a booking.
 * @param chargeAmountCopMajor Total charge to guest in COP major units (from fees breakdown).
 * @param displayCurrency 'COP' for domestic, 'USD' for international display.
 */
export async function createFxQuote(params: {
  bookingId: string;
  chargeAmountCopMajor: number;
  displayCurrency: string;
}): Promise<FxQuote> {
  const { bookingId, chargeAmountCopMajor, displayCurrency } = params;
  const chargeAmountMinor = toMinorUnits(chargeAmountCopMajor);
  assertMinorUnits(chargeAmountMinor, 'charge_amount_minor');

  const display = displayCurrency.toUpperCase();
  let rate = 1;
  let rateSource = 'identity:COP';
  let displayAmountMinor = chargeAmountMinor;

  if (display === 'USD') {
    const source = getCopUsdRate();
    rate = source.copPerUsd;
    rateSource = source.name;
    // display USD minor units = COP minor / rate
    displayAmountMinor = Math.round(chargeAmountMinor / rate);
    assertMinorUnits(displayAmountMinor, 'display_amount_minor');
  } else if (display !== 'COP') {
    throw new Error(`Unsupported display currency: ${display}`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + quoteTtlMinutes() * 60_000);

  return prisma.fxQuote.create({
    data: {
      id: randomUUID(),
      bookingId,
      chargeCurrency: 'COP',
      chargeAmountMinor,
      displayCurrency: display,
      displayAmountMinor,
      rate,
      rateSource,
      lockedAt: now,
      expiresAt,
    },
  });
}

/** Fetch a quote and assert it is still valid (not expired). */
export async function assertQuoteValid(quoteId: string, bookingId: string) {
  const quote = await prisma.fxQuote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error('QUOTE_NOT_FOUND');
  if (quote.bookingId !== bookingId) throw new Error('QUOTE_BOOKING_MISMATCH');
  if (quote.expiresAt.getTime() < Date.now()) throw new Error('QUOTE_EXPIRED');
  return quote;
}
