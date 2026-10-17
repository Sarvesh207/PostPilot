// WCAG 2.x contrast helpers. The dev component sheet shows these pairs live and
// contrast.test.ts enforces them for both themes straight from index.css.

type RGBA = [number, number, number, number];

export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1) as RGBA;
  }
  const fn = s.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  }
  return null;
}

/** Composite a possibly translucent colour over an opaque backdrop. */
export function flatten(fg: RGBA, bg: RGBA): RGBA {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1) as RGBA;
}

function luminance([r, g, b]: RGBA): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [label, foreground, background, minimum ratio]. Colours are tokens or literals. */
export const CONTRAST_PAIRS: [string, string, string, number][] = [
  ['Text on surface', '--text', '--surface', 4.5],
  ['Text on page', '--text', '--bg', 4.5],
  ['Text on raised surface', '--text', '--surface-raised', 4.5],
  ['Muted text on surface', '--text-muted', '--surface', 4.5],
  ['Muted text on page', '--text-muted', '--bg', 4.5],
  ['Muted text on sunken', '--text-muted', '--surface-sunken', 4.5],
  ['Accent text on surface', '--accent-text', '--surface', 4.5],
  ['Accent text on page', '--accent-text', '--bg', 4.5],
  ['Selected chip text', '--accent-text', '--accent-soft', 4.5],
  ['Primary button label', '--on-accent', '--accent', 4.5],
  ['Primary button hover label', '--on-accent', '--accent-hover', 4.5],
  ['Destructive button label', '#ffffff', '--danger', 4.5],
  ['Scheduled badge', '--scheduled', '--scheduled-soft', 4.5],
  ['Published badge', '--published', '--published-soft', 4.5],
  ['Failed badge / error row', '--failed', '--failed-soft', 4.5],
  ['Failed text on surface', '--failed', '--surface', 4.5],
  ['Warning counter', '--warning', '--surface', 4.5],
  ['Toast text', '--toast-text', '--toast', 4.5],
  ['Error toast text', '#ffffff', '--danger', 4.5],
  ['Toast success icon', '--toast-success', '--toast', 3],
  ['Focus ring vs surface', '--focus', '--surface', 3],
  ['Focus ring vs page', '--focus', '--bg', 3],
];
