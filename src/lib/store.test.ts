import { describe, expect, it } from 'vitest';
import { ApiError, createMockApi, type Api } from './api';
import { createAppStore } from './store';

const NOW = new Date('2026-10-14T03:30:00Z');

function setup(overrides: Partial<Api> = {}, random = () => 0.5) {
  const api = { ...createMockApi({ storage: null, latency: [0, 0], now: () => NOW, random }), ...overrides };
  return createAppStore(api);
}

describe('createAppStore', () => {
  it('loads posts and accounts', async () => {
    const store = setup();
    const states: string[] = [];
    store.subscribe(() => states.push(store.getState().load));
    await store.actions.load();
    expect(states).toEqual(['loading', 'ready']);
    expect(store.getState().posts).toHaveLength(9);
    expect(store.getState().accounts?.instagram).toBe('expired');
  });

  it('enters the error state when loading fails', async () => {
    const store = setup({ listPosts: () => Promise.reject(new ApiError("Couldn't load posts", 'load_failed')) });
    await store.actions.load();
    expect(store.getState().load).toBe('error');
    // Accounts load independently, so the sidebar isn't stuck on skeletons.
    expect(store.getState().accounts?.facebook).toBe('connected');
  });

  it('flags a post as retrying while the request is in flight', async () => {
    const store = setup({}, () => 0.1);
    await store.actions.load();
    const post = store.getState().posts.find((p) => p.error?.code === 'rate_limited')!;

    const pending = store.actions.retryPost(post.id);
    expect(store.getState().retrying[post.id]).toBe(true);
    // A second click while retrying is ignored.
    expect(await store.actions.retryPost(post.id)).toEqual({ ok: false, message: 'Already retrying' });

    const outcome = await pending;
    expect(outcome.ok).toBe(true);
    expect(store.getState().retrying[post.id]).toBeUndefined();
    expect(store.getState().posts.find((p) => p.id === post.id)?.status).toBe('scheduled');
  });

  it('reports a failed retry without throwing', async () => {
    const store = setup();
    await store.actions.load();
    const post = store.getState().posts.find((p) => p.error?.code === 'token_expired')!;
    expect(await store.actions.retryPost(post.id)).toEqual({ ok: false, message: 'Retry failed — please try again' });
    expect(store.getState().retrying).toEqual({});
  });

  it('removes a deleted post at once and restores it if the server refuses', async () => {
    let reject!: (e: Error) => void;
    const store = setup({ deletePost: () => new Promise<void>((_, r) => (reject = r)) });
    await store.actions.load();
    const id = store.getState().posts[0].id;

    const pending = store.actions.deletePost(id);
    expect(store.getState().posts.some((p) => p.id === id)).toBe(false);
    reject(new Error('offline'));
    await expect(pending).rejects.toThrow('offline');
    expect(store.getState().posts.some((p) => p.id === id)).toBe(true);
  });

  it('reconnects an account', async () => {
    const store = setup();
    await store.actions.load();
    const pending = store.actions.reconnectAccount('instagram');
    expect(store.getState().reconnecting.instagram).toBe(true);
    await pending;
    expect(store.getState().accounts?.instagram).toBe('connected');
    expect(store.getState().reconnecting).toEqual({});
  });

  it('toggles and clears filters', () => {
    const { actions, getState } = setup();
    actions.togglePlatformFilter('instagram');
    actions.togglePlatformFilter('tiktok');
    actions.togglePlatformFilter('instagram');
    actions.setStatusFilter('failed');
    actions.setSearch('holi');
    expect(getState().filters).toEqual({ search: 'holi', platforms: ['tiktok'], status: 'failed' });
    actions.clearFilters();
    expect(getState().filters).toEqual({ search: '', platforms: [], status: 'all' });
  });
});
