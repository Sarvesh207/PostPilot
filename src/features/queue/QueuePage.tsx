import { CalendarDays, List, ListFilter, Plus } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Logo } from '../../app/Shell';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { cn } from '../../lib/cn';
import { longDate, timeZoneAbbr } from '../../lib/dates';
import { actions, useAppState, useQueueView } from '../../lib/store';
import { DayGroup } from './DayGroup';
import { FailedBanner } from './FailedBanner';
import { FilterBar, FilterSheet } from './Filters';
import { openComposer } from './postActions';
import { EmptyQueue, LoadError, NoResults, QueueSkeleton } from './QueueStates';
import { SummaryCards, SummaryPills } from './Summary';
import { WeekStrip } from './WeekStrip';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

type QueueView = ReturnType<typeof useQueueView>;

/** Picks loading / error / empty / no-results / content for the queue body. */
function QueueBody({
  desktop,
  view,
  content,
}: {
  desktop: boolean;
  view: QueueView;
  content: ReactNode;
}) {
  const load = useAppState((s) => s.load);
  const hasPosts = useAppState((s) => s.posts.length > 0);

  if (load === 'idle' || load === 'loading') return <QueueSkeleton desktop={desktop} />;
  if (load === 'error') return <LoadError />;
  if (!hasPosts) return <EmptyQueue />;
  return (
    <>
      {content}
      {view.groups.length === 0 && <NoResults />}
    </>
  );
}

function Groups({ view, desktop }: { view: QueueView; desktop: boolean }) {
  const retrying = useAppState((s) => s.retrying);
  return (
    <div>
      {view.groups.map((g) => (
        <DayGroup key={g.key} group={g} retrying={retrying} layout={desktop ? 'desktop' : 'mobile'} />
      ))}
    </div>
  );
}

const VIEW_OPTIONS = [
  { value: 'list', label: 'List', icon: <List /> },
  { value: 'calendar', label: 'Calendar', icon: <CalendarDays />, disabled: true, hint: 'Calendar view is coming soon' },
] as const;

export function DesktopQueue() {
  const view = useQueueView();
  const filters = useAppState((s) => s.filters);
  const accounts = useAppState((s) => s.accounts);
  const ready = useAppState((s) => s.load === 'ready' && s.posts.length > 0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ '--sticky-top': '68px' } as CSSProperties}>
      <header className="sticky top-0 z-20 h-[68px] border-b border-border-subtle bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-[1040px] items-center gap-4 px-8">
          <SearchInput
            ref={searchRef}
            shortcut={isMac ? '⌘K' : 'Ctrl K'}
            aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
            wrapperClassName="w-full max-w-[420px]"
            value={filters.search}
            onChange={(e) => actions.setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && actions.setSearch('')}
          />
          <Button
            variant="primary"
            className="ml-auto"
            icon={<Plus className="size-4" aria-hidden="true" />}
            onClick={() => openComposer()}
          >
            New Post
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1040px] px-8 pb-16 pt-8 outline-none">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[13px] text-text-muted">
              {longDate(view.now)} · {timeZoneAbbr(view.now)}
            </p>
            <div className="mt-1.5 flex items-center gap-4">
              <h1 className="text-[28px] font-semibold tracking-tight">Your queue</h1>
              <SegmentedControl aria-label="View" size="sm" value="list" onChange={() => {}} options={VIEW_OPTIONS} />
            </div>
          </div>
          {ready && <WeekStrip weeks={view.weeks} visibleKeys={view.groupKeys} />}
        </div>

        <div className="mt-6">
          <QueueBody
            desktop
            view={view}
            content={
              <div className="flex flex-col gap-6">
                <SummaryCards
                  counts={view.counts}
                  weekCount={view.weekCount}
                  next={view.next}
                  lastPublished={view.lastPublished}
                  status={filters.status}
                  now={view.now}
                />
                <FailedBanner failed={view.failed} accounts={accounts} showingFailed={filters.status === 'failed'} />
                <FilterBar filters={filters} />
                <Groups view={view} desktop />
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}

/** Tracks an element's height so sticky children can offset below it. */
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.borderBoxSize[0]?.blockSize ?? el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, height] as const;
}

export function MobileQueue() {
  const view = useQueueView();
  const filters = useAppState((s) => s.filters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [headerRef, headerHeight] = useHeight<HTMLElement>();
  const active = view.filterCount > 0;

  return (
    <div style={{ '--sticky-top': `${headerHeight}px` } as CSSProperties}>
      <header ref={headerRef} className="sticky top-0 z-20 border-b border-border-subtle bg-surface px-4 pb-3 pt-3">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-xl font-bold tracking-tight">PostPilot</span>
          </div>
          <div className="mt-3 flex gap-2">
            <SearchInput
              wrapperClassName="min-w-0 flex-1"
              value={filters.search}
              onChange={(e) => actions.setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-label={active ? `Filters, ${view.filterCount} active` : 'Filters'}
              className={cn(
                'focus-ring inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border px-3.5 text-[15px] font-medium',
                active
                  ? 'border-accent-border bg-accent-soft text-accent-text'
                  : 'border-border bg-surface text-text hover:bg-surface-hover',
              )}
            >
              <ListFilter className="size-4" aria-hidden="true" />
              Filters
              {active && (
                <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-on-accent" aria-hidden="true">
                  {view.filterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 pt-4 outline-none">
        <h1 className="sr-only">Your queue</h1>
        <QueueBody
          desktop={false}
          view={view}
          content={
            <div className="flex flex-col gap-2">
              <SummaryPills
                counts={view.counts}
                weekCount={view.weekCount}
                next={view.next}
                lastPublished={view.lastPublished}
                status={filters.status}
                now={view.now}
              />
              <Groups view={view} desktop={false} />
            </div>
          }
        />
      </main>

      <FilterSheet open={sheetOpen} onOpenChange={setSheetOpen} filters={filters} />
    </div>
  );
}
