import { cn } from '../../lib/cn';
import type { WeekDay } from '../../lib/selectors';
import { dayAnchorId } from './DayGroup';

const weekdayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short' });
const longFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' });

const asDate = (key: string) => new Date(`${key}T12:00:00Z`);
const plural = (n: number) => `${n} ${n === 1 ? 'post' : 'posts'}`;

/**
 * Mon–Sun strip with post counts. Days whose group is currently visible link
 * to it; the rest are static.
 */
export function WeekStrip({ days, visibleKeys }: { days: WeekDay[]; visibleKeys: ReadonlySet<string> }) {
  return (
    <nav aria-label="This week">
      <ul className="flex gap-1 rounded-xl border border-border-subtle bg-surface p-1">
        {days.map((d) => {
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
            <li key={d.key}>
              {visibleKeys.has(d.key) ? (
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
        })}
      </ul>
    </nav>
  );
}
