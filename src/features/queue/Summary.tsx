import { CircleAlert, CircleCheck, Clock, List } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { dayLabel, dayKey, relativeDateTime } from '../../lib/dates';
import type { StatusCounts } from '../../lib/selectors';
import { actions } from '../../lib/store';
import type { Post, StatusFilter } from '../../lib/types';

interface SummaryProps {
  counts: StatusCounts;
  weekCount: number;
  next?: Post;
  lastPublished?: Post;
  status: StatusFilter;
  now: Date;
}

interface Item {
  value: StatusFilter;
  label: string;
  count: number;
  icon: ReactNode;
  iconClass: string;
  note: ReactNode;
  noteClass?: string;
}

function items({ counts, weekCount, next, lastPublished, now }: SummaryProps): Item[] {
  return [
    {
      value: 'all',
      label: 'All posts',
      count: counts.total,
      icon: <List />,
      iconClass: 'text-text-muted',
      note: `${weekCount} this week`,
    },
    {
      value: 'scheduled',
      label: 'Scheduled',
      count: counts.scheduled,
      icon: <Clock />,
      iconClass: 'text-scheduled',
      note: next ? `Next: ${relativeDateTime(next.scheduledAt, now)}` : 'Nothing upcoming',
      noteClass: next && 'text-scheduled',
    },
    {
      value: 'published',
      label: 'Published',
      count: counts.published,
      icon: <CircleCheck />,
      iconClass: 'text-published',
      note: lastPublished ? `Last: ${dayLabel(dayKey(lastPublished.scheduledAt), now).label}` : 'None yet',
    },
    {
      value: 'failed',
      label: 'Failed',
      count: counts.failed,
      icon: <CircleAlert />,
      iconClass: 'text-failed',
      note: counts.failed ? 'Needs attention' : 'All clear',
      noteClass: counts.failed ? 'text-failed' : undefined,
    },
  ];
}

// Clicking the active card again resets to "All".
const select = (value: StatusFilter, current: StatusFilter) =>
  actions.setStatusFilter(value === current ? 'all' : value);

/** Desktop summary: four cards that double as the status filter. */
export function SummaryCards(props: SummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {items(props).map((it) => {
        const active = props.status === it.value;
        return (
          <button
            key={it.value}
            type="button"
            aria-pressed={active}
            onClick={() => select(it.value, props.status)}
            className={cn(
              'focus-ring flex flex-col gap-3 rounded-xl border bg-surface p-4 text-left transition-colors',
              active ? 'border-accent-border ring-1 ring-inset ring-accent-border' : 'border-border-subtle hover:border-border',
            )}
          >
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <span className={cn('grid size-7 place-items-center rounded-md bg-surface-sunken [&_svg]:size-4', it.iconClass)} aria-hidden="true">
                {it.icon}
              </span>
              {it.label}
            </span>
            <span className="flex items-end justify-between gap-2">
              <span className="text-[28px] font-semibold leading-none tabular-nums">{it.count}</span>
              <span className={cn('truncate text-xs text-text-muted', it.noteClass)}>{it.note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Mobile summary: a scrollable row of pills that double as the status filter. */
export function SummaryPills(props: SummaryProps) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items(props).map((it) => {
        // Unlike the desktop cards, "Total" isn't highlighted when no filter is set (per the mockup).
        const active = props.status === it.value && it.value !== 'all';
        return (
          <button
            key={it.value}
            type="button"
            aria-pressed={active}
            onClick={() => select(it.value, props.status)}
            className={cn(
              'focus-ring flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] transition-colors',
              active ? 'border-accent-border bg-accent-soft text-accent-text' : 'border-border-subtle bg-surface',
            )}
          >
            {it.value !== 'all' && (
              <span className={cn('[&_svg]:size-4', it.iconClass)} aria-hidden="true">
                {it.icon}
              </span>
            )}
            {it.value === 'all' ? 'Total' : it.label}
            <span className="font-semibold tabular-nums">{it.count}</span>
          </button>
        );
      })}
    </div>
  );
}
