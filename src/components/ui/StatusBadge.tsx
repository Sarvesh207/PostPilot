import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';
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

/**
 * Status is always icon + text, never colour alone. `pending` swaps the icon
 * for a spinner while an optimistic change waits for the server.
 */
export function StatusBadge({ status, pending = false, className }: { status: PostStatus; pending?: boolean; className?: string }) {
  const { label, Icon, className: tone } = STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium',
        tone,
        className,
      )}
    >
      {pending ? <Spinner className="size-3.5" /> : <Icon className="size-3.5" aria-hidden="true" strokeWidth={2.25} />}
      {label}
      {pending && <span className="sr-only">, confirming</span>}
    </span>
  );
}
