import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { PLATFORM_BY_ID, type Platform } from '../../lib/platforms';
import { PlatformGlyph } from './PlatformGlyph';

interface PlatformChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  platform: Platform;
  selected: boolean;
}

/** Toggleable filter chip used in the queue's platform filter. */
export function PlatformChip({ platform, selected, disabled, className, ...rest }: PlatformChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        'focus-ring inline-flex h-11 shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-3 text-[13px] font-medium transition-colors sm:h-9',
        disabled
          ? 'cursor-not-allowed border-border-subtle bg-surface text-disabled-text'
          : selected
            ? 'border-accent-border bg-accent-soft text-accent-text'
            : 'border-border-subtle bg-surface text-text hover:border-border hover:bg-surface-hover',
        className,
      )}
      {...rest}
    >
      <PlatformGlyph platform={platform} size="md" disabled={disabled} className="rounded-full" />
      {PLATFORM_BY_ID[platform].name}
      {selected && !disabled && <Check className="size-3.5" aria-hidden="true" strokeWidth={2.5} />}
    </button>
  );
}
