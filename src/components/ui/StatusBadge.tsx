import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { PostStatus } from '../../lib/types';

const STATUS = {
  scheduled: {
    label: 'Scheduled',
    Icon: Clock,
    className: 'bg-scheduled-soft text-scheduled border-scheduled-border',
  },
  published: {
    label: 'Published',
    Icon: CircleCheck,
    className: 'bg-published-soft text-published border-published-border',
  },
  failed: {
    label: 'Failed',
    Icon: CircleAlert,
    className: 'bg-failed-soft text-failed border-failed-border',
  },
} as const;

/** Status is always icon + text, never colour alone. */
export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  const { label, Icon, className: tone } = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium',
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />
      {label}
    </span>
  );
}
