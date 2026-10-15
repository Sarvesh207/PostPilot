import { CircleAlert } from 'lucide-react';
import { createContext, useContext, useId, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface FieldCtx {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldCtx | null>(null);

/** Lets an input pick up its id, aria-describedby and invalid state from a surrounding Field. */
export function useField() {
  return useContext(FieldContext);
}

interface FieldProps {
  label: ReactNode;
  /** Shown after the label in muted text, e.g. "(optional)". */
  labelSuffix?: ReactNode;
  hint?: ReactNode;
  hintIcon?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Field({ label, labelSuffix, hint, hintIcon, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn('flex flex-col gap-2', className)}>
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {labelSuffix && <span className="font-normal text-text-muted"> {labelSuffix}</span>}
        </label>
        {children}
        {error && <FieldError id={errorId}>{error}</FieldError>}
        {hint && (
          <p id={hintId} className="flex items-center gap-1.5 text-[13px] text-text-muted">
            {hintIcon}
            {hint}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-[13px] text-failed">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2.25} />
      {children}
    </p>
  );
}
