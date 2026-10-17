import { useEffect } from 'react';
import { ComposerHost } from '../features/composer/Composer';
import { DesktopQueue, MobileQueue } from '../features/queue/QueuePage';
import { DeletePostDialog } from '../features/queue/postActions';
import { useRoute } from '../lib/route';
import { actions, appStore, useAppState } from '../lib/store';
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

  const page =
    route === 'settings' ? <SettingsPage desktop={desktop} /> : desktop ? <DesktopQueue /> : <MobileQueue />;

  return (
    <>
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
      <ToastHost desktop={desktop} />
    </>
  );
}
