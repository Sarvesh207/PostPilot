import { createStore } from '../../lib/createStore';

// Which post the composer is open for. `session` bumps on every open so the
// form remounts with fresh state; `postId` outlives `open` for focus return.
export const composerUi = createStore<{ open: boolean; postId: string | null; session: number }>({
  open: false,
  postId: null,
  session: 0,
});

// There's no Radix Trigger (several buttons open the composer), so remember
// what had focus to hand it back on close.
let opener: HTMLElement | null = null;
export const composerOpener = () => opener;

/** Opens the composer for a new post, or to edit `postId`. */
export function openComposer(postId?: string) {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  composerUi.setState((s) => ({ open: true, postId: postId ?? null, session: s.session + 1 }));
}

export const closeComposer = () => composerUi.setState({ open: false });
