export type Platform = 'facebook' | 'instagram' | 'x' | 'tiktok';

export interface PlatformMeta {
  id: Platform;
  name: string;
  /** Maximum characters per post. */
  limit: number;
}

export const PLATFORMS: readonly PlatformMeta[] = [
  { id: 'facebook', name: 'Facebook', limit: 5000 },
  { id: 'instagram', name: 'Instagram', limit: 2200 },
  { id: 'x', name: 'X', limit: 280 },
  { id: 'tiktok', name: 'TikTok', limit: 2200 },
];

export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
  Platform,
  PlatformMeta
>;
