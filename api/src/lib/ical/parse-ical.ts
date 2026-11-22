/** Parsed VEVENT from an iCal feed (OTA export). */
export interface IcalEvent {
  uid: string;
  /** Inclusive check-in day (UTC date). */
  startDate: Date;
  /** Exclusive check-out day (UTC date), matching Eleveri [start, end) semantics. */
  endDate: Date;
}

const ICAL_LINE = /^([A-Z0-9-]+)(?:;([^:]*))?:(.*)$/i;

/** Unfold RFC 5545 continuation lines. */
function unfoldIcal(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function parseIcalDateValue(value: string, params: string): Date | null {
  const isDateOnly =
    params.toUpperCase().includes('VALUE=DATE') || /^\d{8}$/.test(value.trim());

  const cleaned = value.trim().replace(/Z$/, '');

  if (isDateOnly && /^\d{8}$/.test(cleaned)) {
    const y = Number(cleaned.slice(0, 4));
    const m = Number(cleaned.slice(4, 6));
    const d = Number(cleaned.slice(6, 8));
    return new Date(Date.UTC(y, m - 1, d));
  }

  if (/^\d{8}T\d{6}$/.test(cleaned)) {
    const y = Number(cleaned.slice(0, 4));
    const m = Number(cleaned.slice(4, 6));
    const d = Number(cleaned.slice(6, 8));
    const h = Number(cleaned.slice(9, 11));
    const min = Number(cleaned.slice(11, 13));
    const s = Number(cleaned.slice(13, 15));
    return new Date(Date.UTC(y, m - 1, d, h, min, s));
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Parse DTSTART/DTEND pairs from an iCal document. */
export function parseIcalEvents(raw: string): IcalEvent[] {
  const text = unfoldIcal(raw);
  const events: IcalEvent[] = [];
  let inEvent = false;
  let uid = '';
  let dtStart: Date | null = null;
  let dtEnd: Date | null = null;
  let startParams = '';
  let endParams = '';

  const flush = () => {
    if (!uid || !dtStart) return;

    let endDate = dtEnd;
    if (!endDate) {
      // All-day events without DTEND are treated as a single night.
      endDate = addUtcDays(dtStart, 1);
    } else if (endParams.toUpperCase().includes('VALUE=DATE')) {
      // iCal all-day DTEND is exclusive already.
    } else if (endDate <= dtStart) {
      endDate = addUtcDays(dtStart, 1);
    }

    if (endDate <= dtStart) return;

    events.push({ uid, startDate: dtStart, endDate });
    uid = '';
    dtStart = null;
    dtEnd = null;
    startParams = '';
    endParams = '';
  };

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      uid = '';
      dtStart = null;
      dtEnd = null;
      startParams = '';
      endParams = '';
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inEvent) flush();
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    const match = ICAL_LINE.exec(trimmed);
    if (!match) continue;

    const [, name, params = '', value] = match;
    const upper = name.toUpperCase();

    if (upper === 'UID') {
      uid = value.trim();
    } else if (upper === 'DTSTART') {
      startParams = params;
      dtStart = parseIcalDateValue(value, params);
    } else if (upper === 'DTEND') {
      endParams = params;
      dtEnd = parseIcalDateValue(value, params);
    }
  }

  return events;
}
