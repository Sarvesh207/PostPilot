import { TriangleAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PLATFORM_BY_ID, type Platform } from '../../lib/platforms';
import { actions } from '../../lib/store';
import type { Accounts, Post } from '../../lib/types';

/** Builds the banner's advice line from what actually went wrong. */
export function failureAdvice(failed: Post[], accounts: Accounts | null): string {
  const reconnect = new Set<Platform>();
  let rateLimited = false;
  let needsMedia = false;
  for (const p of failed) {
    if (p.failure?.code === 'token_expired' && accounts?.[p.failure.platform] === 'expired') reconnect.add(p.failure.platform);
    if (p.failure?.code === 'rate_limited') rateLimited = true;
    if (p.failure?.code === 'media_required') needsMedia = true;
  }
  const parts: string[] = [];
  if (reconnect.size) parts.push(`Reconnect ${[...reconnect].map((p) => PLATFORM_BY_ID[p].name).join(' and ')}, then retry.`);
  if (rateLimited) parts.push('Rate-limited posts can be retried now.');
  if (needsMedia) parts.push('TikTok posts need a video — edit them before retrying.');
  return parts.join(' ') || 'Retry them from the queue below.';
}

export function FailedBanner({
  failed,
  accounts,
  showingFailed,
}: {
  failed: Post[];
  accounts: Accounts | null;
  showingFailed: boolean;
}) {
  if (!failed.length) return null;
  return (
    <div role="region" aria-label="Failed posts" className="flex items-center gap-4 rounded-xl border border-failed-border bg-failed-soft px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-failed" aria-hidden="true">
        <TriangleAlert className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-failed">
          {failed.length} {failed.length === 1 ? 'post' : 'posts'} failed to publish
        </p>
        <p className="text-[13px] text-failed">{failureAdvice(failed, accounts)}</p>
      </div>
      {!showingFailed && (
        <Button size="sm" onClick={() => actions.setStatusFilter('failed')}>
          Show failed
        </Button>
      )}
    </div>
  );
}
