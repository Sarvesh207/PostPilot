import { CalendarDays, List, Plus, Send, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { openComposer } from '../features/queue/postActions';
import { cn } from '../lib/cn';
import { linkProps, type Route } from '../lib/route';
import { AccountsList } from './AccountsList';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent text-on-accent', className)} aria-hidden="true">
      <Send className="size-[18px]" />
    </span>
  );
}

interface NavItem {
  route: Route | null;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { route: 'queue', label: 'Queue', icon: <List /> },
  { route: null, label: 'Calendar', icon: <CalendarDays /> },
  { route: 'settings', label: 'Settings', icon: <SlidersHorizontal /> },
];

/** Desktop: fixed sidebar plus a content column. */
export function DesktopShell({
  route,
  queueCount,
  children,
}: {
  route: Route;
  /** Null until posts have loaded. */
  queueCount: number | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh pl-60">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-border-subtle bg-surface px-3 pb-3 pt-4">
        <div className="flex items-center gap-2.5 px-2">
          <Logo />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold">PostPilot</p>
            <p className="text-xs text-text-muted">[Your brand]</p>
          </div>
        </div>

        <nav aria-label="Main" className="mt-6">
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <li key={item.label}>
                {item.route ? (
                  <a
                    {...linkProps(item.route)}
                    aria-current={route === item.route ? 'page' : undefined}
                    className={cn(
                      'focus-ring flex h-10 items-center gap-3 rounded-lg px-3 text-sm [&_svg]:size-4',
                      route === item.route
                        ? 'bg-surface-sunken font-medium text-text'
                        : 'text-text-muted hover:bg-surface-hover hover:text-text',
                    )}
                  >
                    {item.icon}
                    <span className="mr-auto">{item.label}</span>
                    {item.route === 'queue' && queueCount !== null && (
                      <span className="text-xs tabular-nums text-text-muted" aria-label={`${queueCount} posts`}>
                        {queueCount}
                      </span>
                    )}
                  </a>
                ) : (
                  <span
                    aria-disabled="true"
                    className="flex h-10 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm text-disabled-text [&_svg]:size-4"
                  >
                    {item.icon}
                    <span className="mr-auto">{item.label}</span>
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-text-muted">Soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="accounts-heading" className="mt-8">
          <h2 id="accounts-heading" className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Accounts
          </h2>
          <AccountsList />
        </section>

        <div className="mt-auto flex items-center justify-between gap-2 px-2 pt-4">
          <span className="text-xs text-text-muted">Theme</span>
          <ThemeSwitcher compact />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Mobile: content, then a fixed bottom nav and a floating New Post button. */
export function MobileShell({ route, children, showFab }: { route: Route; children: ReactNode; showFab: boolean }) {
  return (
    <div className="min-h-dvh pb-[calc(64px+env(safe-area-inset-bottom))]">
      {children}
      {showFab && (
        <button
          type="button"
          aria-label="New post"
          onClick={() => openComposer()}
          className="focus-ring fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 z-20 grid size-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-pop hover:bg-accent-hover"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid h-16 grid-cols-3">
          {NAV.map((item) => (
            <li key={item.label} className="flex">
              {item.route ? (
                <a
                  {...linkProps(item.route)}
                  aria-current={route === item.route ? 'page' : undefined}
                  className={cn(
                    'focus-ring flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium [&_svg]:size-5',
                    route === item.route ? 'text-accent-text' : 'text-text-muted',
                  )}
                >
                  {item.icon}
                  {item.label}
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-disabled-text [&_svg]:size-5"
                >
                  {item.icon}
                  {item.label} · Soon
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
