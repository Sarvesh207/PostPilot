// Demo posts from src/data/posts.json. The file holds real UTC timestamps
// around a fixed "today" (anchorDay); they're shifted by whole days so Today
// and Tomorrow always have content whenever the app is opened.

import seed from '../data/posts.json';
import { dayKey, daysBetween, localTimeZone } from './dates';
import type { Accounts, Post } from './types';

interface SeedFile {
  anchorDay: string;
  posts: Omit<Post, 'createdAt' | 'updatedAt'>[];
}

const SEED = seed as SeedFile;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function seedPosts(now: Date = new Date(), tz = localTimeZone()): Post[] {
  const shift = daysBetween(SEED.anchorDay, dayKey(now, tz)) * DAY;
  const created = new Date(now.getTime() - 48 * HOUR).toISOString();

  return SEED.posts.map((p, i) => {
    let at = new Date(new Date(p.scheduledAt).getTime() + shift);
    // Keep the demo coherent at any time of day: published posts are in the
    // past and scheduled ones in the future.
    if (p.status === 'published' && at > now) at = new Date(now.getTime() - HOUR / 2);
    if (p.status === 'scheduled' && at <= now) at = new Date(now.getTime() + (i + 1) * HOUR);

    return {
      ...structuredClone(p),
      scheduledAt: at.toISOString(),
      createdAt: created,
      updatedAt: created,
    };
  });
}

export const SEED_ACCOUNTS: Accounts = {
  facebook: 'connected',
  instagram: 'expired',
  x: 'connected',
  tiktok: 'connected',
};
