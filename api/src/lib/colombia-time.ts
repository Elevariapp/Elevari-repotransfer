/** Today's calendar date in Colombia as UTC midnight, the way `@db.Date` columns are read back. */
export function colombiaToday(now: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now);
  return new Date(`${ymd}T00:00:00.000Z`);
}
