// App state without a library: a plain object, an action set that replaces it
// immutably, and React's useSyncExternalStore to subscribe components.

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ApiError, createMockApi, scenarioFromUrl, type Api } from './api';
import type { Platform } from './platforms';
import {
  activeFilterCount,
  countByStatus,
  EMPTY_FILTERS,
  filterPosts,
  groupByDay,
  hasActiveFilters,
  nextScheduled,
  weekSummary,
} from './selectors';
import type { Accounts, Filters, Post, PostDraft, StatusFilter } from './types';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface AppState {
  posts: Post[];
  accounts: Accounts | null;
  load: LoadState;
  filters: Filters;
  /** Ids of posts with a retry in flight. */
  retrying: Readonly<Partial<Record<string, true>>>;
  /** Platforms with a reconnect in flight. */
  reconnecting: Readonly<Partial<Record<Platform, true>>>;
}

export type RetryOutcome = { ok: true; post: Post; rescheduled: boolean } | { ok: false; message: string };

const errorMessage = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export function createAppStore(api: Api) {
  let state: AppState = {
    posts: [],
    accounts: null,
    load: 'idle',
    filters: EMPTY_FILTERS,
    retrying: {},
    reconnecting: {},
  };
  const listeners = new Set<() => void>();

  const getState = () => state;
  const setState = (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };

  const replacePost = (post: Post) =>
    setState((s) => ({ posts: s.posts.map((p) => (p.id === post.id ? post : p)) }));

  const without = <K extends string>(rec: Readonly<Partial<Record<K, true>>>, key: K) => {
    const next = { ...rec };
    delete next[key];
    return next;
  };

  const setFilters = (patch: Partial<Filters>) => setState((s) => ({ filters: { ...s.filters, ...patch } }));

  const actions = {
    async load() {
      setState({ load: 'loading' });
      try {
        const [posts, accounts] = await Promise.all([api.listPosts(), api.getAccounts()]);
        setState({ posts, accounts, load: 'ready' });
      } catch {
        setState({ load: 'error' });
      }
    },

    /** Throws ApiError with a user-facing message if the server rejects the draft. */
    async createPost(draft: PostDraft): Promise<Post> {
      const post = await api.createPost(draft);
      setState((s) => ({ posts: [...s.posts, post] }));
      return post;
    },

    async updatePost(id: string, draft: PostDraft): Promise<Post> {
      const post = await api.updatePost(id, draft);
      replacePost(post);
      return post;
    },

    /** Optimistic: the card disappears at once and comes back if the server refuses. */
    async deletePost(id: string): Promise<void> {
      const before = state.posts;
      setState((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
      try {
        await api.deletePost(id);
      } catch (e) {
        setState({ posts: before });
        throw e;
      }
    },

    /** Never throws: the outcome drives the success / failure toast. */
    async retryPost(id: string): Promise<RetryOutcome> {
      if (state.retrying[id]) return { ok: false, message: 'Already retrying' };
      setState((s) => ({ retrying: { ...s.retrying, [id]: true } }));
      try {
        const { post, rescheduled } = await api.retryPost(id);
        replacePost(post);
        return { ok: true, post, rescheduled };
      } catch (e) {
        return { ok: false, message: errorMessage(e, 'Retry failed — please try again') };
      } finally {
        setState((s) => ({ retrying: without(s.retrying, id) }));
      }
    },

    async reconnectAccount(platform: Platform): Promise<void> {
      setState((s) => ({ reconnecting: { ...s.reconnecting, [platform]: true } }));
      try {
        const accounts = await api.reconnectAccount(platform);
        setState({ accounts });
      } finally {
        setState((s) => ({ reconnecting: without(s.reconnecting, platform) }));
      }
    },

    async resetDemo(to: 'seed' | 'empty') {
      await api.reset(to);
      await actions.load();
    },

    setSearch: (search: string) => setFilters({ search }),
    setStatusFilter: (status: StatusFilter) => setFilters({ status }),
    setPlatformFilter: (platforms: Platform[]) => setFilters({ platforms }),
    togglePlatformFilter: (platform: Platform) =>
      setState((s) => {
        const list = s.filters.platforms;
        return {
          filters: {
            ...s.filters,
            platforms: list.includes(platform) ? list.filter((p) => p !== platform) : [...list, platform],
          },
        };
      }),
    clearFilters: () => setState({ filters: EMPTY_FILTERS }),
  };

  return { getState, subscribe, actions };
}

export type AppStore = ReturnType<typeof createAppStore>;

export const appStore = createAppStore(createMockApi({ scenario: scenarioFromUrl() }));
export const actions = appStore.actions;

/**
 * Subscribe to a slice of state. The selector must return something already in
 * state (or a primitive) — derive new arrays/objects with useMemo instead, or
 * useSyncExternalStore will loop.
 */
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getState()),
    () => selector(appStore.getState()),
  );
}

/** Current time, refreshed on an interval so "Today" rolls over at midnight. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Everything the queue screen renders, derived once per change. */
export function useQueueView() {
  const posts = useAppState((s) => s.posts);
  const filters = useAppState((s) => s.filters);
  const now = useNow();

  return useMemo(() => {
    const visible = filterPosts(posts, filters);
    return {
      groups: groupByDay(visible, now),
      visibleCount: visible.length,
      counts: countByStatus(posts),
      week: weekSummary(posts, now),
      next: nextScheduled(posts, now),
      filterCount: activeFilterCount(filters),
      filtersActive: hasActiveFilters(filters),
      now,
    };
  }, [posts, filters, now]);
}
