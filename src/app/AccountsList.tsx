import { PlatformGlyph } from '../components/ui/PlatformGlyph';
import { Spinner } from '../components/ui/Spinner';
import { reconnectWithToast } from '../features/queue/postActions';
import { cn } from '../lib/cn';
import { PLATFORMS } from '../lib/platforms';
import { useAppState } from '../lib/store';

/** Connected accounts with a Reconnect action for expired ones. */
export function AccountsList({ size = 'compact' }: { size?: 'compact' | 'comfortable' }) {
  const accounts = useAppState((s) => s.accounts);
  const reconnecting = useAppState((s) => s.reconnecting);
  const roomy = size === 'comfortable';

  return (
    <ul className={cn('flex flex-col', roomy ? 'divide-y divide-border-subtle' : 'gap-1')}>
      {PLATFORMS.map((p) => {
        const status = accounts?.[p.id];
        const busy = Boolean(reconnecting[p.id]);
        return (
          <li key={p.id} className={cn('flex items-center gap-2.5', roomy ? 'min-h-14 py-2' : 'min-h-10 px-2')}>
            <PlatformGlyph platform={p.id} size={roomy ? 'lg' : 'md'} />
            <span className={cn('mr-auto', roomy ? 'text-[15px]' : 'text-sm')}>{p.name}</span>
            {status === 'expired' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => reconnectWithToast(p.id)}
                aria-label={`Reconnect ${p.name} (access expired)`}
                className={cn(
                  'focus-ring inline-flex items-center gap-1.5 rounded-md border border-failed-border bg-surface font-medium text-failed hover:bg-failed-soft disabled:cursor-progress',
                  roomy ? 'h-11 px-4 text-sm' : 'h-8 px-2.5 text-xs',
                )}
              >
                {busy && <Spinner className="size-3.5" />}
                {busy ? 'Reconnecting…' : 'Reconnect'}
              </button>
            ) : status === 'connected' ? (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="size-1.5 rounded-full bg-published" aria-hidden="true" />
                Connected
              </span>
            ) : (
              <span className="h-3 w-16 animate-pulse rounded bg-skeleton" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
