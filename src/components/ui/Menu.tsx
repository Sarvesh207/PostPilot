import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { usePortalContainer } from '../../lib/portal';

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

export const menuPanelClass =
  'z-50 min-w-36 rounded-[10px] border border-border-subtle bg-surface-raised p-1 shadow-pop';

export const menuItemClass = (destructive?: boolean, highlighted?: boolean) =>
  cn(
    'flex h-10 cursor-default select-none items-center gap-2 rounded-md px-2.5 text-sm outline-none [&_svg]:size-4',
    destructive ? 'text-failed' : 'text-text',
    highlighted && 'bg-surface-hover',
    'data-[highlighted]:bg-surface-hover',
  );

/** "⋯" overflow menu (Edit / Delete on post cards). */
export function OverflowMenu({ actions, label = 'More actions' }: { actions: MenuAction[]; label?: string }) {
  const container = usePortalContainer();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="focus-ring grid size-11 shrink-0 place-items-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text data-[state=open]:bg-surface-hover sm:size-8"
        >
          <MoreHorizontal className="size-[18px]" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content align="end" sideOffset={4} className={menuPanelClass}>
          {actions.map((a) => (
            <DropdownMenu.Item key={a.label} onSelect={a.onSelect} className={menuItemClass(a.destructive)}>
              {a.icon}
              {a.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
