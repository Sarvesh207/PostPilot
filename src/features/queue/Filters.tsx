import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { PlatformChip } from '../../components/ui/Chip';
import { BottomSheet } from '../../components/ui/Dialog';
import { PlatformToggle } from '../../components/ui/PlatformToggle';
import { SegmentedControl, type SegmentOption } from '../../components/ui/SegmentedControl';
import { PLATFORMS } from '../../lib/platforms';
import { filterPosts, hasActiveFilters } from '../../lib/selectors';
import { actions, useAppState } from '../../lib/store';
import type { Filters, StatusFilter } from '../../lib/types';

export const STATUS_OPTIONS: SegmentOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
];

/** Desktop filter row: platform chips, status segments, clear. Search lives in the top bar. */
export function FilterBar({ filters }: { filters: Filters }) {
  return (
    <div role="group" aria-label="Filters" className="flex flex-wrap items-center gap-2">
      {PLATFORMS.map((p) => (
        <PlatformChip
          key={p.id}
          platform={p.id}
          selected={filters.platforms.includes(p.id)}
          onClick={() => actions.togglePlatformFilter(p.id)}
        />
      ))}
      <span className="mx-1 h-6 w-px bg-border-subtle" aria-hidden="true" />
      <SegmentedControl
        aria-label="Filter by status"
        value={filters.status}
        onChange={actions.setStatusFilter}
        options={STATUS_OPTIONS}
      />
      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={actions.clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

/**
 * Mobile filters in a bottom sheet. Edits a draft so the "Show N posts" count
 * previews the result; nothing applies until the user confirms.
 */
export function FilterSheet({
  open,
  onOpenChange,
  filters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
}) {
  const posts = useAppState((s) => s.posts);
  const [draft, setDraft] = useState(filters);
  const [wasOpen, setWasOpen] = useState(open);
  // Reset the draft each time the sheet opens (render-time sync, no effect needed).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(filters);
  }

  const count = filterPosts(posts, draft).length;
  const draftActive = draft.platforms.length > 0 || draft.status !== 'all';

  const apply = () => {
    actions.setPlatformFilter(draft.platforms);
    actions.setStatusFilter(draft.status);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      description="Filter the queue by platform and status"
      footer={
        <>
          <Button
            size="lg"
            className="flex-1"
            disabled={!draftActive}
            onClick={() => setDraft((d) => ({ ...d, platforms: [], status: 'all' }))}
          >
            Clear filters
          </Button>
          <Button size="lg" variant="primary" className="flex-[1.4]" onClick={apply}>
            Show {count} {count === 1 ? 'post' : 'posts'}
          </Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium text-text-muted">Platforms</legend>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((p) => (
            <PlatformToggle
              key={p.id}
              layout="row"
              platform={p.id}
              selected={draft.platforms.includes(p.id)}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  platforms: d.platforms.includes(p.id) ? d.platforms.filter((x) => x !== p.id) : [...d.platforms, p.id],
                }))
              }
            />
          ))}
        </div>
      </fieldset>
      <div className="mt-6 flex flex-col gap-3">
        <span className="text-sm font-medium text-text-muted" aria-hidden="true">
          Status
        </span>
        <SegmentedControl
          aria-label="Filter by status"
          fullWidth
          value={draft.status}
          onChange={(status) => setDraft((d) => ({ ...d, status }))}
          options={STATUS_OPTIONS}
        />
      </div>
    </BottomSheet>
  );
}
