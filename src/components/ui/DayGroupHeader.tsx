import { cn } from '../../lib/cn';

interface DayGroupHeaderProps {
  /** "Today", "Tomorrow", or a full label like "Fri, 16 Oct". */
  label: string;
  /** Secondary date shown after relative labels, e.g. "Wed, 14 Oct". */
  date?: string;
  count: number;
  sticky?: boolean;
  className?: string;
  id?: string;
}

export function DayGroupHeader({ label, date, count, sticky = false, className, id }: DayGroupHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3',
        sticky && 'sticky top-[var(--sticky-top,0px)] z-10 bg-bg/95 backdrop-blur-sm',
        className,
      )}
    >
      <h2 id={id} className="flex items-baseline gap-2 text-[15px] font-semibold text-text">
        {label}
        {date && <span className="text-[13px] font-normal text-text-muted">{date}</span>}
      </h2>
      <span className="hidden h-px flex-1 bg-border-subtle sm:block" aria-hidden="true" />
      <span className="ml-auto rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-text-muted sm:ml-0 sm:bg-transparent sm:px-0">
        {count} {count === 1 ? 'post' : 'posts'}
      </span>
    </div>
  );
}
