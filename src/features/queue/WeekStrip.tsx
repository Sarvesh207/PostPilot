import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';
import type { WeekDay } from '../../lib/selectors';
import { dayAnchorId } from './DayGroup';

const weekdayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short' });
const longFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });
const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });

const asDate = (key: string) => new Date(`${key}T12:00:00Z`);
const plural = (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`;

/** Pages, in order: last week, this week, next week. */
const LABELS = ['Last week', 'This week', 'Next week'];
const THIS_WEEK = 1;
// Seven 52px cells with 4px gaps; each page is exactly this wide.
const PAGE_WIDTH = 7 * 52 + 6 * 4;

/** "12 – 18 Oct", or "28 Sep – 4 Oct" across a month boundary. */
function rangeLabel(days: WeekDay[]): string {
  const first = asDate(days[0].key);
  const last = asDate(days[days.length - 1].key);
  const start = first.getUTCMonth() === last.getUTCMonth() ? String(first.getUTCDate()) : dayMonthFmt.format(first);
  return `${start} – ${dayMonthFmt.format(last)}`;
}

/**
 * Carousel of Mon–Sun strips (last, this and next week) with post counts.
 * Days whose group is currently visible link to it; the rest are static.
 */
export function WeekStrip({ weeks, visibleKeys }: { weeks: WeekDay[][]; visibleKeys: ReadonlySet<string> }) {
  const [page, setPage] = useState(THIS_WEEK);
  const control = 'focus-ring grid h-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label="Weeks">
      <div className="mb-1.5 flex items-center gap-1">
        <p className="mr-auto pl-1 text-[13px] text-text-muted" aria-live="polite">
          <span className="font-medium text-text">{LABELS[page]}</span> · {rangeLabel(weeks[page])}
        </p>
        {page !== THIS_WEEK && (
          <button type="button" onClick={() => setPage(THIS_WEEK)} className={cn(control, 'px-2 text-[13px] font-medium')}>
            Today
          </button>
        )}
        <button
          type="button"
          aria-label="Previous week"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className={cn(control, 'w-7')}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next week"
          disabled={page === weeks.length - 1}
          onClick={() => setPage((p) => p + 1)}
          className={cn(control, 'w-7')}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-1">
        <div className="overflow-hidden" style={{ width: PAGE_WIDTH }}>
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${page * PAGE_WIDTH}px)` }}
          >
            {weeks.map((days, i) => (
              // Off-screen weeks are inert so Tab and screen readers skip them.
              <ul key={days[0].key} inert={i !== page} aria-label={LABELS[i]} className="flex shrink-0 gap-1" style={{ width: PAGE_WIDTH }}>
                {days.map((d) => (
                  <WeekCell key={d.key} day={d} linked={visibleKeys.has(d.key)} />
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function WeekCell({ day: d, linked }: { day: WeekDay; linked: boolean }) {
  const content = (
    <>
      <span className="sr-only">
        {longFmt.format(asDate(d.key))}, {plural(d.count)}
      </span>
      <span aria-hidden="true" className="text-[11px] leading-none">
        {weekdayFmt.format(asDate(d.key))}
      </span>
      <span aria-hidden="true" className="text-[15px] font-semibold leading-none tabular-nums">
        {Number(d.key.slice(8))}
      </span>
      <span aria-hidden="true" className="text-[10px] leading-none">
        {d.count ? plural(d.count) : '–'}
      </span>
    </>
  );
  const cell = cn(
    'flex h-16 w-[52px] flex-col items-center justify-center gap-1.5 rounded-lg',
    d.isToday
      ? 'bg-text text-bg'
      : d.count
        ? 'bg-surface-sunken text-text'
        : d.isPast
          ? 'text-text-subtle'
          : 'text-text-muted',
  );
  const anchor = dayAnchorId(d.key);
  return (
    <li>
      {linked ? (
        <a
          href={`#${anchor}`}
          aria-current={d.isToday ? 'date' : undefined}
          className={cn(cell, 'focus-ring transition-colors', !d.isToday && 'hover:bg-surface-hover')}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {content}
        </a>
      ) : (
        <span aria-current={d.isToday ? 'date' : undefined} className={cell}>
          {content}
        </span>
      )}
    </li>
  );
}
