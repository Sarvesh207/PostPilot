import { Search } from 'lucide-react';
import { forwardRef } from 'react';
import { Input, type InputProps } from './Input';

interface SearchInputProps extends Omit<InputProps, 'leadingIcon' | 'type'> {
  /** Keyboard shortcut hint shown on wider screens, e.g. "⌘K". */
  shortcut?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { shortcut, placeholder = 'Search posts…', ...rest },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      aria-label={rest['aria-label'] ?? 'Search posts'}
      placeholder={placeholder}
      leadingIcon={<Search />}
      trailing={
        shortcut ? (
          <kbd className="hidden h-5 items-center rounded border border-border-subtle px-1.5 font-sans text-[11px] text-text-muted sm:inline-flex">
            {shortcut}
          </kbd>
        ) : undefined
      }
      className="[&::-webkit-search-cancel-button]:hidden"
      {...rest}
    />
  );
});
