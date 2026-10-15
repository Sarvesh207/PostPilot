import { Plus, RotateCw, Send, WifiOff, ZoomOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { cn } from '../../lib/cn';
import { actions } from '../../lib/store';
import { openComposer } from './postActions';

function SkeletonCard({ image }: { image?: boolean }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border-subtle bg-surface p-4">
      {image && <Skeleton className="size-16 shrink-0 rounded-lg" />}
      <div className="flex flex-1 flex-col gap-2.5 pt-1">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-1 flex items-center gap-2">
          <Skeleton className="size-5" />
          <Skeleton className="size-5" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton cards under skeleton day headers, shaped like the real queue. */
export function QueueSkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div role="status" aria-label="Loading posts" className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(desktop ? ['h-24', 'h-24', 'h-24', 'h-24'] : ['h-11 w-20', 'h-11 w-32', 'h-11 w-32']).map((c, i) => (
          <Skeleton key={i} className={cn(c, desktop ? 'flex-1 rounded-xl' : 'rounded-full')} />
        ))}
      </div>
      {[2, 1].map((n, g) => (
        <div key={g} className="flex flex-col gap-3 pt-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-14" />
          </div>
          {Array.from({ length: n }, (_, i) => (
            <SkeletonCard key={i} image={i % 2 === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}

function StateMessage({
  icon,
  title,
  body,
  action,
  className,
  role,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}) {
  return (
    <div role={role} className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      {icon}
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-[15px] text-text-muted">{body}</p>
      <div className="mt-6 w-full sm:w-auto">{action}</div>
    </div>
  );
}

/** Simple line illustration: a post card with a send badge. */
function EmptyIllustration() {
  return (
    <div className="relative h-24 w-32" aria-hidden="true">
      <div className="absolute left-3 top-4 h-[70px] w-[104px] rounded-lg border border-border bg-surface" />
      <div className="absolute left-0 top-2 flex h-[70px] w-[104px] flex-col gap-2 rounded-lg border border-border bg-surface p-3">
        <span className="h-1.5 w-12 rounded-full bg-skeleton" />
        <span className="h-1.5 w-20 rounded-full bg-skeleton" />
        <span className="mt-auto flex gap-1.5">
          <span className="size-3.5 rounded-[4px] bg-skeleton" />
          <span className="size-3.5 rounded-[4px] bg-skeleton" />
        </span>
      </div>
      <span className="absolute right-0 top-0 grid size-11 place-items-center rounded-full bg-accent-soft text-accent-text">
        <Send className="size-5" />
      </span>
    </div>
  );
}

export function EmptyQueue() {
  return (
    <StateMessage
      icon={<EmptyIllustration />}
      title="No posts scheduled yet"
      body="Write once and schedule it for Facebook, Instagram, X and TikTok from one place."
      action={
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
          icon={<Plus className="size-4" aria-hidden="true" />}
          onClick={() => openComposer()}
        >
          Create your first post
        </Button>
      }
    />
  );
}

export function NoResults() {
  return (
    <StateMessage
      role="status"
      className="rounded-xl border border-dashed border-border bg-surface"
      icon={
        <span className="grid size-12 place-items-center rounded-xl bg-surface-sunken text-text-muted" aria-hidden="true">
          <ZoomOut className="size-5" />
        </span>
      }
      title="No posts match your filters"
      body="Try a different search or platform."
      action={
        <Button size="lg" className="w-full sm:w-auto" onClick={actions.clearFilters}>
          Clear filters
        </Button>
      }
    />
  );
}

export function LoadError() {
  return (
    <StateMessage
      role="alert"
      icon={
        <span className="grid size-12 place-items-center rounded-xl bg-failed-soft text-failed" aria-hidden="true">
          <WifiOff className="size-5" />
        </span>
      }
      title="Couldn't load posts"
      body="Something went wrong on our side or your connection dropped. Your scheduled posts are safe."
      action={
        <Button
          size="lg"
          className="w-full sm:w-auto"
          icon={<RotateCw className="size-4" aria-hidden="true" />}
          onClick={() => actions.load()}
        >
          Try again
        </Button>
      }
    />
  );
}
