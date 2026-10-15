import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn';
import { PLATFORM_BY_ID, type Platform } from '../../lib/platforms';

export type GlyphSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<GlyphSize, string> = {
  xs: 'size-4 rounded-[4px] text-[9px]',
  sm: 'size-5 rounded-[5px] text-[11px]',
  md: 'size-6 rounded-md text-xs',
  lg: 'size-7 rounded-md text-[13px]',
  xl: 'size-10 rounded-[10px] text-base',
};

// Generic letter tiles in brand colours — deliberately not the official logos.
const TILE: Record<Platform, { letter: string; className: string; style?: CSSProperties }> = {
  facebook: { letter: 'F', className: 'bg-facebook' },
  instagram: {
    letter: 'I',
    className: '',
    style: { background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 55%, #f59e0b 100%)' },
  },
  // Black tiles get a faint ring so they don't vanish on dark surfaces.
  x: { letter: 'X', className: 'bg-x ring-1 ring-inset ring-glyph-ring' },
  tiktok: {
    letter: 'T',
    className: 'bg-tiktok ring-1 ring-inset ring-glyph-ring',
    style: { textShadow: '-1px -1px 0 #25f4ee, 1px 1px 0 #fe2c55' },
  },
};

interface PlatformGlyphProps {
  platform: Platform;
  size?: GlyphSize;
  /** Set when the platform name isn't already visible next to the glyph. */
  labelled?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PlatformGlyph({
  platform,
  size = 'sm',
  labelled = false,
  disabled = false,
  className,
}: PlatformGlyphProps) {
  const tile = TILE[platform];
  return (
    <span
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? PLATFORM_BY_ID[platform].name : undefined}
      aria-hidden={labelled ? undefined : true}
      style={disabled ? undefined : tile.style}
      className={cn(
        'inline-grid shrink-0 select-none place-items-center font-bold leading-none text-white',
        SIZE[size],
        disabled ? 'bg-disabled-text' : tile.className,
        className,
      )}
    >
      {tile.letter}
    </span>
  );
}

/** A post's platform glyphs, with an accessible summary. */
export function PlatformStack({
  platforms,
  size = 'sm',
  round = false,
  overlap = true,
  className,
}: {
  platforms: Platform[];
  size?: GlyphSize;
  round?: boolean;
  /** Overlapping stack (desktop) or spaced row (mobile). */
  overlap?: boolean;
  className?: string;
}) {
  const names = platforms.map((p) => PLATFORM_BY_ID[p].name).join(', ');
  return (
    <span role="img" aria-label={`Platforms: ${names}`} className={cn('inline-flex', !overlap && 'gap-1', className)}>
      {platforms.map((p, i) => (
        <PlatformGlyph
          key={p}
          platform={p}
          size={size}
          className={cn(round && 'rounded-full', overlap && 'outline-2 outline-surface', overlap && i > 0 && '-ml-1')}
        />
      ))}
    </span>
  );
}
