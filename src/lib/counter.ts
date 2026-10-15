export type CounterState = 'normal' | 'warning' | 'over';

/** Above this share of the limit the counter turns amber. */
export const WARNING_RATIO = 0.9;

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Counts user-perceived characters, so an emoji like 🪔 counts as 1. */
export function countChars(text: string): number {
  let n = 0;
  for (const _ of segmenter.segment(text)) n++;
  return n;
}

export function counterState(count: number, limit: number): CounterState {
  if (count > limit) return 'over';
  if (count > limit * WARNING_RATIO) return 'warning';
  return 'normal';
}
