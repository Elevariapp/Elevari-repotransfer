/**
 * Money utilities — integer minor units only.
 * All amounts crossing provider boundaries are integer minor units
 * (e.g. centavos for COP, cents for USD). No floating point money math
 * outside of fee calculation entry points, which round to minor units.
 */

export const COP_MINOR_PER_MAJOR = 100;
export const USD_MINOR_PER_MAJOR = 100;

/** Convert a decimal major-unit amount to integer minor units (rounds half-up). */
export function toMinorUnits(major: number, minorPerMajor: number = COP_MINOR_PER_MAJOR): number {
  if (!Number.isFinite(major)) {
    throw new Error(`Invalid money amount: ${major}`);
  }
  return Math.round(major * minorPerMajor);
}

/** Convert integer minor units to decimal major units (for display/persistence). */
export function fromMinorUnits(minor: number, minorPerMajor: number = COP_MINOR_PER_MAJOR): number {
  if (!Number.isInteger(minor)) {
    throw new Error(`Minor units must be an integer: ${minor}`);
  }
  return minor / minorPerMajor;
}

export function minorPerMajorForCurrency(currency: string): number {
  switch (currency.toUpperCase()) {
    case 'COP':
      return COP_MINOR_PER_MAJOR;
    case 'USD':
      return USD_MINOR_PER_MAJOR;
    default:
      throw new Error(`Unsupported currency: ${currency}`);
  }
}

/** Assert a value is a valid positive minor-unit amount. */
export function assertMinorUnits(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer in minor units (got ${String(value)})`);
  }
}
