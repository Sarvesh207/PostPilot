import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { PLATFORM_BY_ID, type Platform } from '../../lib/platforms';
import { PlatformGlyph } from './PlatformGlyph';

interface PlatformToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  platform: Platform;
  selected: boolean;
  /** `card`: icon above name (desktop composer). `row`: icon beside name (mobile). */
  layout?: 'card' | 'row';
  invalid?: boolean;
}

/** Multi-select platform card in the composer's "Post to" group. */
export function PlatformToggle({
  platform,
  selected,
  layout = 'card',
  invalid = false,
  disabled,
  className,
  ...rest
}: PlatformToggleProps) {
  const name = PLATFORM_BY_ID[platform].name;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'focus-ring relative flex rounded-[10px] border font-medium transition-colors',
        layout === 'card'
          ? 'min-h-[76px] flex-col items-center justify-center gap-2 px-2 py-3 text-[13px]'
          : 'min-h-14 items-center gap-3 px-3 text-[15px]',
        disabled
          ? 'cursor-not-allowed border-border-subtle bg-surface text-disabled-text'
          : selected
            ? 'border-accent-border bg-accent-soft text-accent-text ring-1 ring-inset ring-accent-border'
            : invalid
              ? 'border-failed bg-surface text-text hover:bg-surface-hover'
              : 'border-border bg-surface text-text hover:bg-surface-hover',
        className,
      )}
      {...rest}
    >
      <PlatformGlyph platform={platform} size="lg" disabled={disabled} />
      <span className={cn(layout === 'row' && 'flex-1 text-left')}>{name}</span>
      {selected && !disabled &&
        (layout === 'card' ? (
          <span className="absolute right-1.5 top-1.5 grid size-[18px] place-items-center rounded-full bg-accent text-on-accent">
            <Check className="size-3" aria-hidden="true" strokeWidth={3} />
          </span>
        ) : (
          <Check className="size-4" aria-hidden="true" strokeWidth={2.5} />
        ))}
    </button>
  );
}
