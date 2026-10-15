import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { useField } from './Field';

// Shared frame for text-like controls. `data-focus` forces the focus look for the dev sheet.
export const controlFrame = (invalid: boolean, disabled?: boolean) =>
  cn(
    'rounded-lg border bg-surface text-text transition-[border-color,box-shadow]',
    disabled
      ? 'cursor-not-allowed border-border-subtle bg-surface-sunken text-text-muted'
      : invalid
        ? 'border-failed focus-within:ring-1 focus-within:ring-failed data-[focus]:ring-1 data-[focus]:ring-failed'
        : 'border-border hover:border-text-subtle focus-within:border-accent-border focus-within:ring-1 focus-within:ring-accent-border data-[focus]:border-accent-border data-[focus]:ring-1 data-[focus]:ring-accent-border',
  );

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
  forceFocus?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leadingIcon, trailing, invalid, forceFocus, wrapperClassName, className, id, disabled, ...rest },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  return (
    <div
      data-focus={forceFocus || undefined}
      className={cn(
        'flex h-11 items-center gap-2 px-3 sm:h-10',
        controlFrame(isInvalid, disabled),
        wrapperClassName,
      )}
    >
      {leadingIcon && (
        <span className="flex shrink-0 text-text-muted [&_svg]:size-4" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        id={id ?? field?.id}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        aria-describedby={rest['aria-describedby'] ?? field?.describedBy}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none sm:text-sm',
          'disabled:cursor-not-allowed',
          className,
        )}
        {...rest}
      />
      {trailing}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  forceFocus?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, forceFocus, className, id, disabled, ...rest },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  return (
    <textarea
      ref={ref}
      id={id ?? field?.id}
      disabled={disabled}
      data-focus={forceFocus || undefined}
      aria-invalid={isInvalid || undefined}
      aria-describedby={rest['aria-describedby'] ?? field?.describedBy}
      className={cn(
        'block min-h-36 w-full resize-y px-3.5 py-3 text-[15px] leading-relaxed outline-none',
        controlFrame(isInvalid, disabled),
        className,
      )}
      {...rest}
    />
  );
});
