import { createStore } from './createStore';
import type { ToastVariant } from '../components/ui/Toast';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
  /** Playing its exit animation; removed shortly after. */
  leaving: boolean;
}

const MAX_VISIBLE = 3;
export const TOAST_DURATION_MS: Record<ToastVariant, number> = { success: 4000, error: 6000 };
/** Matches the exit animation in index.css. */
export const TOAST_EXIT_MS = 160;

const store = createStore<{ toasts: Toast[] }>({ toasts: [] });

// Each live toast has either a running timer or, while paused, the time it had left.
const timers = new Map<number, { handle?: ReturnType<typeof setTimeout>; endsAt: number; remaining: number }>();
let paused = false;
let nextId = 1;

function startTimer(id: number, ms: number) {
  const t = { endsAt: Date.now() + ms, remaining: ms, handle: undefined as ReturnType<typeof setTimeout> | undefined };
  if (!paused) t.handle = setTimeout(() => dismissToast(id), ms);
  timers.set(id, t);
}

function clearTimer(id: number) {
  clearTimeout(timers.get(id)?.handle);
  timers.delete(id);
}

export function dismissToast(id: number) {
  clearTimer(id);
  const toast = store.getState().toasts.find((t) => t.id === id);
  if (!toast || toast.leaving) return;
  store.setState((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }));
  setTimeout(() => store.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), TOAST_EXIT_MS);
}

export function toast(message: string, variant: ToastVariant = 'success'): number {
  // The same message again (e.g. a double-clicked action) restarts the visible one.
  const dupe = store.getState().toasts.find((t) => !t.leaving && t.message === message && t.variant === variant);
  if (dupe) {
    clearTimer(dupe.id);
    startTimer(dupe.id, TOAST_DURATION_MS[variant]);
    return dupe.id;
  }

  const id = nextId++;
  store.setState((s) => ({ toasts: [...s.toasts, { id, variant, message, leaving: false }] }));
  startTimer(id, TOAST_DURATION_MS[variant]);

  // Over the cap, the oldest still-visible toast makes way.
  const visible = store.getState().toasts.filter((t) => !t.leaving);
  visible.slice(0, -MAX_VISIBLE).forEach((t) => dismissToast(t.id));
  return id;
}

/**
 * Hold every auto-dismiss timer while the pointer or keyboard focus is on the
 * stack, so people get as long as they need to read or reach a toast.
 */
export function pauseToasts() {
  if (paused) return;
  paused = true;
  const now = Date.now();
  timers.forEach((t) => {
    clearTimeout(t.handle);
    t.handle = undefined;
    t.remaining = Math.max(0, t.endsAt - now);
  });
}

export function resumeToasts() {
  if (!paused) return;
  paused = false;
  const now = Date.now();
  timers.forEach((t, id) => {
    t.endsAt = now + t.remaining;
    t.handle = setTimeout(() => dismissToast(id), t.remaining);
  });
}

export const useToasts = () => store.useStore((s) => s.toasts);

/** Test helper: drop all toasts and timers. */
export function resetToasts() {
  timers.forEach((_, id) => clearTimer(id));
  paused = false;
  store.setState({ toasts: [] });
}

export const getToasts = () => store.getState().toasts;
