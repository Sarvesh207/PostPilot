import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Dialog';
import { createStore } from '../../lib/createStore';
import { relativeDateTime } from '../../lib/dates';
import { PLATFORM_BY_ID, type Platform } from '../../lib/platforms';
import { actions, useAppState } from '../../lib/store';
import { toast } from '../../lib/toast';

// Cross-component UI state for the delete confirmation. `postId` outlives
// `open` so the close handler still knows which post's menu to refocus.
const ui = createStore<{ open: boolean; postId: string | null; deleting: boolean; deleted: boolean }>({
  open: false,
  postId: null,
  deleting: false,
  deleted: false,
});

export async function retryWithToast(id: string) {
  const pending = actions.retryPost(id);
  // The optimistic update has already removed the Retry button; keep focus on the card.
  document.getElementById(menuTriggerId(id))?.focus();
  const outcome = await pending;
  // Under the Failed filter a successful retry takes the card off screen.
  if (document.activeElement === document.body) document.getElementById('main-content')?.focus({ preventScroll: true });
  if (outcome.ok) {
    toast(outcome.rescheduled ? `Post rescheduled for ${relativeDateTime(outcome.post.scheduledAt)}` : 'Post rescheduled');
  } else if (outcome.message !== 'Already retrying') {
    toast(outcome.message, 'error');
  }
}

export async function reconnectWithToast(platform: Platform) {
  const name = PLATFORM_BY_ID[platform].name;
  try {
    await actions.reconnectAccount(platform);
    toast(`${name} reconnected — retry its failed posts`);
  } catch {
    toast(`Couldn't reconnect ${name} — please try again`, 'error');
  }
}

export { openComposer } from '../composer/composerStore';

export const requestDelete = (id: string) => ui.setState({ open: true, postId: id, deleted: false });

export const menuTriggerId = (postId: string) => `post-menu-${postId}`;

/** Confirmation dialog for deleting a post; mount once near the app root. */
export function DeletePostDialog() {
  const open = ui.useStore((s) => s.open);
  const postId = ui.useStore((s) => s.postId);
  const deleting = ui.useStore((s) => s.deleting);
  const post = useAppState((s) => s.posts.find((p) => p.id === postId));

  const close = () => {
    if (!deleting) ui.setState({ open: false });
  };

  const confirm = async () => {
    if (!postId) return;
    ui.setState({ deleting: true });
    try {
      await actions.deletePost(postId);
      toast('Post deleted');
      ui.setState({ open: false, deleted: true });
    } catch {
      toast("Couldn't delete the post — please try again", 'error');
    } finally {
      ui.setState({ deleting: false });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && close()}
      // Opened from a menu item that unmounts, so Radix can't restore focus on
      // its own: go back to the post's ⋯ button, or to the queue if it's gone.
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        const { postId: id, deleted } = ui.getState();
        const target = deleted ? 'main-content' : id ? menuTriggerId(id) : null;
        if (target) document.getElementById(target)?.focus();
      }}
      title="Delete this post?"
      description="It will be removed from your queue and won't be published. This can't be undone."
      footer={
        <>
          <Button onClick={close} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} loading={deleting} loadingText="Deleting…">
            Delete post
          </Button>
        </>
      }
    >
      {post && (
        <blockquote className="rounded-lg border border-border-subtle bg-surface-sunken px-3 py-2 text-sm text-text-muted">
          <p className="line-clamp-3">{post.content}</p>
        </blockquote>
      )}
    </Modal>
  );
}
