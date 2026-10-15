import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { usePortalContainer } from '../../lib/portal';

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Screen-reader description; pass when the body doesn't already explain the dialog. */
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Override where focus goes on close (call e.preventDefault() first). Defaults to the trigger. */
  onCloseAutoFocus?: (e: Event) => void;
}

const overlayClass = 'fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in';

function CloseButton({ label = 'Close' }: { label?: string }) {
  return (
    <RadixDialog.Close
      aria-label={label}
      className="focus-ring -mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text sm:size-9"
    >
      <X className="size-5" aria-hidden="true" />
    </RadixDialog.Close>
  );
}

/** Centered modal. Radix handles focus trapping, Escape, and focus return. */
export function Modal({ open, onOpenChange, title, description, children, footer, className, onCloseAutoFocus }: BaseProps) {
  const container = usePortalContainer();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay className={overlayClass} />
        <RadixDialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border-subtle bg-surface-raised text-text shadow-pop outline-none data-[state=open]:animate-pop-in',
            className,
          )}
        >
          <div className="flex items-center gap-3 px-6 pb-2 pt-5">
            <RadixDialog.Title className="mr-auto text-lg font-semibold">{title}</RadixDialog.Title>
            <CloseButton />
          </div>
          {description ? (
            <RadixDialog.Description className="px-6 text-sm text-text-muted">{description}</RadixDialog.Description>
          ) : (
            <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-3 px-6 pb-5">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Mobile bottom sheet with a drag-handle affordance and a sticky footer. */
export function BottomSheet({ open, onOpenChange, title, description, children, footer, className }: BaseProps) {
  const container = usePortalContainer();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal container={container}>
        <RadixDialog.Overlay className={overlayClass} />
        <RadixDialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-3xl border-t border-border-subtle bg-surface-raised text-text shadow-pop outline-none data-[state=open]:animate-sheet-up',
            className,
          )}
        >
          <span className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden="true" />
          <div className="flex items-center gap-3 px-4 pb-1 pt-4">
            <RadixDialog.Title className="mr-auto text-xl font-semibold">{title}</RadixDialog.Title>
            <CloseButton />
          </div>
          <RadixDialog.Description className="sr-only">{description ?? title}</RadixDialog.Description>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
          {footer && (
            <div className="flex gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
