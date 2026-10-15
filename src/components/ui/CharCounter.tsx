import { cn } from '../../lib/cn';
import { counterState } from '../../lib/counter';
import { PLATFORM_BY_ID, type Platform } from '../../lib/platforms';
import { PlatformGlyph } from './PlatformGlyph';

const fmt = new Intl.NumberFormat('en-IN');

const TONE = {
  normal: { bar: 'bg-text-subtle', text: 'text-text-muted' },
  warning: { bar: 'bg-warning', text: 'text-warning' },
  over: { bar: 'bg-failed', text: 'text-failed' },
} as const;

/** One row of the composer's live character counter: platform, progress bar, count. */
export function CharCounter({
  platform,
  count,
  className,
}: {
  platform: Platform;
  count: number;
  className?: string;
}) {
  const { name, limit } = PLATFORM_BY_ID[platform];
  const state = counterState(count, limit);
  const over = count - limit;
  const pct = Math.min(count / limit, 1) * 100;

  return (
    <div className={cn('grid grid-cols-[minmax(96px,8.5rem)_1fr_auto] items-center gap-3', className)}>
      <span className="flex items-center gap-2 text-sm text-text">
        <PlatformGlyph platform={platform} size="sm" />
        {name}
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
        <span
          className={cn('block h-full rounded-full transition-[width] duration-150', TONE[state].bar)}
          style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
        />
      </span>
      <span className={cn('text-right text-sm font-medium tabular-nums', TONE[state].text)}>
        {fmt.format(count)} / {fmt.format(limit)}
        {state === 'over' && <span className="ml-2 font-semibold">−{fmt.format(over)}</span>}
        <span className="sr-only">
          {' '}
          characters for {name}
          {state === 'over' ? `, ${over} over the limit` : state === 'warning' ? ', near the limit' : ''}
        </span>
      </span>
    </div>
  );
}
