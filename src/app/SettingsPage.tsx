import { useState, type ReactNode } from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Dialog';
import { cn } from '../lib/cn';
import { actions, useAppState } from '../lib/store';
import { toast } from '../lib/toast';
import { AccountsList } from './AccountsList';
import { Logo } from './Shell';

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const id = `settings-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="rounded-xl border border-border-subtle bg-surface p-5">
      <h2 id={id} className="text-[15px] font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-text-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ClearPostsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [clearing, setClearing] = useState(false);
  const count = useAppState((s) => (s.load === 'ready' ? s.posts.length : null));

  const clear = async () => {
    setClearing(true);
    try {
      await actions.resetDemo('empty');
      toast('All posts cleared');
      onOpenChange(false);
    } catch {
      toast("Couldn't clear posts — please try again", 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !clearing && onOpenChange(next)}
      title="Clear all posts?"
      description={`${count === null ? 'Every post' : `All ${count} ${count === 1 ? 'post' : 'posts'}`} will be removed from your queue, including scheduled ones.`}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} disabled={clearing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={clear} loading={clearing} loadingText="Clearing…">
            Clear all posts
          </Button>
        </>
      }
    >
      <p className="text-sm text-text-muted">
        Your connected accounts stay as they are. Use “Restore demo posts” to bring the demo data back.
      </p>
    </Modal>
  );
}

export function SettingsPage({ desktop }: { desktop: boolean }) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div>
      <header
        className={
          desktop
            ? 'sticky top-0 z-20 flex h-[68px] items-center border-b border-border-subtle bg-surface/95 px-8 backdrop-blur-sm'
            : 'sticky top-0 z-20 flex items-center gap-2.5 border-b border-border-subtle bg-surface px-4 py-3'
        }
      >
        {!desktop && <Logo />}
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'mx-auto flex max-w-2xl flex-col gap-4 outline-none',
          desktop ? 'px-8 py-8' : 'px-4 py-4',
        )}
      >
        <Card title="Accounts" description="Posts publish through these connections. Reconnect an account when its access expires.">
          <AccountsList size="comfortable" />
        </Card>
        <Card title="Appearance" description="System follows your device's light or dark setting.">
          <ThemeSwitcher />
        </Card>
        <Card title="Demo data" description="This is a frontend demo; posts are stored in your browser.">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                await actions.resetDemo('seed');
                toast('Demo posts restored');
              }}
            >
              Restore demo posts
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              Clear all posts
            </Button>
          </div>
        </Card>
        <ClearPostsDialog open={confirmClear} onOpenChange={setConfirmClear} />
      </main>
    </div>
  );
}
