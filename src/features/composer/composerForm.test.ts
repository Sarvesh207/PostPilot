import { describe, expect, it } from 'vitest';
import type { Post } from '../../lib/types';
import { checkForm, EMPTY_FORM, formFromPost, isDirty, isImageUrl, overLimitMessage, toDraft, type ComposerForm } from './composerForm';

const TZ = 'Asia/Kolkata';
const NOW = new Date('2026-10-15T04:30:00Z'); // 10:00 AM IST

const valid: ComposerForm = {
  content: 'Diwali Mega Sale is LIVE 🪔 Flat 40% off',
  platforms: ['x', 'facebook', 'instagram'],
  imageUrl: '',
  date: '2026-10-16',
  time: '10:00',
};

describe('checkForm', () => {
  it('treats an empty form as invalid without flagging anything', () => {
    const c = checkForm(EMPTY_FORM, NOW, TZ);
    expect(c.valid).toBe(false);
    expect(c.overLimit).toEqual([]);
    expect(c.pastSchedule).toBe(false);
    expect(c.badImageUrl).toBe(false);
    expect(c.scheduledAt).toBeNull();
  });

  it('accepts a complete future post and orders counters tightest first', () => {
    const c = checkForm(valid, NOW, TZ);
    expect(c.valid).toBe(true);
    expect(c.counted).toEqual(['x', 'instagram', 'facebook']);
    expect(c.scheduledAt).toBe('2026-10-16T04:30:00.000Z');
  });

  it('flags content over the X limit', () => {
    const c = checkForm({ ...valid, content: 'a'.repeat(300) }, NOW, TZ);
    expect(c.valid).toBe(false);
    expect(c.overLimit).toEqual([{ platform: 'x', by: 20 }]);
  });

  it('flags a time that has already passed, including now itself', () => {
    expect(checkForm({ ...valid, date: '2026-10-12', time: '18:00' }, NOW, TZ).pastSchedule).toBe(true);
    expect(checkForm({ ...valid, date: '2026-10-15', time: '10:00' }, NOW, TZ).pastSchedule).toBe(true);
    expect(checkForm({ ...valid, date: '2026-10-15', time: '10:01' }, NOW, TZ).pastSchedule).toBe(false);
  });

  it('requires a platform, content and a valid image URL', () => {
    expect(checkForm({ ...valid, platforms: [] }, NOW, TZ).valid).toBe(false);
    expect(checkForm({ ...valid, content: '   ' }, NOW, TZ).valid).toBe(false);
    const bad = checkForm({ ...valid, imageUrl: 'not a url' }, NOW, TZ);
    expect(bad.badImageUrl).toBe(true);
    expect(bad.valid).toBe(false);
  });
});

describe('isImageUrl', () => {
  it('accepts http(s) links with a real host only', () => {
    expect(isImageUrl('https://cdn.yourbrand.in/a.jpg')).toBe(true);
    expect(isImageUrl('  http://example.com/x.png ')).toBe(true);
    expect(isImageUrl('ftp://example.com/x.png')).toBe(false);
    expect(isImageUrl('https://localhost')).toBe(false);
    expect(isImageUrl('cdn.yourbrand.in/a.jpg')).toBe(false);
  });
});

describe('overLimitMessage', () => {
  it('names each platform that is over', () => {
    expect(overLimitMessage([])).toBeNull();
    expect(overLimitMessage([{ platform: 'x', by: 20 }])).toBe('Too long for X by 20 characters');
    expect(overLimitMessage([{ platform: 'x', by: 1 }])).toBe('Too long for X by 1 character');
    expect(
      overLimitMessage([
        { platform: 'x', by: 2020 },
        { platform: 'instagram', by: 100 },
      ]),
    ).toBe('Too long for X by 2,020 and Instagram by 100 characters');
  });
});

describe('drafts', () => {
  it('converts to a draft in canonical platform order and round-trips through a post', () => {
    const draft = toDraft({ ...valid, imageUrl: '  https://cdn.yourbrand.in/a.jpg ' }, TZ);
    expect(draft).toEqual({
      content: valid.content,
      platforms: ['facebook', 'instagram', 'x'],
      imageUrl: 'https://cdn.yourbrand.in/a.jpg',
      scheduledAt: '2026-10-16T04:30:00.000Z',
    });
    const post: Post = { ...draft, id: '1', status: 'scheduled', createdAt: '', updatedAt: '' };
    const form = formFromPost(post, TZ);
    expect(form.date).toBe('2026-10-16');
    expect(form.time).toBe('10:00');
    expect(toDraft(form, TZ)).toEqual(draft);
  });

  it('ignores platform order when checking for changes', () => {
    expect(isDirty(valid, { ...valid, platforms: ['instagram', 'x', 'facebook'] })).toBe(false);
    expect(isDirty(valid, { ...valid, platforms: ['x'] })).toBe(true);
    expect(isDirty(valid, { ...valid, content: 'changed' })).toBe(true);
  });
});
