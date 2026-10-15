// Mock backend. Simulates latency and failures and persists to localStorage,
// behind an async interface a real API client could later replace.

import type { Platform } from './platforms';
import { seedPosts, SEED_ACCOUNTS } from './seed';
import type { Accounts, Post, PostDraft } from './types';

/** Demo scenarios, chosen with `?mock=` in the URL. Non-default ones never persist. */
export type Scenario = 'default' | 'empty' | 'error' | 'slow';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: 'load_failed' | 'not_found' | 'invalid' | 'retry_failed',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RetryResult {
  post: Post;
  /** True when the original time had passed and the post was moved forward. */
  rescheduled: boolean;
}

export interface Api {
  listPosts(): Promise<Post[]>;
  getAccounts(): Promise<Accounts>;
  createPost(draft: PostDraft): Promise<Post>;
  updatePost(id: string, draft: PostDraft): Promise<Post>;
  deletePost(id: string): Promise<void>;
  retryPost(id: string): Promise<RetryResult>;
  reconnectAccount(platform: Platform): Promise<Accounts>;
  /** Dev helper: restore the demo posts, or clear everything. */
  reset(to: 'seed' | 'empty'): Promise<void>;
}

export interface MockApiOptions {
  scenario?: Scenario;
  /** Pass null to keep everything in memory. */
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  now?: () => Date;
  random?: () => number;
  /** [min, max] simulated latency in ms. */
  latency?: [number, number];
  /** Chance a rate-limited post succeeds on retry. */
  retrySuccessRate?: number;
}

const STORAGE_KEY = 'pp-data-v1';
const RETRY_BUFFER_MS = 5 * 60_000;

interface Db {
  version: 1;
  posts: Post[];
  accounts: Accounts;
}

const clone = <T>(v: T): T => structuredClone(v);

function newId(random: () => number): string {
  return globalThis.crypto?.randomUUID?.() ?? `p-${Date.now().toString(36)}-${random().toString(36).slice(2, 8)}`;
}

function defaultStorage(): MockApiOptions['storage'] {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function scenarioFromUrl(search = typeof location === 'undefined' ? '' : location.search): Scenario {
  const v = new URLSearchParams(search).get('mock');
  return v === 'empty' || v === 'error' || v === 'slow' ? v : 'default';
}

export function createMockApi(opts: MockApiOptions = {}): Api {
  const scenario = opts.scenario ?? 'default';
  const now = opts.now ?? (() => new Date());
  const random = opts.random ?? Math.random;
  const latency = opts.latency ?? (scenario === 'slow' ? [2000, 3000] : [350, 800]);
  const successRate = opts.retrySuccessRate ?? 0.7;
  // Demo scenarios stay in memory so they never clobber the user's saved data.
  const storage = scenario === 'default' ? (opts.storage === undefined ? defaultStorage() : opts.storage) : null;

  const db: Db = loadDb();

  function loadDb(): Db {
    if (scenario === 'empty') return { version: 1, posts: [], accounts: { ...SEED_ACCOUNTS } };
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Db;
        if (parsed.version === 1 && Array.isArray(parsed.posts)) return parsed;
      }
    } catch {
      // Corrupt or unreadable storage: fall through to fresh demo data.
    }
    return { version: 1, posts: seedPosts(now()), accounts: { ...SEED_ACCOUNTS } };
  }

  function save() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Quota or privacy mode — keep working in memory.
    }
  }

  function delay(): Promise<void> {
    const [min, max] = latency;
    const ms = min + random() * (max - min);
    return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
  }

  function find(id: string): Post {
    const post = db.posts.find((p) => p.id === id);
    if (!post) throw new ApiError('Post not found', 'not_found');
    return post;
  }

  function validate(draft: PostDraft) {
    if (!draft.content.trim()) throw new ApiError('Write something to post', 'invalid');
    if (!draft.platforms.length) throw new ApiError('Select at least one platform', 'invalid');
    if (new Date(draft.scheduledAt).getTime() <= now().getTime())
      throw new ApiError('Scheduled time must be in the future', 'invalid');
  }

  return {
    async listPosts() {
      await delay();
      if (scenario === 'error') throw new ApiError("Couldn't load posts", 'load_failed');
      save(); // Persist freshly seeded data on first load.
      return clone(db.posts);
    },

    async getAccounts() {
      await delay();
      return clone(db.accounts);
    },

    async createPost(draft) {
      await delay();
      validate(draft);
      const stamp = now().toISOString();
      const post: Post = {
        id: newId(random),
        content: draft.content,
        platforms: [...draft.platforms],
        imageUrl: draft.imageUrl || undefined,
        scheduledAt: draft.scheduledAt,
        status: 'scheduled',
        createdAt: stamp,
        updatedAt: stamp,
      };
      db.posts.push(post);
      save();
      return clone(post);
    },

    async updatePost(id, draft) {
      await delay();
      const post = find(id);
      validate(draft);
      // Editing a post re-queues it, clearing any previous failure.
      Object.assign(post, {
        content: draft.content,
        platforms: [...draft.platforms],
        imageUrl: draft.imageUrl || undefined,
        scheduledAt: draft.scheduledAt,
        status: 'scheduled',
        error: undefined,
        updatedAt: now().toISOString(),
      } satisfies Partial<Post>);
      save();
      return clone(post);
    },

    async deletePost(id) {
      await delay();
      find(id);
      db.posts = db.posts.filter((p) => p.id !== id);
      save();
    },

    async retryPost(id) {
      await delay();
      const post = find(id);
      if (post.status !== 'failed' || !post.error) throw new ApiError('Only failed posts can be retried', 'invalid');

      const { code, platform } = post.error;
      const ok =
        code === 'token_expired'
          ? db.accounts[platform] === 'connected'
          : code === 'media_required'
            ? !post.platforms.includes(platform) // Fixed only by editing the post.
            : random() < successRate;
      if (!ok) throw new ApiError('Retry failed — please try again', 'retry_failed');

      const earliest = now().getTime() + RETRY_BUFFER_MS;
      const rescheduled = new Date(post.scheduledAt).getTime() < earliest;
      if (rescheduled) post.scheduledAt = new Date(earliest).toISOString();
      post.status = 'scheduled';
      post.error = undefined;
      post.updatedAt = now().toISOString();
      save();
      return { post: clone(post), rescheduled };
    },

    async reconnectAccount(platform) {
      await delay();
      db.accounts[platform] = 'connected';
      save();
      return clone(db.accounts);
    },

    async reset(to) {
      db.posts = to === 'seed' ? seedPosts(now()) : [];
      db.accounts = { ...SEED_ACCOUNTS };
      save();
    },
  };
}
