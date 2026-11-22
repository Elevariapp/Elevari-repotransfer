/**
 * Disclosure & acceptance — Phase 2 (WS6).
 *
 * International customers (display currency ≠ charge currency) must see and
 * explicitly accept a disclosure before payment creation. The disclosure
 * states the authoritative COP charge amount, the reference USD amount, the
 * exchange rate, quote timestamp and quote expiration.
 *
 * Supported locales: es, en.
 */
import { createHash } from 'node:crypto';

export const DISCLOSURE_VERSION = 'fx-disclosure-v1';

export type DisclosureLocale = 'es' | 'en';

export interface DisclosureInput {
  chargeAmountMinor: number;
  chargeCurrency: string;
  displayAmountMinor: number;
  displayCurrency: string;
  rate: number;
  lockedAt: Date;
  expiresAt: Date;
}

function formatMajor(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function buildDisclosureText(input: DisclosureInput, locale: DisclosureLocale): string {
  const charge = `${formatMajor(input.chargeAmountMinor)} ${input.chargeCurrency}`;
  const display = `${formatMajor(input.displayAmountMinor)} ${input.displayCurrency}`;
  const rate = input.rate.toFixed(2);
  const locked = input.lockedAt.toISOString();
  const expires = input.expiresAt.toISOString();

  if (locale === 'en') {
    return [
      `You will be charged ${charge}.`,
      `The amount ${display} is a reference only, based on an exchange rate of ${rate} COP per USD.`,
      `Quote generated at ${locked} and valid until ${expires}.`,
      `The charged COP amount is authoritative. Refunds are issued in COP for the original charged amount.`,
    ].join(' ');
  }

  return [
    `Se te cobrará ${charge}.`,
    `El valor ${display} es solo de referencia, calculado con una tasa de ${rate} COP por USD.`,
    `Cotización generada el ${locked} y válida hasta el ${expires}.`,
    `El monto cobrado en COP es el valor oficial. Los reembolsos se emiten en COP por el monto original cobrado.`,
  ].join(' ');
}

/** Stable hash of the disclosure content shown to the user. */
export function hashDisclosure(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function normalizeLocale(locale: string | undefined): DisclosureLocale {
  return locale === 'en' ? 'en' : 'es';
}
