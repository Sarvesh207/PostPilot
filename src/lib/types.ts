import type { Platform } from './platforms';

export type PostStatus = 'scheduled' | 'published' | 'failed';

/** Why a post failed. Drives the retry rules in the mock API. */
export type FailureCode = 'token_expired' | 'rate_limited' | 'media_required';

export interface PostError {
  code: FailureCode;
  platform: Platform;
  /** User-facing line shown on the card, e.g. "Instagram access token expired". */
  message: string;
}

export interface Post {
  id: string;
  content: string;
  platforms: Platform[];
  imageUrl?: string;
  /** ISO 8601 instant (UTC). Displayed in the viewer's local time zone. */
  scheduledAt: string;
  status: PostStatus;
  error?: PostError;
  createdAt: string;
  updatedAt: string;
}

/** What the composer submits for create and edit. */
export interface PostDraft {
  content: string;
  platforms: Platform[];
  imageUrl?: string;
  scheduledAt: string;
}

export type AccountStatus = 'connected' | 'expired';

export type Accounts = Record<Platform, AccountStatus>;

export type StatusFilter = 'all' | PostStatus;

export interface Filters {
  search: string;
  platforms: Platform[];
  status: StatusFilter;
}
