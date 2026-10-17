import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TOAST_DURATION_MS,
  TOAST_EXIT_MS,
  dismissToast,
  getToasts,
  pauseToasts,
  resetToasts,
  resumeToasts,
  toast,
} from './toast';

const live = () => getToasts().filter((t) => !t.leaving).map((t) => t.message);

beforeEach(() => {
  vi.useFakeTimers();
  resetToasts();
});
afterEach(() => {
  resetToasts();
  vi.useRealTimers();
});

describe('toast', () => {
  it('auto-dismisses after its duration, then leaves after the exit animation', () => {
    toast('Saved');
    vi.advanceTimersByTime(TOAST_DURATION_MS.success - 1);
    expect(live()).toEqual(['Saved']);
    vi.advanceTimersByTime(1);
    expect(live()).toEqual([]);
    expect(getToasts()).toHaveLength(1); // still animating out
    vi.advanceTimersByTime(TOAST_EXIT_MS);
    expect(getToasts()).toHaveLength(0);
  });

  it('keeps errors up longer than successes', () => {
    toast('Retry failed', 'error');
    vi.advanceTimersByTime(TOAST_DURATION_MS.success);
    expect(live()).toEqual(['Retry failed']);
    vi.advanceTimersByTime(TOAST_DURATION_MS.error - TOAST_DURATION_MS.success);
    expect(live()).toEqual([]);
  });

  it('shows at most three, dismissing the oldest first', () => {
    ['a', 'b', 'c', 'd'].forEach((m) => toast(m));
    expect(live()).toEqual(['b', 'c', 'd']);
  });

  it('restarts an identical visible toast instead of stacking a copy', () => {
    const first = toast('Post deleted');
    vi.advanceTimersByTime(3000);
    expect(toast('Post deleted')).toBe(first);
    expect(live()).toEqual(['Post deleted']);
    vi.advanceTimersByTime(3000);
    expect(live()).toEqual(['Post deleted']);
  });

  it('pauses every timer and resumes with the time that was left', () => {
    toast('Saved');
    vi.advanceTimersByTime(3000);
    pauseToasts();
    vi.advanceTimersByTime(60_000);
    expect(live()).toEqual(['Saved']);
    // Toasts raised while paused wait too.
    toast('Another');
    vi.advanceTimersByTime(60_000);
    expect(live()).toEqual(['Saved', 'Another']);
    resumeToasts();
    vi.advanceTimersByTime(999);
    expect(live()).toEqual(['Saved', 'Another']);
    vi.advanceTimersByTime(1);
    expect(live()).toEqual(['Another']);
  });

  it('dismisses by hand, ignoring repeats', () => {
    const id = toast('Saved');
    dismissToast(id);
    dismissToast(id);
    expect(live()).toEqual([]);
    vi.advanceTimersByTime(TOAST_EXIT_MS);
    expect(getToasts()).toHaveLength(0);
  });
});
