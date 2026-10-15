import { describe, expect, it } from 'vitest';
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
  return createMockApi({ storage: null, latency: [0, 0], now: () => NOW, ...opts });
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
    expect(await makeApi().listPosts()).toHaveLength(9);
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
    const post = await api.createPost(draft({ imageUrl: '' }));
    expect(post).toMatchObject({ status: 'scheduled', platforms: ['instagram'] });
    expect(post.imageUrl).toBeUndefined();
    expect(await api.listPosts()).toHaveLength(10);
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
    expect(updated.error).toBeUndefined();
  });

  it('deletes, then reports the post as missing', async () => {
    const api = makeApi();
    const [first] = await api.listPosts();
    await api.deletePost(first.id);
    expect(await api.listPosts()).toHaveLength(8);
    await expect(api.deletePost(first.id)).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('retryPost', () => {
  it('keeps failing an expired-token post until the account is reconnected', async () => {
    const api = makeApi();
    const post = await findByContent(api, 'Our Navratri');
    await expect(api.retryPost(post.id)).rejects.toMatchObject({ code: 'retry_failed' });

    await api.reconnectAccount('instagram');
    const { post: retried, rescheduled } = await api.retryPost(post.id);
    expect(retried.status).toBe('scheduled');
    expect(retried.error).toBeUndefined();
    expect(rescheduled).toBe(false); // 2:30 PM is still ahead of 9:00 AM.
  });

  it('succeeds or fails a rate-limited post by chance', async () => {
    const unlucky = makeApi({ random: () => 0.9 });
    await expect(unlucky.retryPost((await findByContent(unlucky, 'New on the menu')).id)).rejects.toThrow(
      'Retry failed — please try again',
    );

    const lucky = makeApi({ random: () => 0.1 });
    const { post } = await lucky.retryPost((await findByContent(lucky, 'New on the menu')).id);
    expect(post.status).toBe('scheduled');
  });

  it('cannot fix a missing TikTok video by retrying', async () => {
    const api = makeApi({ random: () => 0 });
    await expect(api.retryPost((await findByContent(api, 'Behind the scenes')).id)).rejects.toMatchObject({
      code: 'retry_failed',
    });
  });

  it('moves a post whose time has passed to a few minutes from now', async () => {
    let now = NOW;
    const api = makeApi({ now: () => now });
    const post = await findByContent(api, 'Our Navratri');
    await api.reconnectAccount('instagram');

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

describe('persistence', () => {
  it('reloads saved posts from storage', async () => {
    const storage = memoryStorage();
    const first = makeApi({ storage });
    await first.listPosts();
    await first.createPost(draft());

    expect(await makeApi({ storage }).listPosts()).toHaveLength(10);
  });

  it('falls back to demo data when storage is corrupt', async () => {
    const storage = memoryStorage();
    storage.setItem('pp-data-v1', '{not json');
    expect(await makeApi({ storage }).listPosts()).toHaveLength(9);
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
