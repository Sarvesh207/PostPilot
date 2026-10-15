import { useCallback, useEffect, useSyncExternalStore } from 'react';

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
let currentPref: ThemePref = typeof window === 'undefined' ? 'system' : readPref();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => currentPref);

  const setPref = useCallback((next: ThemePref) => {
    currentPref = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the choice just won't persist.
    }
    apply(resolve(next));
    listeners.forEach((l) => l());
  }, []);

  // While following the system, react to OS theme changes live.
  useEffect(() => {
    if (pref !== 'system') return;
    const mq = media();
    const onChange = () => apply(resolve('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  return { pref, theme: resolve(pref), setPref };
}
