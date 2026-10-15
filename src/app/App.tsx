import { RotateCw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Button } from '../components/ui/Button';
import { PlatformChip } from '../components/ui/Chip';
import { DayGroupHeader } from '../components/ui/DayGroupHeader';
import { PlatformStack } from '../components/ui/PlatformGlyph';
import { SearchInput } from '../components/ui/SearchInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ToastView } from '../components/ui/Toast';
import { formatTime, longDate, relativeDateTime, shortDate, timeZoneAbbr, localTimeZone } from '../lib/dates';
import { PLATFORMS } from '../lib/platforms';
import { actions, useAppState, useQueueView } from '../lib/store';
import type { StatusFilter } from '../lib/types';

/**
 * Temporary Phase 2 data preview: exercises the store, selectors and mock API
 * with plain markup. Replaced by the real queue screen in Phase 3.
 */
export function App() {
  const load = useAppState((s) => s.load);
  const accounts = useAppState((s) => s.accounts);
  const reconnecting = useAppState((s) => s.reconnecting);
  const retrying = useAppState((s) => s.retrying);
  const filters = useAppState((s) => s.filters);
  const view = useQueueView();
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void actions.load();
  }, []);

  const retry = async (id: string) => {
    const r = await actions.retryPost(id);
    setToast(r.ok ? { ok: true, text: r.rescheduled ? 'Post rescheduled' : 'Post queued again' } : { ok: false, text: r.message });
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-accent text-on-accent">
          <Send className="size-5" aria-hidden="true" />
        </span>
        <div className="mr-auto">
          <h1 className="text-lg font-semibold">PostPilot · data preview</h1>
          <p className="text-[13px] text-text-muted">
            {longDate()} · {localTimeZone()} ({timeZoneAbbr()}) · temporary page, replaced in Phase 3
          </p>
        </div>
        <ThemeSwitcher compact />
      </header>

      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" aria-label="Demo scenarios">
        {[
          ['/', 'Default'],
          ['/?mock=slow', 'Slow'],
          ['/?mock=empty', 'Empty'],
          ['/?mock=error', 'Load error'],
          ['/components', 'Component sheet'],
        ].map(([href, label]) => (
          <a key={href} href={href} className="focus-ring rounded text-accent-text hover:underline">
            {label}
          </a>
        ))}
        <button type="button" className="focus-ring rounded text-accent-text hover:underline" onClick={() => actions.resetDemo('seed')}>
          Reset demo data
        </button>
      </nav>

      {toast && (
        <ToastView variant={toast.ok ? 'success' : 'error'} onDismiss={() => setToast(null)}>
          {toast.text}
        </ToastView>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Total', view.counts.total],
            ['Scheduled', view.counts.scheduled],
            ['Published', view.counts.published],
            ['Failed', view.counts.failed],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="rounded-xl border border-border-subtle bg-surface p-4">
            <p className="text-[13px] text-text-muted">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{n}</p>
          </div>
        ))}
      </section>
      <p className="text-[13px] text-text-muted">
        Next: {view.next ? relativeDateTime(view.next.scheduledAt, view.now) : '—'} · Week:{' '}
        {view.week.map((d) => `${shortDate(d.key).slice(0, 3)} ${d.count}${d.isToday ? '•' : ''}`).join(' · ')}
      </p>

      <section className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold">Accounts</h2>
        {accounts &&
          PLATFORMS.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <span className="w-24">{p.name}</span>
              <span className={accounts[p.id] === 'connected' ? 'text-published' : 'text-failed'}>{accounts[p.id]}</span>
              {accounts[p.id] === 'expired' && (
                <Button size="sm" loading={reconnecting[p.id]} loadingText="Reconnecting…" onClick={() => actions.reconnectAccount(p.id)}>
                  Reconnect
                </Button>
              )}
            </div>
          ))}
      </section>

      <section className="flex flex-col gap-3">
        <SearchInput value={filters.search} onChange={(e) => actions.setSearch(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          {PLATFORMS.map((p) => (
            <PlatformChip
              key={p.id}
              platform={p.id}
              selected={filters.platforms.includes(p.id)}
              onClick={() => actions.togglePlatformFilter(p.id)}
            />
          ))}
          <SegmentedControl<StatusFilter>
            aria-label="Filter by status"
            value={filters.status}
            onChange={actions.setStatusFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'published', label: 'Published' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
          {view.filtersActive && (
            <Button variant="ghost" size="sm" onClick={actions.clearFilters}>
              Clear filters ({view.filterCount})
            </Button>
          )}
        </div>
      </section>

      {load === 'loading' && <p className="text-text-muted">Loading…</p>}
      {load === 'error' && (
        <div className="flex items-center gap-3">
          <p className="text-failed">Couldn't load posts.</p>
          <Button size="sm" onClick={() => actions.load()}>
            Try again
          </Button>
        </div>
      )}
      {load === 'ready' && view.groups.length === 0 && (
        <p className="text-text-muted">{view.filtersActive ? 'No posts match your filters.' : 'No posts scheduled yet.'}</p>
      )}

      {view.groups.map((g) => (
        <section key={g.key}>
          <DayGroupHeader label={g.label} date={g.date} count={g.posts.length} />
          <ul className="flex flex-col gap-2">
            {g.posts.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-20 font-medium tabular-nums">{formatTime(p.scheduledAt)}</span>
                  <PlatformStack platforms={p.platforms} />
                  <StatusBadge status={p.status} className="ml-auto" />
                  <Button size="sm" variant="ghost" onClick={() => actions.deletePost(p.id)}>
                    Delete
                  </Button>
                </div>
                <p className="line-clamp-2">{p.content}</p>
                {p.error && (
                  <div className="flex items-center gap-3">
                    <span className="text-failed">{p.error.message}</span>
                    <Button
                      size="sm"
                      className="ml-auto"
                      icon={<RotateCw className="size-3.5" aria-hidden="true" />}
                      loading={retrying[p.id]}
                      loadingText="Retrying…"
                      onClick={() => retry(p.id)}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
