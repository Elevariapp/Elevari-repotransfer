/**
 * Payment configuration — Phase 2 (Wompi-first).
 *
 * WOMPI is the only ACTIVE payment provider.
 * Bold and Stripe remain in the repository but hidden and disabled
 * unless explicitly re-enabled via PAYMENTS_BOLD_ENABLED / PAYMENTS_STRIPE_ENABLED.
 *
 * The WOMPI_* variables are the ONLY source of truth for Wompi config.
 * No hardcoded values, no duplicate configuration, no fallback secrets.
 */

export type PaymentsMode = 'live' | 'mock';

export interface WompiConfig {
  env: 'sandbox' | 'production';
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
}

export interface PaymentsConfig {
  mode: PaymentsMode;
  wompiEnabled: boolean;
  boldEnabled: boolean;
  stripeEnabled: boolean;
  wompi: WompiConfig | null;
  fxIntlCheckoutEnabled: boolean;
  legalSignoffRef: string | null;
}

function flag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

let cached: PaymentsConfig | null = null;

export function getPaymentsConfig(): PaymentsConfig {
  if (cached) return cached;

  const mode: PaymentsMode = process.env.PAYMENTS_MODE === 'live' ? 'live' : 'mock';
  const wompiEnabled = flag(process.env.PAYMENTS_WOMPI_ENABLED, mode === 'live');
  const boldEnabled = flag(process.env.PAYMENTS_BOLD_ENABLED, false);
  const stripeEnabled = flag(process.env.PAYMENTS_STRIPE_ENABLED, false);

  let wompi: WompiConfig | null = null;
  if (wompiEnabled) {
    const missing: string[] = [];
    const publicKey = process.env.WOMPI_PUBLIC_KEY;
    const privateKey = process.env.WOMPI_PRIVATE_KEY;
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

    if (!publicKey) missing.push('WOMPI_PUBLIC_KEY');
    if (!privateKey) missing.push('WOMPI_PRIVATE_KEY');
    if (!eventsSecret) missing.push('WOMPI_EVENTS_SECRET');
    if (!integritySecret) missing.push('WOMPI_INTEGRITY_SECRET');

    if (missing.length > 0) {
      throw new Error(
        `PAYMENTS STARTUP ERROR — Wompi enabled but missing configuration: ${missing.join(', ')}. ` +
          'Set all WOMPI_* variables (see .env.wompi.example) or set PAYMENTS_WOMPI_ENABLED=false. ' +
          'Partial configuration is not allowed.',
      );
    }

    // Environment is derived from the key prefix — Wompi keys are
    // pub_prod_*/prv_prod_* (production) or pub_test_*/prv_test_* (sandbox).
    const derivedEnv: 'sandbox' | 'production' | null = publicKey!.startsWith('pub_prod_')
      ? 'production'
      : publicKey!.startsWith('pub_test_')
        ? 'sandbox'
        : null;
    if (!derivedEnv) {
      throw new Error(
        'PAYMENTS STARTUP ERROR — WOMPI_PUBLIC_KEY must start with pub_prod_ or pub_test_. Refusing to start with an unrecognized key format.',
      );
    }
    const keyEnv = privateKey!.startsWith('prv_prod_')
      ? 'production'
      : privateKey!.startsWith('prv_test_')
        ? 'sandbox'
        : null;
    if (keyEnv !== derivedEnv) {
      throw new Error(
        'PAYMENTS STARTUP ERROR — WOMPI_PUBLIC_KEY and WOMPI_PRIVATE_KEY belong to different environments. Refusing to start with mismatched keys.',
      );
    }

    // WOMPI_ENV is optional; when present it must match the derived environment.
    const envFlag = process.env.WOMPI_ENV;
    if (envFlag && envFlag !== derivedEnv) {
      throw new Error(
        `PAYMENTS STARTUP ERROR — WOMPI_ENV=${envFlag} but keys are ${derivedEnv}. Remove WOMPI_ENV or fix the keys.`,
      );
    }

    wompi = {
      env: derivedEnv,
      publicKey: publicKey!,
      privateKey: privateKey!,
      eventsSecret: eventsSecret!,
      integritySecret: integritySecret!,
    };
  }

  if (!wompiEnabled && !boldEnabled && !stripeEnabled && mode === 'live') {
    throw new Error(
      'PAYMENTS STARTUP ERROR — PAYMENTS_MODE=live but no provider enabled. ' +
        'Set PAYMENTS_WOMPI_ENABLED=true (Wompi is the active provider).',
    );
  }

  cached = {
    mode,
    wompiEnabled,
    boldEnabled,
    stripeEnabled,
    wompi,
    fxIntlCheckoutEnabled: flag(process.env.FX_INTL_CHECKOUT_ENABLED, false),
    legalSignoffRef: process.env.LEGAL_SIGNOFF_REF || null,
  };
  return cached;
}

/** International converted checkout requires legal signoff. */
export function assertIntlCheckoutAllowed(): void {
  const cfg = getPaymentsConfig();
  if (cfg.fxIntlCheckoutEnabled && cfg.legalSignoffRef) return;
  throw new Error(
    'INTERNATIONAL_CHECKOUT_BLOCKED — FX_INTL_CHECKOUT_ENABLED=false or LEGAL_SIGNOFF_REF missing. ' +
      'International converted checkout remains blocked until legal signoff exists (see legal-review-pack.md).',
  );
}

/** Testing hook — reset cached config. */
export function resetPaymentsConfigCache(): void {
  cached = null;
}
