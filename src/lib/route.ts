import { useSyncExternalStore, type MouseEvent } from 'react';

// Two app screens don't justify a router library: pathname + history API.
export type Route = 'queue' | 'settings';

const PATHS: Record<Route, string> = { queue: '/', settings: '/settings' };

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener('popstate', l);
  return () => {
    listeners.delete(l);
    window.removeEventListener('popstate', l);
  };
};

const current = (): Route => (window.location.pathname.replace(/\/$/, '') === '/settings' ? 'settings' : 'queue');

export const useRoute = () => useSyncExternalStore(subscribe, current, () => 'queue' as Route);

export function navigate(route: Route) {
  if (current() === route) return;
  window.history.pushState(null, '', PATHS[route] + window.location.search);
  listeners.forEach((l) => l());
  window.scrollTo(0, 0);
}

/** Props for an <a> that navigates in-app but still works as a real link. */
export function linkProps(route: Route) {
  return {
    href: PATHS[route],
    onClick: (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(route);
    },
  };
}
