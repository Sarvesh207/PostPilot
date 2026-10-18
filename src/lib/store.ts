// App state without a library: a plain object, actions that replace it
// immutably, and React's useSyncExternalStore (via createStore) to subscribe.

import { useEffect, useMemo, useState } from 'react';
import { ApiError, createMockApi, retryScheduledAt, scenarioFromUrl, type Api } from './api';
import { createStore } from './createStore';
import { filtersFromSearch, filtersToSearch } from './filterParams';
import type { Platform } from './platforms';
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

export function createAppStore(api: Api, initialFilters: Filters = EMPTY_FILTERS) {
  const { getState, setState, subscribe, useStore } = createStore<AppState>({
    posts: [],
    accounts: null,
    load: 'idle',
    filters: initialFilters,
    retrying: {},
    reconnecting: {},
  });

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
      // Independent requests: accounts still show in the sidebar if posts fail.
      const [posts, accounts] = await Promise.allSettled([api.listPosts(), api.getAccounts()]);
      setState({
        ...(accounts.status === 'fulfilled' && { accounts: accounts.value }),
        ...(posts.status === 'fulfilled' ? { posts: posts.value, load: 'ready' as const } : { load: 'error' as const }),
      });
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
      const before = getState().posts;
      setState((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
      try {
        await api.deletePost(id);
      } catch (e) {
        setState({ posts: before });
        throw e;
      }
    },

    /**
     * Optimistic: the post shows as scheduled at once and goes back to failed,
     * with its error, if the server refuses. Never throws: the outcome drives
     * the success / failure toast.
     */
    async retryPost(id: string): Promise<RetryOutcome> {
      const original = getState().posts.find((p) => p.id === id);
      if (getState().retrying[id]) return { ok: false, message: 'Already retrying' };
      if (!original || original.status !== 'failed') return { ok: false, message: 'Only failed posts can be retried' };

      const optimistic: Post = {
        ...original,
        status: 'scheduled',
        scheduledAt: retryScheduledAt(original.scheduledAt, new Date()),
        errorMessage: undefined,
        failure: undefined,
      };
      setState((s) => ({
        posts: s.posts.map((p) => (p.id === id ? optimistic : p)),
        retrying: { ...s.retrying, [id]: true },
      }));
      try {
        const { post, rescheduled } = await api.retryPost(id);
        replacePost(post);
        return { ok: true, post, rescheduled };
      } catch (e) {
        // Roll back, unless the post was edited or deleted in the meantime.
        setState((s) => ({ posts: s.posts.map((p) => (p === optimistic ? original : p)) }));
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
    replaceFilters: (filters: Filters) => setState({ filters }),
  };

  return { getState, subscribe, useStore, actions };
}

export type AppStore = ReturnType<typeof createAppStore>;

export const appStore = createAppStore(
  createMockApi({ scenario: scenarioFromUrl() }),
  filtersFromSearch(typeof location === 'undefined' ? '' : location.search),
);
export const actions = appStore.actions;

/**
 * Mirrors filters into the query string. replaceState, not pushState, so
 * typing a search doesn't add a history entry per keystroke.
 */
export function syncFiltersWithUrl(store: AppStore = appStore): () => void {
  let last = store.getState().filters;
  const unsubscribe = store.subscribe(() => {
    const { filters } = store.getState();
    if (filters === last) return;
    last = filters;
    const search = filtersToSearch(filters, location.search);
    if (search !== location.search) history.replaceState(history.state, '', location.pathname + search + location.hash);
  });
  // Back/forward between pages restores whatever filters that URL carries.
  const onPop = () => store.actions.replaceFilters((last = filtersFromSearch(location.search)));
  window.addEventListener('popstate', onPop);
  return () => {
    unsubscribe();
    window.removeEventListener('popstate', onPop);
  };
}

/** Subscribe to a slice of app state (see createStore for the selector rule). */
export const useAppState = appStore.useStore;

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
  const retrying = useAppState((s) => s.retrying);
  const now = useNow();

  return useMemo(() => {
    // A post being retried is already optimistically "scheduled"; keep it on
    // screen (e.g. under the Failed filter) until the server answers.
    const matched = new Set(filterPosts(posts, filters));
    const visible = posts.filter((p) => matched.has(p) || retrying[p.id]);
    const groups = groupByDay(visible, now);
    // Last week, this week and next week, for the header carousel.
    const weeks = [-1, 0, 1].map((offset) => weekSummary(posts, now, undefined, offset));
    const week = weeks[1];
    return {
      groups,
      groupKeys: new Set(groups.map((g) => g.key)),
      visibleCount: visible.length,
      counts: countByStatus(posts),
      failed: posts.filter((p) => p.status === 'failed'),
      weeks,
      weekCount: week.reduce((n, d) => n + d.count, 0),
      next: nextScheduled(posts, now),
      lastPublished: lastPublished(posts),
      filterCount: activeFilterCount(filters),
      filtersActive: hasActiveFilters(filters),
      now,
    };
  }, [posts, filters, retrying, now]);
}
