import { DayGroupHeader } from '../../components/ui/DayGroupHeader';
import { cn } from '../../lib/cn';
import { formatTime, timeZoneAbbr } from '../../lib/dates';
import type { DayGroup as Group } from '../../lib/selectors';
import type { PostStatus } from '../../lib/types';
import { PostCard } from './PostCard';

const DOT: Record<PostStatus, string> = {
  scheduled: 'border-scheduled',
  published: 'border-published',
  failed: 'border-failed',
};

export const dayAnchorId = (key: string) => `day-${key}`;

interface DayGroupProps {
  group: Group;
  retrying: Readonly<Partial<Record<string, true>>>;
  layout: 'desktop' | 'mobile';
}

export function DayGroup({ group, retrying, layout }: DayGroupProps) {
  const headingId = `${dayAnchorId(group.key)}-heading`;
  return (
    <section
      id={dayAnchorId(group.key)}
      aria-labelledby={headingId}
      className="scroll-mt-[var(--sticky-top,0px)]"
    >
      <DayGroupHeader id={headingId} label={group.label} date={group.date} count={group.posts.length} sticky />
      {layout === 'desktop' ? (
        <ul className="pb-6 pt-1">
          {group.posts.map((post) => (
            <li key={post.id} className="group grid grid-cols-[72px_24px_minmax(0,1fr)] gap-x-3">
              <div className="pt-4 text-right">
                <time dateTime={post.scheduledAt} className="block text-sm font-semibold tabular-nums">
                  {formatTime(post.scheduledAt)}
                </time>
                <span className="text-[11px] text-text-muted">{timeZoneAbbr(post.scheduledAt)}</span>
              </div>
              {/* Timeline rail: a continuous line with a status-coloured dot per post. */}
              <div className="relative flex justify-center" aria-hidden="true">
                <span className="absolute bottom-0 top-0 w-px bg-border-subtle group-first:top-5" />
                <span
                  className={cn('relative mt-[18px] size-3 rounded-full border-2 bg-bg', DOT[post.status])}
                />
              </div>
              <div className="pb-3">
                <PostCard post={post} retrying={Boolean(retrying[post.id])} layout="desktop" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3 pb-5">
          {group.posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} retrying={Boolean(retrying[post.id])} layout="mobile" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
