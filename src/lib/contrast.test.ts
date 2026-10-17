import { describe, expect, it } from 'vitest';
import css from '../styles/index.css?raw';
import { CONTRAST_PAIRS, contrastRatio, flatten, parseColor } from './contrast';

function tokens(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return new Map([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const THEMES = {
  light: tokens("[data-theme='light']"),
  dark: tokens("[data-theme='dark']"),
};

describe.each(Object.entries(THEMES))('%s theme contrast', (_, vars) => {
  const read = (t: string) => {
    const c = parseColor(t.startsWith('--') ? (vars.get(t) ?? '') : t);
    if (!c) throw new Error(`Can't parse ${t}`);
    return c;
  };
  const surface = read('--surface');

  it.each(CONTRAST_PAIRS)('%s', (_label, fg, bg, min) => {
    // Translucent backgrounds sit on the surface; translucent text sits on its background.
    const b = flatten(read(bg), surface);
    const ratio = contrastRatio(flatten(read(fg), b), b);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
