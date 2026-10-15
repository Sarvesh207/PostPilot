import { createStore } from './createStore';
import type { ToastVariant } from '../components/ui/Toast';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

const MAX_VISIBLE = 3;
const DURATION_MS: Record<ToastVariant, number> = { success: 4000, error: 6000 };

const store = createStore<{ toasts: Toast[] }>({ toasts: [] });
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextId = 1;

export function dismissToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  store.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

export function toast(message: string, variant: ToastVariant = 'success'): number {
  const id = nextId++;
  store.setState((s) => {
    const toasts = [...s.toasts, { id, variant, message }];
    // Drop the oldest beyond the cap (and their timers).
    toasts.slice(0, -MAX_VISIBLE).forEach((t) => clearTimeout(timers.get(t.id)));
    return { toasts: toasts.slice(-MAX_VISIBLE) };
  });
  timers.set(id, setTimeout(() => dismissToast(id), DURATION_MS[variant]));
  return id;
}

export const useToasts = () => store.useStore((s) => s.toasts);
