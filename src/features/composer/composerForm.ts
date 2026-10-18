// Composer form model: field values, validation and conversion to a PostDraft.
// Pure so every state in the "Composer states" mockup can be unit tested.

import { countChars } from '../../lib/counter';
import { isoToZoned, localTimeZone, zonedToIso } from '../../lib/dates';
import { PLATFORM_BY_ID, PLATFORMS, type Platform } from '../../lib/platforms';
import type { Post, PostDraft } from '../../lib/types';

export interface ComposerForm {
  content: string;
  platforms: Platform[];
  mediaUrl: string;
  /** "YYYY-MM-DD", as a native date input reports it. */
  date: string;
  /** "HH:mm", as a native time input reports it. */
  time: string;
}

export const EMPTY_FORM: ComposerForm = { content: '', platforms: [], mediaUrl: '', date: '', time: '' };

export function formFromPost(post: Post, tz = localTimeZone()): ComposerForm {
  const { date, time } = isoToZoned(post.scheduledAt, tz);
  return { content: post.content, platforms: [...post.platforms], mediaUrl: post.mediaUrl ?? '', date, time };
}

export interface OverLimit {
  platform: Platform;
  by: number;
}

export interface FormCheck {
  chars: number;
  /** Selected platforms, tightest limit first (the counter's row order). */
  counted: Platform[];
  overLimit: OverLimit[];
  /** Instant the date + time fields describe, once both are filled. */
  scheduledAt: string | null;
  pastSchedule: boolean;
  badMediaUrl: boolean;
  /** Everything required is present and valid. */
  valid: boolean;
}

export function isImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

export function checkForm(form: ComposerForm, now: Date = new Date(), tz = localTimeZone()): FormCheck {
  const chars = countChars(form.content);
  const counted = PLATFORMS.filter((p) => form.platforms.includes(p.id))
    .sort((a, b) => a.limit - b.limit)
    .map((p) => p.id);
  const overLimit = counted
    .map((platform) => ({ platform, by: chars - PLATFORM_BY_ID[platform].limit }))
    .filter((o) => o.by > 0);
  const scheduledAt = form.date && form.time ? zonedToIso(form.date, form.time, tz) : null;
  const pastSchedule = scheduledAt !== null && new Date(scheduledAt).getTime() <= now.getTime();
  const badMediaUrl = form.mediaUrl.trim() !== '' && !isImageUrl(form.mediaUrl);

  return {
    chars,
    counted,
    overLimit,
    scheduledAt,
    pastSchedule,
    badMediaUrl,
    valid:
      form.content.trim() !== '' &&
      counted.length > 0 &&
      overLimit.length === 0 &&
      scheduledAt !== null &&
      !pastSchedule &&
      !badMediaUrl,
  };
}

const num = new Intl.NumberFormat('en-IN');

/** "Too long for X by 20 characters", naming every platform that's over. */
export function overLimitMessage(over: OverLimit[]): string | null {
  if (!over.length) return null;
  const parts = over.map((o) => `${PLATFORM_BY_ID[o.platform].name} by ${num.format(o.by)}`);
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
  return `Too long for ${list} ${over.length === 1 && over[0].by === 1 ? 'character' : 'characters'}`;
}

/** Only call once checkForm says the form is valid. */
export function toDraft(form: ComposerForm, tz = localTimeZone()): PostDraft {
  return {
    content: form.content,
    platforms: PLATFORMS.map((p) => p.id).filter((id) => form.platforms.includes(id)),
    mediaUrl: form.mediaUrl.trim() || undefined,
    scheduledAt: zonedToIso(form.date, form.time, tz),
  };
}

export function isDirty(form: ComposerForm, initial: ComposerForm): boolean {
  return (
    form.content !== initial.content ||
    form.mediaUrl !== initial.mediaUrl ||
    form.date !== initial.date ||
    form.time !== initial.time ||
    form.platforms.length !== initial.platforms.length ||
    form.platforms.some((p) => !initial.platforms.includes(p))
  );
}
