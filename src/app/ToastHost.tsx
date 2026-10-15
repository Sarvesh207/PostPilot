import { ToastView } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { dismissToast, useToasts } from '../lib/toast';

/** Bottom-right on desktop; full-width above the bottom nav on mobile. */
export function ToastHost({ desktop }: { desktop: boolean }) {
  const toasts = useToasts();
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50 flex flex-col items-end gap-2',
        desktop ? 'bottom-6 right-6 w-96' : 'inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))]',
      )}
    >
      {toasts.map((t) => (
        <ToastView
          key={t.id}
          variant={t.variant}
          onDismiss={() => dismissToast(t.id)}
          className="pointer-events-auto max-w-none animate-toast-in"
        >
          {t.message}
        </ToastView>
      ))}
    </div>
  );
}
