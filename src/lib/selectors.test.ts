import { describe, expect, it } from 'vitest';
import { seedPosts } from './seed';
import {
  activeFilterCount,
  countByStatus,
  EMPTY_FILTERS,
  filterPosts,
  groupByDay,
  hasActiveFilters,
  lastPublished,
  nextScheduled,
  weekSummary,
} from './selectors';
import type { Filters } from './types';

const IST = 'Asia/Kolkata';
// Wed 14 Oct 2026, 9:00 AM IST — the morning of the mockup's "Today".
const NOW = new Date('2026-10-14T03:30:00Z');
const posts = seedPosts(NOW, IST);
const f = (patch: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...patch });

describe('seed data', () => {
  it('matches the mockup summary counts', () => {
    expect(countByStatus(posts)).toEqual({ total: 9, scheduled: 5, published: 1, failed: 3 });
  });

  it('keeps published posts in the past and scheduled ones in the future at any hour', () => {
    for (const hourUtc of [0, 3, 9, 15, 18, 23]) {
      const now = new Date(Date.UTC(2026, 9, 14, hourUtc, 15));
      for (const p of seedPosts(now, IST)) {
        const t = new Date(p.scheduledAt).getTime();
        if (p.status === 'published') expect(t).toBeLessThanOrEqual(now.getTime());
        if (p.status === 'scheduled') expect(t).toBeGreaterThan(now.getTime());
      }
    }
  });
});

describe('groupByDay', () => {
  it('groups like the mockup: Today 4, Tomorrow 2, Fri 2, Sat 1', () => {
    const groups = groupByDay(posts, NOW, IST);
    expect(groups.map((g) => [g.label, g.posts.length])).toEqual([
      ['Today', 4],
      ['Tomorrow', 2],
      ['Fri, 16 Oct', 2],
      ['Sat, 17 Oct', 1],
    ]);
    expect(groups[0].date).toBe('Wed, 14 Oct');
  });

  it('orders posts by time within a day', () => {
    const today = groupByDay(posts, NOW, IST)[0].posts.map((p) => p.scheduledAt);
    expect(today).toEqual([...today].sort());
  });

  it('returns nothing for no posts', () => {
    expect(groupByDay([], NOW, IST)).toEqual([]);
  });
});

describe('filterPosts', () => {
  it('filters by status', () => {
    expect(filterPosts(posts, f({ status: 'failed' }))).toHaveLength(3);
    expect(filterPosts(posts, f({ status: 'published' }))).toHaveLength(1);
  });

  it('matches any selected platform', () => {
    expect(filterPosts(posts, f({ platforms: ['tiktok'] }))).toHaveLength(4);
    expect(filterPosts(posts, f({ platforms: ['tiktok', 'x'] }))).toHaveLength(7);
  });

  it('searches content, platform names and error messages, ignoring case', () => {
    expect(filterPosts(posts, f({ search: 'DIWALI' }))).toHaveLength(3);
    expect(filterPosts(posts, f({ search: 'token expired' }))).toHaveLength(1);
    expect(filterPosts(posts, f({ search: '  holi ' }))).toHaveLength(0);
  });

  it('combines filters', () => {
    const result = filterPosts(posts, f({ platforms: ['tiktok'], status: 'failed' }));
    expect(result.map((p) => p.content)).toEqual(['Behind the scenes of our new autumn shoot 📸']);
  });
});

describe('filter state helpers', () => {
  it('counts platform and status filters but not search', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount(f({ platforms: ['instagram', 'tiktok'], status: 'failed', search: 'x' }))).toBe(3);
  });

  it('treats search as an active filter for "Clear filters"', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters(f({ search: 'holi' }))).toBe(true);
    expect(hasActiveFilters(f({ search: '   ' }))).toBe(false);
  });
});

describe('nextScheduled', () => {
  it('finds the soonest upcoming scheduled post', () => {
    expect(nextScheduled(posts, NOW)?.content).toMatch(/^Festive gift hampers/);
  });
});

describe('lastPublished', () => {
  it('finds the latest published post, or nothing', () => {
    expect(lastPublished(posts)?.content).toMatch(/^Diwali Mega Sale is LIVE/);
    expect(lastPublished(posts.filter((p) => p.status !== 'published'))).toBeUndefined();
  });
});

describe('weekSummary', () => {
  it('matches the mockup week strip', () => {
    const week = weekSummary(posts, NOW, IST);
    expect(week.map((d) => d.count)).toEqual([0, 0, 4, 2, 2, 1, 0]);
    expect(week.findIndex((d) => d.isToday)).toBe(2);
    expect(week.filter((d) => d.isPast)).toHaveLength(2);
  });
});
