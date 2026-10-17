import { CircleAlert, CircleCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ToastVariant = 'success' | 'error';

/**
 * Visual toast only. Announcements come from ToastHost's live regions, so this
 * carries no role of its own (screen readers would otherwise read it twice).
 */
export function ToastView({
  variant = 'success',
  children,
  onDismiss,
  className,
}: {
  variant?: ToastVariant;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = variant === 'success' ? CircleCheck : CircleAlert;
  return (
    <div
      className={cn(
        'flex min-h-12 w-full max-w-sm items-center gap-3 rounded-[10px] border py-2 pl-4 pr-2 text-sm font-medium shadow-pop',
        variant === 'success'
          ? 'border-toast-border bg-toast text-toast-text'
          : 'border-danger bg-danger text-white',
        className,
      )}
    >
      <Icon
        className={cn('size-[18px] shrink-0', variant === 'success' && 'text-toast-success')}
        aria-hidden="true"
      />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="focus-ring grid size-8 shrink-0 place-items-center rounded-md opacity-80 hover:opacity-100"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
