import type { DateRange } from 'react-day-picker';

/** Minimum stay: checkout must be strictly after check-in (at least 1 night). */
export function stayRangeError(range?: DateRange): string | null {
  if (!range?.from || !range?.to) return null;
  if (range.to <= range.from) {
    return 'La fecha de salida debe ser al menos un día después de la entrada.';
  }
  return null;
}

export function isValidStayRange(range?: DateRange): range is DateRange & { from: Date; to: Date } {
  return Boolean(range?.from && range?.to && range.to > range.from);
}
