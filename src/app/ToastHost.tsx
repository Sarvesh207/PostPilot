import { useRef } from 'react';
import { ToastView } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { dismissToast, pauseToasts, resumeToasts, useToasts, type Toast } from '../lib/toast';

/**
 * Bottom-right on desktop; full-width above the bottom nav on mobile (and above
 * the New Post button when it's showing).
 *
 * Screen readers hear toasts through two always-mounted live regions — polite
 * for confirmations, assertive for errors. They stay mounted so additions are
 * reliably announced, and Radix leaves [aria-live] elements exposed while a
 * modal is open, so a save error raised from the composer is still read out.
 */
export function ToastHost({ desktop, liftAboveFab = false }: { desktop: boolean; liftAboveFab?: boolean }) {
  const toasts = useToasts();
  const listRef = useRef<HTMLOListElement>(null);

  const dismiss = (t: Toast) => {
    // If focus is on this toast, hand it to a neighbour (or the page) instead of dropping it on <body>.
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-toast-id]') ?? []);
    const index = items.findIndex((el) => el.dataset.toastId === String(t.id));
    if (items[index]?.contains(document.activeElement)) {
      const next = items.filter((el, i) => i !== index && el.dataset.leaving !== 'true').at(-1);
      (next?.querySelector('button') ?? document.getElementById('main-content'))?.focus();
    }
    dismissToast(t.id);
  };

  const announce = (variant: Toast['variant']) =>
    toasts
      .filter((t) => t.variant === variant && !t.leaving)
      .map((t) => <p key={t.id}>{t.message}</p>);

  return (
    <section
      aria-label="Notifications"
      onMouseEnter={pauseToasts}
      onMouseLeave={resumeToasts}
      onFocus={pauseToasts}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) resumeToasts();
      }}
    >
      <div className="sr-only" aria-live="polite">
        {announce('success')}
      </div>
      <div className="sr-only" aria-live="assertive">
        {announce('error')}
      </div>

      <ol
        ref={listRef}
        className={cn(
          'pointer-events-none fixed z-50 flex flex-col items-end gap-2',
          desktop
            ? 'bottom-6 right-6 w-96'
            : liftAboveFab
              ? 'inset-x-4 bottom-[calc(148px+env(safe-area-inset-bottom))]'
              : 'inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))]',
        )}
      >
        {toasts.map((t) => (
          <li key={t.id} data-toast-id={t.id} data-leaving={t.leaving} className="flex w-full justify-end">
            <ToastView
              variant={t.variant}
              onDismiss={() => dismiss(t)}
              className={cn('pointer-events-auto max-w-none', t.leaving ? 'animate-toast-out' : 'animate-toast-in')}
            >
              {t.message}
            </ToastView>
          </li>
        ))}
      </ol>
    </section>
  );
}
