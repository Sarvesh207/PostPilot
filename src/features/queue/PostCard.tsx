import { CircleAlert, Pencil, RotateCw, Trash2, TriangleAlert } from 'lucide-react';
import { useId } from 'react';
import { Button } from '../../components/ui/Button';
import { OverflowMenu, type MenuAction } from '../../components/ui/Menu';
import { PlatformStack } from '../../components/ui/PlatformGlyph';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { cn } from '../../lib/cn';
import { formatTime, timeZoneAbbr } from '../../lib/dates';
import { PLATFORM_BY_ID } from '../../lib/platforms';
import type { Post } from '../../lib/types';
import { menuTriggerId, openComposer, requestDelete, retryWithToast } from './postActions';
import { PostThumb } from './PostThumb';

interface PostCardProps {
  post: Post;
  retrying: boolean;
  layout: 'desktop' | 'mobile';
}

function platformLabel(post: Post) {
  return post.platforms.length >= 3
    ? `${post.platforms.length} platforms`
    : post.platforms.map((p) => PLATFORM_BY_ID[p].name).join(' · ');
}

function menuActions(post: Post): MenuAction[] {
  return [
    { label: 'Edit', icon: <Pencil aria-hidden="true" />, onSelect: () => openComposer(post.id) },
    { label: 'Delete', icon: <Trash2 aria-hidden="true" />, onSelect: () => requestDelete(post.id), destructive: true },
  ];
}

export function PostCard({ post, retrying, layout }: PostCardProps) {
  const errorId = useId();
  const time = formatTime(post.scheduledAt);
  const menu = (
    <OverflowMenu label={`Actions for the ${time} post`} actions={menuActions(post)} triggerId={menuTriggerId(post.id)} />
  );
  const retry = post.errorMessage && (
    <Button
      size={layout === 'desktop' ? 'sm' : 'md'}
      icon={<RotateCw className="size-4" aria-hidden="true" />}
      aria-describedby={errorId}
      onClick={() => retryWithToast(post.id)}
      className={cn(layout === 'mobile' && 'w-full')}
    >
      Retry
    </Button>
  );

  if (layout === 'desktop') {
    return (
      <article className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <div className="flex gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <PlatformStack platforms={post.platforms} round />
              <span className="truncate text-[13px] text-text-muted">{platformLabel(post)}</span>
              <StatusBadge status={post.status} pending={retrying} className="ml-auto" />
              <span className="-my-1.5">{menu}</span>
            </div>
            <p className="mt-2.5 line-clamp-2 text-[15px] leading-relaxed">{post.content}</p>
          </div>
          {post.mediaUrl && <PostThumb url={post.mediaUrl} className="size-20" />}
        </div>
        {post.errorMessage && (
          <div className="flex items-center gap-3 border-t border-failed-border bg-failed-soft py-2 pl-4 pr-3">
            <p id={errorId} className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-failed">
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              {post.errorMessage}
            </p>
            <span className="ml-auto">{retry}</span>
          </div>
        )}
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-border-subtle bg-surface p-4">
      <div className="flex gap-3">
        {post.mediaUrl && <PostThumb url={post.mediaUrl} className="size-14" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <p className="line-clamp-2 flex-1 text-[15px] leading-relaxed">{post.content}</p>
            <span className="-mr-2.5 -mt-2.5">{menu}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <PlatformStack platforms={post.platforms} size="md" overlap={false} />
            <time dateTime={post.scheduledAt} className="text-[15px] font-semibold tabular-nums">
              {time} <span className="text-[13px] font-normal text-text-muted">{timeZoneAbbr(post.scheduledAt)}</span>
            </time>
            <StatusBadge status={post.status} pending={retrying} className="ml-auto" />
          </div>
        </div>
      </div>
      {post.errorMessage && (
        <div className="mt-3 flex flex-col gap-3 border-t border-border-subtle pt-3">
          <p id={errorId} className="flex items-center gap-2 text-sm font-medium text-failed">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {post.errorMessage}
          </p>
          {retry}
        </div>
      )}
    </article>
  );
}
