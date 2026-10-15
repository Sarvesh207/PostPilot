import { describe, expect, it } from 'vitest';
import {
  dayKey,
  dayLabel,
  daysBetween,
  formatTime,
  isoToZoned,
  longDate,
  relativeDateTime,
  shortDate,
  timeZoneAbbr,
  weekKeys,
  zonedToIso,
} from './dates';

const IST = 'Asia/Kolkata';
const NY = 'America/New_York';
// Wed 14 Oct 2026, 11:30 AM IST.
const NOW = new Date('2026-10-14T06:00:00Z');

describe('dayKey', () => {
  it('uses the calendar day in the given zone, not UTC', () => {
    // 19:00 UTC on the 14th is 00:30 on the 15th in India.
    expect(dayKey('2026-10-14T19:00:00Z', IST)).toBe('2026-10-15');
    expect(dayKey('2026-10-14T19:00:00Z', NY)).toBe('2026-10-14');
  });
});

describe('dayLabel', () => {
  it('labels relative days with the date alongside', () => {
    expect(dayLabel('2026-10-14', NOW, IST)).toEqual({ label: 'Today', date: 'Wed, 14 Oct' });
    expect(dayLabel('2026-10-15', NOW, IST)).toEqual({ label: 'Tomorrow', date: 'Thu, 15 Oct' });
    expect(dayLabel('2026-10-13', NOW, IST)).toEqual({ label: 'Yesterday', date: 'Tue, 13 Oct' });
  });

  it('uses the short date for anything further out', () => {
    expect(dayLabel('2026-10-16', NOW, IST)).toEqual({ label: 'Fri, 16 Oct' });
    expect(dayLabel('2026-10-17', NOW, IST)).toEqual({ label: 'Sat, 17 Oct' });
  });

  it('crosses month and year boundaries', () => {
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(shortDate('2027-01-01')).toBe('Fri, 1 Jan');
  });
});

describe('formatting', () => {
  it('formats times in 12-hour local time', () => {
    expect(formatTime('2026-10-14T14:30:00Z', IST)).toBe('8:00 PM');
    expect(formatTime('2026-10-14T04:30:00Z', IST)).toBe('10:00 AM');
  });

  it('finds a short zone abbreviation', () => {
    expect(timeZoneAbbr(NOW, IST)).toBe('IST');
    expect(timeZoneAbbr(NOW, NY)).toBe('EDT');
    expect(timeZoneAbbr(new Date('2026-01-15T12:00:00Z'), NY)).toBe('EST');
    expect(timeZoneAbbr(NOW, 'UTC')).toBe('UTC');
  });

  it('builds toast-style relative labels', () => {
    expect(relativeDateTime('2026-10-15T04:30:00Z', NOW, IST)).toBe('Tomorrow, 10:00 AM');
  });

  it('formats the long header date', () => {
    expect(longDate(NOW, IST)).toBe('Wednesday, 14 October');
  });
});

describe('zonedToIso / isoToZoned', () => {
  it('reads composer fields as wall-clock time in the zone', () => {
    expect(zonedToIso('2026-10-15', '10:00', IST)).toBe('2026-10-15T04:30:00.000Z');
    expect(zonedToIso('2026-12-01', '09:00', NY)).toBe('2026-12-01T14:00:00.000Z');
  });

  it('handles the daylight-saving switch', () => {
    // 8 Mar 2026: New York clocks jump from 2:00 to 3:00 EDT (UTC−4).
    expect(zonedToIso('2026-03-08', '03:30', NY)).toBe('2026-03-08T07:30:00.000Z');
    expect(zonedToIso('2026-03-07', '03:30', NY)).toBe('2026-03-07T08:30:00.000Z');
  });

  it('round-trips', () => {
    const iso = zonedToIso('2026-10-16', '19:30', IST);
    expect(isoToZoned(iso, IST)).toEqual({ date: '2026-10-16', time: '19:30' });
  });
});

describe('weekKeys', () => {
  it('returns Monday to Sunday of the current week', () => {
    expect(weekKeys(NOW, IST)).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
  });

  it('treats Sunday as the end of the week', () => {
    const sunday = new Date('2026-10-18T06:00:00Z');
    expect(weekKeys(sunday, IST)[0]).toBe('2026-10-12');
  });
});
