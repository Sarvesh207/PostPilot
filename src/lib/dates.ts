// Date helpers. Every function takes an explicit IANA time zone (defaulting to
// the viewer's) so grouping and labels are deterministic in tests.

const DAY_MS = 86_400_000;

// Browsers can report legacy IANA aliases (Windows often gives Asia/Calcutta).
const TZ_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
};

export function localTimeZone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return TZ_ALIASES[tz] ?? tz;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = formatters.get(key);
  if (!f) formatters.set(key, (f = new Intl.DateTimeFormat(locale, opts)));
  return f;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? '';
}

/** Calendar day of an instant in a time zone, as "YYYY-MM-DD". */
export function dayKey(date: Date | string, tz = localTimeZone()): string {
  const parts = fmt('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(
    new Date(date),
  );
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
}

/** Whole calendar days from key `a` to key `b` (b − a). */
export function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** Adds days to a "YYYY-MM-DD" key. */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Fri, 16 Oct" for a day key. */
export function shortDate(key: string): string {
  // Noon UTC keeps the weekday stable whatever zone formats it.
  const parts = fmt('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(
    new Date(`${key}T12:00:00Z`),
  );
  return `${part(parts, 'weekday')}, ${part(parts, 'day')} ${part(parts, 'month')}`;
}

export interface DayLabel {
  /** "Today", "Tomorrow", "Yesterday" or "Fri, 16 Oct". */
  label: string;
  /** Calendar date, shown beside relative labels. Absent when `label` is already the date. */
  date?: string;
}

export function dayLabel(key: string, now: Date = new Date(), tz = localTimeZone()): DayLabel {
  const diff = daysBetween(dayKey(now, tz), key);
  const relative = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : null;
  return relative ? { label: relative, date: shortDate(key) } : { label: shortDate(key) };
}

/** "8:00 PM". */
export function formatTime(date: Date | string, tz = localTimeZone()): string {
  return fmt('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

/**
 * Short zone label, e.g. "IST" or "EDT". Locales disagree on which zones get
 * abbreviations, so try a few before settling for "GMT+5:30".
 */
export function timeZoneAbbr(date: Date | string = new Date(), tz = localTimeZone()): string {
  let fallback = '';
  for (const locale of ['en-US', 'en-IN', 'en-GB', 'en-AU']) {
    const name = part(fmt(locale, { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(date)), 'timeZoneName');
    if (name && !/^(GMT|UTC)[+-]/.test(name)) return name;
    fallback ||= name;
  }
  return fallback || 'UTC';
}

/** "Tomorrow, 10:00 AM" — used in toasts and the composer preview. */
export function relativeDateTime(date: Date | string, now: Date = new Date(), tz = localTimeZone()): string {
  const { label } = dayLabel(dayKey(date, tz), now, tz);
  return `${label}, ${formatTime(date, tz)}`;
}

/** Long header date, e.g. "Wednesday, 14 October". */
export function longDate(date: Date | string = new Date(), tz = localTimeZone()): string {
  const parts = fmt('en-GB', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).formatToParts(
    new Date(date),
  );
  return `${part(parts, 'weekday')}, ${part(parts, 'day')} ${part(parts, 'month')}`;
}

/** Offset of `tz` from UTC at `date`, in minutes (IST → 330). */
function zoneOffsetMinutes(date: Date, tz: string): number {
  const parts = fmt('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date);
  const n = (t: Intl.DateTimeFormatPartTypes) => Number(part(parts, t));
  const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/**
 * Converts the composer's date ("YYYY-MM-DD") and time ("HH:mm") fields, read
 * as wall-clock time in `tz`, into an ISO instant.
 */
export function zonedToIso(dateStr: string, timeStr: string, tz = localTimeZone()): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes settle the offset across DST transitions.
  let ts = guess - zoneOffsetMinutes(new Date(guess), tz) * 60_000;
  ts = guess - zoneOffsetMinutes(new Date(ts), tz) * 60_000;
  return new Date(ts).toISOString();
}

/** Splits an instant back into the composer's date and time field values. */
export function isoToZoned(iso: string, tz = localTimeZone()): { date: string; time: string } {
  const parts = fmt('en-US', { timeZone: tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(
    new Date(iso),
  );
  return { date: dayKey(iso, tz), time: `${part(parts, 'hour')}:${part(parts, 'minute')}` };
}

export function isPast(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}

/** Monday-to-Sunday day keys for the week containing `now`. */
export function weekKeys(now: Date = new Date(), tz = localTimeZone()): string[] {
  const today = dayKey(now, tz);
  const [y, m, d] = today.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun
  const monday = addDaysToKey(today, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(monday, i));
}
