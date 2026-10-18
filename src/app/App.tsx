import { useEffect, useRef } from 'react';
import { ComposerHost } from '../features/composer/Composer';
import { DesktopQueue, MobileQueue } from '../features/queue/QueuePage';
import { DeletePostDialog } from '../features/queue/postActions';
import { useRoute } from '../lib/route';
import { actions, appStore, syncFiltersWithUrl, useAppState } from '../lib/store';
import { useIsDesktop } from '../lib/useMediaQuery';
import { SettingsPage } from './SettingsPage';
import { DesktopShell, MobileShell } from './Shell';
import { ToastHost } from './ToastHost';

export function App() {
  const desktop = useIsDesktop();
  const route = useRoute();
  const postCount = useAppState((s) => (s.load === 'ready' ? s.posts.length : null));

  useEffect(() => {
    // StrictMode runs effects twice in dev; the first call flips state to "loading".
    if (appStore.getState().load === 'idle') void actions.load();
  }, []);

  useEffect(() => syncFiltersWithUrl(), []);

  // Client-side navigation: retitle the tab and move focus to the new page so
  // screen readers announce it (initial load keeps the browser's own focus).
  // (Compares with the previous route rather than a first-run flag, which
  // StrictMode's double effect would clear.)
  const prevRoute = useRef(route);
  useEffect(() => {
    document.title = route === 'settings' ? 'Settings · PostPilot' : 'Queue · PostPilot';
    if (prevRoute.current === route) return;
    prevRoute.current = route;
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [route]);

  const page =
    route === 'settings' ? <SettingsPage desktop={desktop} /> : desktop ? <DesktopQueue /> : <MobileQueue />;

  return (
    <>
      <a
        href="#main-content"
        className="focus-ring sr-only z-[60] rounded-lg border border-border bg-surface-raised text-sm font-medium text-text shadow-pop focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:px-4 focus:py-2.5"
      >
        Skip to content
      </a>
      {desktop ? (
        <DesktopShell route={route} queueCount={postCount}>
          {page}
        </DesktopShell>
      ) : (
        <MobileShell route={route} showFab={route === 'queue'}>
          {page}
        </MobileShell>
      )}
      <ComposerHost desktop={desktop} />
      <DeletePostDialog />
      <ToastHost desktop={desktop} liftAboveFab={route === 'queue'} />
    </>
  );
}
