import type { Platform } from './platforms';

export type PostStatus = 'scheduled' | 'published' | 'failed';

/** Why a post failed. Drives the advice in the failed-posts banner. */
export type FailureCode = 'token_expired' | 'rate_limited' | 'media_required';

/** Machine-readable side of a failure, alongside the user-facing `errorMessage`. */
export interface PostFailure {
  code: FailureCode;
  platform: Platform;
}

export interface Post {
  id: string;
  content: string;
  platforms: Platform[];
  mediaUrl?: string;
  /** ISO 8601 instant (UTC). Displayed in the viewer's local time zone. */
  scheduledAt: string;
  status: PostStatus;
  /** Set on failed posts, e.g. "Instagram access token expired". */
  errorMessage?: string;
  failure?: PostFailure;
  createdAt: string;
  updatedAt: string;
}

/** What the composer submits for create and edit. */
export interface PostDraft {
  content: string;
  platforms: Platform[];
  mediaUrl?: string;
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
