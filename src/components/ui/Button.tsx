import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

// `data-[hover]` duplicates each hover style so the dev sheet can show the
// hover state statically.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover data-[hover]:bg-accent-hover',
  secondary:
    'border border-border bg-surface text-text hover:bg-surface-hover data-[hover]:bg-surface-hover',
  ghost: 'text-accent-text hover:bg-accent-soft data-[hover]:bg-accent-soft',
  destructive: 'bg-danger text-white hover:bg-danger-hover data-[hover]:bg-danger-hover',
};

// Heights grow to 44px below `sm` so touch targets meet the mobile minimum.
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 sm:h-8',
  md: 'h-11 px-4 text-sm gap-2 sm:h-10',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Label shown while loading, e.g. "Scheduling…". Defaults to children. */
  loadingText?: ReactNode;
  icon?: ReactNode;
  forceHover?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    forceHover,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-hover={forceHover || undefined}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors',
        SIZES[size],
        loading
          ? cn(VARIANTS[variant], 'cursor-progress opacity-85')
          : disabled
            ? cn(
                'cursor-not-allowed bg-disabled text-disabled-text',
                variant === 'ghost' && 'bg-transparent',
                variant === 'secondary' && 'border border-transparent',
              )
            : VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
});
