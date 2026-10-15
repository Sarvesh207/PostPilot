// Demo posts mirroring the mockups, laid out relative to "now" so Today and
// Tomorrow always have content whenever the app is opened.

import { addDaysToKey, dayKey, localTimeZone, zonedToIso } from './dates';
import type { Platform } from './platforms';
import type { Accounts, Post, PostError, PostStatus } from './types';

interface SeedSpec {
  day: number;
  time: string;
  status: PostStatus;
  platforms: Platform[];
  content: string;
  image?: string;
  error?: PostError;
}

const CDN = 'https://cdn.yourbrand.in/campaigns';

const SPECS: SeedSpec[] = [
  {
    day: 0,
    time: '10:00',
    status: 'published',
    platforms: ['facebook', 'instagram', 'x'],
    content: 'Diwali Mega Sale is LIVE 🪔 Flat 40% off on all ethnic wear. Shop now before stocks run out!',
    image: `${CDN}/diwali-sale-hero.jpg`,
  },
  {
    day: 0,
    time: '14:30',
    status: 'failed',
    platforms: ['instagram'],
    content: 'Our Navratri lookbook goes live tonight. Tap the link in bio for early access to the full collection.',
    error: { code: 'token_expired', platform: 'instagram', message: 'Instagram access token expired' },
  },
  {
    day: 0,
    time: '18:00',
    status: 'failed',
    platforms: ['tiktok', 'instagram'],
    content: 'Behind the scenes of our new autumn shoot 📸',
    image: `${CDN}/autumn-bts.jpg`,
    error: { code: 'media_required', platform: 'tiktok', message: 'TikTok video upload required' },
  },
  {
    day: 0,
    time: '20:00',
    status: 'scheduled',
    platforms: ['facebook', 'instagram'],
    content:
      'Festive gift hampers are back. Handpicked sweets, diyas and dry fruits in curated boxes from ₹999. Pre-order today and we will deliver before Dhanteras, anywhere in Pune and Mumbai.',
    image: `${CDN}/gift-hampers.jpg`,
  },
  {
    day: 1,
    time: '10:00',
    status: 'scheduled',
    platforms: ['facebook', 'x'],
    content: 'Flash deal at 10 AM: 25% off on silk sarees for the next 6 hours only. No code needed.',
  },
  {
    day: 1,
    time: '13:00',
    status: 'failed',
    platforms: ['x', 'instagram'],
    content: 'New on the menu: masala chai cold brew 🧋 Available at all Pune outlets from Friday.',
    error: { code: 'rate_limited', platform: 'x', message: 'X API rate limit exceeded' },
  },
  {
    day: 2,
    time: '11:00',
    status: 'scheduled',
    platforms: ['facebook', 'instagram', 'tiktok'],
    content: 'Weekend workshop: learn latte art with our head barista ☕ Limited seats.',
    image: `${CDN}/latte-workshop.jpg`,
  },
  {
    day: 2,
    time: '19:30',
    status: 'scheduled',
    platforms: ['instagram', 'tiktok'],
    content: 'Diwali lookbook drops tomorrow. Turn on notifications so you do not miss it.',
  },
  {
    day: 3,
    time: '09:00',
    status: 'scheduled',
    platforms: ['facebook', 'instagram', 'x', 'tiktok'],
    content:
      'Last chance: the Diwali Mega Sale ends at midnight. Flat 40% off on all ethnic wear, free shipping above ₹1,499.',
    image: `${CDN}/diwali-last-call.jpg`,
  },
];

const HOUR = 3_600_000;

export function seedPosts(now: Date = new Date(), tz = localTimeZone()): Post[] {
  const today = dayKey(now, tz);
  const created = new Date(now.getTime() - 48 * HOUR).toISOString();

  return SPECS.map((s, i) => {
    let at = new Date(zonedToIso(addDaysToKey(today, s.day), s.time, tz));
    // Keep the demo coherent at any time of day: published posts are in the
    // past and scheduled ones in the future.
    if (s.status === 'published' && at > now) at = new Date(now.getTime() - HOUR / 2);
    if (s.status === 'scheduled' && at <= now) at = new Date(now.getTime() + (i + 1) * HOUR);

    return {
      id: `seed-${i + 1}`,
      content: s.content,
      platforms: s.platforms,
      imageUrl: s.image,
      scheduledAt: at.toISOString(),
      status: s.status,
      error: s.error,
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
