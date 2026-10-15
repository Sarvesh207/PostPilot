import { Send } from 'lucide-react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

/** Placeholder shell until the queue screen lands in Phase 3. */
export function App() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-accent text-on-accent">
          <Send className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold">PostPilot</h1>
        <p className="text-text-muted">The post queue arrives in Phase 3. Phase 1 ships the design system.</p>
        <a href="/components" className="focus-ring rounded font-medium text-accent-text underline-offset-4 hover:underline">
          Open the component sheet →
        </a>
        <ThemeSwitcher />
      </div>
    </main>
  );
}
