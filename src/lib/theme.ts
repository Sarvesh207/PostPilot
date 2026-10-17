import { useCallback, useSyncExternalStore } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pp-theme';
const META_COLOR: Record<Theme, string> = { light: '#F6F7F9', dark: '#0B0F17' };
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // Storage blocked (private mode etc.) — fall back to system.
  }
  return 'system';
}

function resolve(pref: ThemePref): Theme {
  if (pref === 'system') return media().matches ? 'dark' : 'light';
  return pref;
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[theme]);
}

const listeners = new Set<() => void>();
// One object per change so useSyncExternalStore sees OS-driven flips too.
let current: { pref: ThemePref; theme: Theme } =
  typeof window === 'undefined' ? { pref: 'system', theme: 'light' } : { pref: readPref(), theme: resolve(readPref()) };

function setCurrent(pref: ThemePref) {
  current = { pref, theme: resolve(pref) };
  apply(current.theme);
  listeners.forEach((l) => l());
}

// Module-level, not per component: the switcher isn't mounted on every screen,
// but the theme must still follow the OS (and other tabs) everywhere.
if (typeof window !== 'undefined') {
  media().addEventListener('change', () => {
    if (current.pref === 'system') setCurrent('system');
  });
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) setCurrent(readPref());
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const { pref, theme } = useSyncExternalStore(subscribe, () => current);

  const setPref = useCallback((next: ThemePref) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice just won't persist.
    }
    setCurrent(next);
  }, []);

  return { pref, theme, setPref };
}
