import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  /** Hide the text label (it stays available to screen readers). */
  iconOnly?: boolean;
  disabled?: boolean;
  /** Tooltip, e.g. "Coming soon" for a disabled option. */
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

const KEY_DELTA: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Single-select radio group styled as a segmented control, with arrow-key navigation. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
  ...aria
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const enabled = options.flatMap((o, i) => (o.disabled ? [] : [i]));
    const pos = enabled.indexOf(index);
    const delta = KEY_DELTA[e.key];
    let next: number | undefined;
    if (delta) next = enabled[(pos + delta + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={aria['aria-label']}
      className={cn(
        'inline-flex rounded-[10px] bg-surface-sunken p-1',
        fullWidth ? 'flex w-full' : 'w-fit',
        className,
      )}
    >
      {options.map((opt, i) => {
        const checked = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={opt.iconOnly ? opt.label : undefined}
            title={opt.hint ?? (opt.iconOnly ? opt.label : undefined)}
            disabled={opt.disabled}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'focus-ring inline-flex items-center justify-center gap-1.5 rounded-[7px] font-medium transition-colors [&_svg]:size-4',
              size === 'md' ? 'h-11 px-3.5 text-[15px] sm:h-8 sm:text-[13px]' : 'h-8 px-2.5 text-[13px]',
              opt.iconOnly && 'px-2',
              fullWidth && 'flex-1',
              opt.disabled
                ? 'cursor-not-allowed text-disabled-text'
                : checked
                  ? 'bg-surface text-text shadow-[0_1px_2px_rgb(15_23_42/0.08)] dark:bg-surface-raised'
                  : 'text-text-muted hover:text-text',
            )}
          >
            {opt.icon}
            {!opt.iconOnly && opt.label}
          </button>
        );
      })}
    </div>
  );
}
