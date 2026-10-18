// Pure derivations over posts + filters. No React here, so it's all unit-testable.

import { addDaysToKey, dayKey, dayLabel, weekKeys, localTimeZone } from './dates';
import { PLATFORM_BY_ID } from './platforms';
import type { Filters, Post, PostStatus } from './types';

export const EMPTY_FILTERS: Filters = { search: '', platforms: [], status: 'all' };

const byTime = (a: Post, b: Post) => a.scheduledAt.localeCompare(b.scheduledAt);

/** Search matches content, platform names and failure messages, case-insensitively. */
export function filterPosts(posts: Post[], filters: Filters): Post[] {
  const q = filters.search.trim().toLocaleLowerCase();
  return posts.filter((p) => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    // Platform filter is "any of": a post matches if it targets at least one selected platform.
    if (filters.platforms.length && !p.platforms.some((pl) => filters.platforms.includes(pl))) return false;
    if (q) {
      const haystack = [p.content, p.errorMessage ?? '', ...p.platforms.map((pl) => PLATFORM_BY_ID[pl].name)]
        .join(' ')
        .toLocaleLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface DayGroup {
  key: string;
  label: string;
  date?: string;
  posts: Post[];
}

/** Groups posts by local calendar day, days ascending and posts by time within each. */
export function groupByDay(posts: Post[], now: Date = new Date(), tz = localTimeZone()): DayGroup[] {
  const groups = new Map<string, Post[]>();
  for (const p of [...posts].sort(byTime)) {
    const key = dayKey(p.scheduledAt, tz);
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }
  return [...groups].map(([key, list]) => ({ key, ...dayLabel(key, now, tz), posts: list }));
}

export type StatusCounts = Record<'total' | PostStatus, number>;

export function countByStatus(posts: Post[]): StatusCounts {
  const counts: StatusCounts = { total: posts.length, scheduled: 0, published: 0, failed: 0 };
  for (const p of posts) counts[p.status]++;
  return counts;
}

/** Number of active filters, for the mobile "Filters (n)" badge. Search is excluded — it's always visible. */
export function activeFilterCount(filters: Filters): number {
  return filters.platforms.length + (filters.status === 'all' ? 0 : 1);
}

export function hasActiveFilters(filters: Filters): boolean {
  return filters.search.trim() !== '' || activeFilterCount(filters) > 0;
}

/** The soonest scheduled post that hasn't gone out yet. */
export function nextScheduled(posts: Post[], now: Date = new Date()): Post | undefined {
  const t = now.toISOString();
  return posts.filter((p) => p.status === 'scheduled' && p.scheduledAt > t).sort(byTime)[0];
}

/** The most recently published post. */
export function lastPublished(posts: Post[]): Post | undefined {
  return posts.filter((p) => p.status === 'published').sort(byTime).at(-1);
}

export interface WeekDay {
  key: string;
  count: number;
  isToday: boolean;
  isPast: boolean;
}

/**
 * Mon–Sun strip for the queue header, with post counts per day. `offset`
 * picks a week relative to this one (-1 = last week, 1 = next week).
 */
export function weekSummary(posts: Post[], now: Date = new Date(), tz = localTimeZone(), offset = 0): WeekDay[] {
  const today = dayKey(now, tz);
  const counts = new Map<string, number>();
  for (const p of posts) {
    const k = dayKey(p.scheduledAt, tz);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return weekKeys(now, tz).map((k) => addDaysToKey(k, offset * 7)).map((key) => ({
    key,
    count: counts.get(key) ?? 0,
    isToday: key === today,
    isPast: key < today,
  }));
}
