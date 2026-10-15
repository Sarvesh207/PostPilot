import { useSyncExternalStore } from 'react';

/**
 * Minimal external store: immutable state, change listeners, and a React hook
 * built on useSyncExternalStore. Used instead of a state library.
 */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  const getState = () => state;
  const setState = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };

  /**
   * Subscribe to a slice. The selector must return something already in state
   * (or a primitive) — derive new arrays/objects with useMemo, or React loops.
   */
  const useStore = <S>(selector: (s: T) => S): S =>
    useSyncExternalStore(subscribe, () => selector(state), () => selector(state));

  return { getState, setState, subscribe, useStore };
}
