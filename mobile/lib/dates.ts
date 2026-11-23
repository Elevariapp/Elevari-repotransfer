// Calendar dates travel as `YYYY-MM-DD` strings. All arithmetic is done in UTC so that
// the device time zone can never shift a night.
export type ISODate = string;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

export function toISODate(year: number, month: number, day: number): ISODate {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function parseISODate(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_ONLY.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? { year, month, day } : null;
}

function toUTCms(value: ISODate): number {
  const parts = parseISODate(value);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) : Number.NaN;
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = new Date(toUTCms(value) + days * MS_PER_DAY);
  return toISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// Number of nights between two dates (negative when `to` is before `from`).
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTCms(to) - toUTCms(from)) / MS_PER_DAY);
}

// Today in the user's local calendar.
export function todayISO(): ISODate {
  const now = new Date();
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// The API serialises stay dates as `YYYY-MM-DD` in lists but as `2026-03-05T00:00:00.000Z` on raw
// booking rows; both mean the same calendar day, so keep only the date part.
export function toDateOnly(value: string | null | undefined): ISODate {
  const match = value ? /^(\d{4}-\d{2}-\d{2})/.exec(value) : null;
  return match ? match[1] : (value ?? '');
}

// 0 = Monday … 6 = Sunday
export function mondayFirstWeekday(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}
