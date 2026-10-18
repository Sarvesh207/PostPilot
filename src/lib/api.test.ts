import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockApi, scenarioFromUrl, type MockApiOptions } from './api';
import { zonedToIso } from './dates';
import type { PostDraft } from './types';

// Wed 14 Oct 2026, 9:00 AM IST.
const NOW = new Date('2026-10-14T03:30:00Z');

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

function makeApi(opts: MockApiOptions = {}) {
  return createMockApi({ storage: null, latency: [0, 0], retryDelay: 0, now: () => NOW, ...opts });
}

const draft = (patch: Partial<PostDraft> = {}): PostDraft => ({
  content: 'Weekend workshop: learn latte art ☕',
  platforms: ['instagram'],
  scheduledAt: '2026-10-15T04:30:00.000Z',
  ...patch,
});

async function findByContent(api: ReturnType<typeof makeApi>, start: string) {
  const post = (await api.listPosts()).find((p) => p.content.startsWith(start));
  if (!post) throw new Error(`no seed post starting "${start}"`);
  return post;
}

describe('listPosts', () => {
  it('starts with the demo posts', async () => {
    expect(await makeApi().listPosts()).toHaveLength(32);
  });

  it('returns copies, so callers cannot mutate the store', async () => {
    const api = makeApi();
    (await api.listPosts())[0].content = 'changed';
    expect((await api.listPosts())[0].content).not.toBe('changed');
  });

  it('fails in the error scenario', async () => {
    await expect(makeApi({ scenario: 'error' }).listPosts()).rejects.toMatchObject({ code: 'load_failed' });
  });

  it('starts empty in the empty scenario', async () => {
    expect(await makeApi({ scenario: 'empty' }).listPosts()).toEqual([]);
  });
});

describe('createPost', () => {
  it('schedules a valid post', async () => {
    const api = makeApi();
    const post = await api.createPost(draft({ mediaUrl: '' }));
    expect(post).toMatchObject({ status: 'scheduled', platforms: ['instagram'] });
    expect(post.mediaUrl).toBeUndefined();
    expect(await api.listPosts()).toHaveLength(33);
  });

  it('rejects drafts the composer should have blocked', async () => {
    const api = makeApi();
    await expect(api.createPost(draft({ platforms: [] }))).rejects.toThrow('Select at least one platform');
    await expect(api.createPost(draft({ content: '  ' }))).rejects.toThrow('Write something to post');
    await expect(api.createPost(draft({ scheduledAt: zonedToIso('2026-10-12', '18:00', 'Asia/Kolkata') }))).rejects.toThrow(
      'Scheduled time must be in the future',
    );
  });
});

describe('updatePost / deletePost', () => {
  it('editing a failed post re-queues it', async () => {
    const api = makeApi();
    const failed = await findByContent(api, 'Behind the scenes');
    const updated = await api.updatePost(failed.id, draft({ content: failed.content, platforms: ['instagram'] }));
    expect(updated.status).toBe('scheduled');
    expect(updated).toMatchObject({ errorMessage: undefined, failure: undefined });
  });

  it('deletes, then reports the post as missing', async () => {
    const api = makeApi();
    const [first] = await api.listPosts();
    await api.deletePost(first.id);
    expect(await api.listPosts()).toHaveLength(31);
    await expect(api.deletePost(first.id)).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('retryPost', () => {
  afterEach(() => vi.useRealTimers());

  it('fails 20% of the time', async () => {
    const unlucky = makeApi({ random: () => 0.1 });
    await expect(unlucky.retryPost((await findByContent(unlucky, 'Our Navratri')).id)).rejects.toMatchObject({
      code: 'retry_failed',
      message: 'Retry failed — please try again',
    });

    const lucky = makeApi({ random: () => 0.2 });
    const { post: retried, rescheduled } = await lucky.retryPost((await findByContent(lucky, 'Our Navratri')).id);
    expect(retried).toMatchObject({ status: 'scheduled', errorMessage: undefined, failure: undefined });
    expect(rescheduled).toBe(false); // 2:30 PM is still ahead of 9:00 AM.
  });

  it('takes one second', async () => {
    vi.useFakeTimers();
    const api = makeApi({ retryDelay: undefined, random: () => 0.5 });
    const post = await findByContent(api, 'Our Navratri');
    let settled = false;
    void api.retryPost(post.id).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
  });

  it('moves a post whose time has passed to a few minutes from now', async () => {
    let now = NOW;
    const api = makeApi({ now: () => now, random: () => 0.5 });
    const post = await findByContent(api, 'Our Navratri');

    now = new Date('2026-10-14T09:30:00Z'); // 3:00 PM IST, after the 2:30 PM slot.
    const { post: retried, rescheduled } = await api.retryPost(post.id);
    expect(rescheduled).toBe(true);
    expect(retried.scheduledAt).toBe('2026-10-14T09:35:00.000Z');
  });

  it('refuses posts that have not failed', async () => {
    const api = makeApi();
    const scheduled = (await api.listPosts()).find((p) => p.status === 'scheduled')!;
    await expect(api.retryPost(scheduled.id)).rejects.toMatchObject({ code: 'invalid' });
  });
});

describe('reset', () => {
  it('clears posts but keeps accounts', async () => {
    const api = makeApi();
    await api.reconnectAccount('instagram');
    await api.reset('empty');
    expect(await api.listPosts()).toEqual([]);
    expect((await api.getAccounts()).instagram).toBe('connected');
  });

  it('restores the demo posts and accounts', async () => {
    const api = makeApi();
    await api.reconnectAccount('instagram');
    await api.reset('seed');
    expect(await api.listPosts()).toHaveLength(32);
    expect((await api.getAccounts()).instagram).toBe('expired');
  });
});

describe('persistence', () => {
  it('reloads saved posts from storage', async () => {
    const storage = memoryStorage();
    const first = makeApi({ storage });
    await first.listPosts();
    await first.createPost(draft());

    expect(await makeApi({ storage }).listPosts()).toHaveLength(33);
  });

  it('falls back to demo data when storage is corrupt', async () => {
    const storage = memoryStorage();
    storage.setItem('pp-data-v1', '{not json');
    expect(await makeApi({ storage }).listPosts()).toHaveLength(32);
  });

  it('never writes demo scenarios to storage', async () => {
    const storage = memoryStorage();
    await makeApi({ storage, scenario: 'empty' }).listPosts();
    expect(storage.getItem('pp-data-v1')).toBeNull();
  });
});

describe('scenarioFromUrl', () => {
  it('reads ?mock= and ignores unknown values', () => {
    expect(scenarioFromUrl('?mock=error')).toBe('error');
    expect(scenarioFromUrl('?mock=nope')).toBe('default');
    expect(scenarioFromUrl('')).toBe('default');
  });
});
