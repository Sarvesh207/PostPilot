import { CalendarDays, Globe, Link2, List, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Button, type ButtonVariant } from '../components/ui/Button';
import { CharCounter } from '../components/ui/CharCounter';
import { PlatformChip } from '../components/ui/Chip';
import { DayGroupHeader } from '../components/ui/DayGroupHeader';
import { Field, FieldError } from '../components/ui/Field';
import { Input, Textarea } from '../components/ui/Input';
import { OverflowMenu, menuItemClass, menuPanelClass } from '../components/ui/Menu';
import { PlatformGlyph, PlatformStack } from '../components/ui/PlatformGlyph';
import { PlatformToggle } from '../components/ui/PlatformToggle';
import { SearchInput } from '../components/ui/SearchInput';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ToastView } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { CONTRAST_PAIRS as PAIRS, contrastRatio, flatten, parseColor } from '../lib/contrast';
import { countChars } from '../lib/counter';
import { PLATFORMS, type Platform } from '../lib/platforms';
import { PortalContainerContext } from '../lib/portal';
import { useTheme, type Theme } from '../lib/theme';

type View = 'single' | 'split';

export function ComponentsPage() {
  const [view, setView] = useState<View>('single');
  const { theme } = useTheme();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <div className="mr-auto">
            <h1 className="text-lg font-semibold">PostPilot components</h1>
            <p className="text-[13px] text-text-muted">Geist · 8px grid · 8–12px radii · 1px borders over shadows</p>
          </div>
          <SegmentedControl<View>
            aria-label="Layout"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'single', label: 'Single' },
              { value: 'split', label: 'Light + dark' },
            ]}
          />
          {view === 'single' && <ThemeSwitcher />}
        </div>
      </header>

      {view === 'single' ? (
        <ThemePanel theme={theme} className="mx-auto max-w-[1100px] px-4 py-8 sm:px-8" />
      ) : (
        <div className="grid xl:grid-cols-2">
          <ThemePanel theme="light" scoped label="Light" className="px-4 py-8 sm:px-8" />
          <ThemePanel theme="dark" scoped label="Dark" className="px-4 py-8 sm:px-8" />
        </div>
      )}
    </div>
  );
}

/** Renders the sheet; when `scoped`, pins its own data-theme and portal container. */
function ThemePanel({
  theme,
  scoped = false,
  label,
  className,
}: {
  theme: Theme;
  scoped?: boolean;
  label?: string;
  className?: string;
}) {
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  return (
    <div data-theme={scoped ? theme : undefined} className={cn('min-w-0 bg-bg text-text', className)}>
      <PortalContainerContext.Provider value={scoped ? portal : null}>
        {label && <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>}
        <Sheet theme={theme} />
      </PortalContainerContext.Provider>
      <div ref={setPortal} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-border-subtle py-8 first:pt-0 last:border-0 lg:grid-cols-[150px_1fr]">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  );
}

function Labeled({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </div>
  );
}

const SWATCHES = [
  ['Accent', '--accent'],
  ['Accent hover', '--accent-hover'],
  ['Accent soft', '--accent-soft'],
  ['Accent text', '--accent-text'],
  ['Text', '--text'],
  ['Text muted', '--text-muted'],
  ['Background', '--bg'],
  ['Surface', '--surface'],
  ['Surface raised', '--surface-raised'],
  ['Border', '--border'],
  ['Divider', '--border-subtle'],
  ['Scheduled', '--scheduled'],
  ['Published', '--published'],
  ['Failed', '--failed'],
  ['Warning', '--warning'],
  ['Danger', '--danger'],
] as const;

function Sheet({ theme }: { theme: Theme }) {
  return (
    <div>
      <Section title="Color">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-6">
          {SWATCHES.map(([name, token]) => (
            <Swatch key={token} name={name} token={token} theme={theme} />
          ))}
        </div>
      </Section>
      <Section title="Contrast">
        <ContrastTable theme={theme} />
      </Section>
      <Section title="Buttons">
        <ButtonGrid />
      </Section>
      <Section title="Status badges">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="scheduled" />
          <StatusBadge status="published" />
          <StatusBadge status="failed" />
        </div>
      </Section>
      <Section title="Platform chips">
        <PlatformShowcase />
      </Section>
      <Section title="Inputs">
        <InputShowcase />
      </Section>
      <Section title="Character counter">
        <CounterShowcase />
      </Section>
      <Section title="Segmented control">
        <SegmentShowcase />
      </Section>
      <Section title="Toasts">
        <div className="flex flex-col gap-3">
          <ToastView onDismiss={() => {}}>Post scheduled for Tomorrow, 10:00 AM</ToastView>
          <ToastView onDismiss={() => {}}>Post rescheduled</ToastView>
          <ToastView variant="error" onDismiss={() => {}}>
            Retry failed — please try again
          </ToastView>
        </div>
      </Section>
      <Section title="Day group header">
        <div className="rounded-xl border border-border-subtle bg-bg px-4">
          <DayGroupHeader label="Today" date="Wed, 14 Oct" count={4} />
          <DayGroupHeader label="Tomorrow" date="Thu, 15 Oct" count={2} />
          <DayGroupHeader label="Sat, 17 Oct" count={1} />
        </div>
      </Section>
      <Section title="Overflow menu">
        <div className="flex flex-wrap items-start gap-8">
          <Labeled label="Open (static)">
            <div className={cn(menuPanelClass, 'w-40')} role="presentation">
              <div className={menuItemClass(false, true)}>
                <Pencil aria-hidden="true" />
                Edit
              </div>
              <div className={menuItemClass(true)}>
                <Trash2 aria-hidden="true" />
                Delete
              </div>
            </div>
          </Labeled>
          <Labeled label="Live">
            <OverflowMenu
              label="Post actions"
              actions={[
                { label: 'Edit', icon: <Pencil aria-hidden="true" />, onSelect: () => {} },
                { label: 'Delete', icon: <Trash2 aria-hidden="true" />, onSelect: () => {}, destructive: true },
              ]}
            />
          </Labeled>
        </div>
      </Section>
      <Section title="Skeleton">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="flex gap-4">
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2.5 pt-1">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
              <div className="mt-1 flex items-center gap-2">
                <Skeleton className="size-5" />
                <Skeleton className="size-5" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

/** Reads a token's resolved value from the swatch's own scope, so it reflects the panel's theme. */
function Swatch({ name, token, theme }: { name: string; token: string; theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  useLayoutEffect(() => {
    if (ref.current) setValue(getComputedStyle(ref.current).getPropertyValue(token).trim());
  }, [token, theme]);
  return (
    <div ref={ref} className="min-w-0">
      <div className="h-12 rounded-lg border border-border-subtle" style={{ background: `var(${token})` }} />
      <p className="mt-1.5 truncate text-xs font-medium">{name}</p>
      <p className="truncate font-mono text-[11px] text-text-muted">{value}</p>
    </div>
  );
}

// [label, foreground token, background token, minimum ratio]

function ContrastTable({ theme }: { theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<{ label: string; ratio: number; min: number }[]>([]);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    const read = (t: string) => parseColor(t.startsWith('--') ? cs.getPropertyValue(t) : t);
    const surface = read('--surface')!;
    setRows(
      PAIRS.map(([label, fg, bg, min]) => {
        // Translucent backgrounds sit on the surface; translucent text sits on its background.
        const b = flatten(read(bg)!, surface);
        const f = flatten(read(fg)!, b);
        return { label, ratio: contrastRatio(f, b), min };
      }),
    );
  }, [theme]);

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
      <table className="w-full text-left text-[13px]">
        <thead className="text-text-muted">
          <tr className="border-b border-border-subtle">
            <th className="px-4 py-2 font-medium">Pair</th>
            <th className="px-4 py-2 text-right font-medium">Ratio</th>
            <th className="px-4 py-2 text-right font-medium">WCAG AA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pass = r.ratio >= r.min;
            return (
              <tr key={r.label} className="border-b border-border-subtle last:border-0">
                <td className="px-4 py-2">{r.label}</td>
                <td className="px-4 py-2 text-right tabular-nums">{r.ratio.toFixed(2)}:1</td>
                <td className={cn('px-4 py-2 text-right font-medium', pass ? 'text-published' : 'text-failed')}>
                  {pass ? '✓ Pass' : '✕ Fail'} <span className="font-normal text-text-muted">≥{r.min}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const BUTTON_ROWS: [string, ButtonVariant, string, string][] = [
  ['Primary', 'primary', 'Schedule post', 'Scheduling…'],
  ['Secondary', 'secondary', 'Cancel', 'Saving…'],
  ['Ghost', 'ghost', 'Clear filters', 'Clearing…'],
  ['Destructive', 'destructive', 'Delete post', 'Deleting…'],
];

function ButtonGrid() {
  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <table className="text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-6 font-medium" />
              {['Default', 'Hover', 'Disabled', 'Loading'].map((h) => (
                <th key={h} className="pb-3 pr-6 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BUTTON_ROWS.map(([name, variant, label, loading]) => (
              <tr key={variant}>
                <th className="py-1.5 pr-6 text-[13px] font-medium">{name}</th>
                <td className="py-1.5 pr-6">
                  <Button variant={variant} size="sm">
                    {label}
                  </Button>
                </td>
                <td className="py-1.5 pr-6">
                  <Button variant={variant} size="sm" forceHover>
                    {label}
                  </Button>
                </td>
                <td className="py-1.5 pr-6">
                  <Button variant={variant} size="sm" disabled>
                    {label}
                  </Button>
                </td>
                <td className="py-1.5 pr-6">
                  <Button variant={variant} size="sm" loading loadingText={loading}>
                    {label}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Labeled label="Sizes and icons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />}>
            New Post
          </Button>
          <Button variant="secondary" size="sm" icon={<RotateCw className="size-3.5" aria-hidden="true" />}>
            Retry
          </Button>
          <Button variant="secondary" size="sm" loading loadingText="Retrying…">
            Retry
          </Button>
          <Button variant="primary" size="lg">
            Create your first post
          </Button>
        </div>
      </Labeled>
    </div>
  );
}

function PlatformShowcase() {
  const [filters, setFilters] = useState<Platform[]>(['instagram']);
  const [selected, setSelected] = useState<Platform[]>(['facebook', 'instagram', 'x']);
  const toggle = (list: Platform[], p: Platform) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]);

  return (
    <>
      <div className="flex flex-wrap gap-6">
        <Labeled label="Filter · default">
          <PlatformChip platform="facebook" selected={false} />
        </Labeled>
        <Labeled label="Selected">
          <PlatformChip platform="instagram" selected />
        </Labeled>
        <Labeled label="Disabled">
          <PlatformChip platform="tiktok" selected={false} disabled />
        </Labeled>
      </div>
      <Labeled label="Filter · live">
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <PlatformChip
              key={p.id}
              platform={p.id}
              selected={filters.includes(p.id)}
              onClick={() => setFilters((f) => toggle(f, p.id))}
            />
          ))}
        </div>
      </Labeled>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Labeled label="Toggle · default">
          <PlatformToggle platform="facebook" selected={false} />
        </Labeled>
        <Labeled label="Selected">
          <PlatformToggle platform="x" selected />
        </Labeled>
        <Labeled label="Disabled">
          <PlatformToggle platform="tiktok" selected={false} disabled />
        </Labeled>
        <Labeled label="Invalid">
          <PlatformToggle platform="instagram" selected={false} invalid />
        </Labeled>
      </div>
      <Labeled label="Toggle · live (card)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLATFORMS.map((p) => (
            <PlatformToggle
              key={p.id}
              platform={p.id}
              selected={selected.includes(p.id)}
              onClick={() => setSelected((s) => toggle(s, p.id))}
            />
          ))}
        </div>
      </Labeled>
      <Labeled label="Toggle · live (row, mobile)">
        <div className="grid max-w-md grid-cols-2 gap-3">
          {PLATFORMS.map((p) => (
            <PlatformToggle
              key={p.id}
              layout="row"
              platform={p.id}
              selected={selected.includes(p.id)}
              onClick={() => setSelected((s) => toggle(s, p.id))}
            />
          ))}
        </div>
      </Labeled>
      <div className="flex flex-wrap gap-8">
        <Labeled label="Glyphs">
          <div className="flex flex-wrap items-center gap-4">
            {PLATFORMS.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 text-[13px]">
                <PlatformGlyph platform={p.id} />
                {p.name}
              </span>
            ))}
          </div>
        </Labeled>
        <Labeled label="Sizes">
          <div className="flex items-end gap-2">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <PlatformGlyph key={s} platform="tiktok" size={s} />
            ))}
          </div>
        </Labeled>
        <Labeled label="Stack">
          <PlatformStack platforms={['facebook', 'instagram', 'x', 'tiktok']} />
        </Labeled>
      </div>
    </>
  );
}

function InputShowcase() {
  return (
    <div className="grid gap-x-4 gap-y-6 md:grid-cols-3">
      <Labeled label="Input · default">
        <Input placeholder="https://…" aria-label="Image URL" leadingIcon={<Link2 />} />
      </Labeled>
      <Labeled label="Focus">
        <Input
          defaultValue="https://cdn.yourbrand.in/diwali"
          aria-label="Image URL"
          leadingIcon={<Link2 />}
          forceFocus
        />
      </Labeled>
      <Labeled label="Error">
        <div className="flex flex-col gap-2">
          <Input defaultValue="cdn.yourbrand/diwali" aria-label="Image URL" leadingIcon={<Link2 />} invalid />
          <FieldError>Enter a full URL starting with https://</FieldError>
        </div>
      </Labeled>

      <Labeled label="Textarea · default">
        <Textarea placeholder="What do you want to share?" aria-label="Post text" className="min-h-24" />
      </Labeled>
      <Labeled label="Focus">
        <Textarea
          defaultValue="Behind the scenes of our new autumn shoot 📸"
          aria-label="Post text"
          className="min-h-24"
          forceFocus
        />
      </Labeled>
      <Labeled label="Error">
        <div className="flex flex-col gap-2">
          <Textarea
            defaultValue="Diwali Mega Sale is LIVE! Flat 40% off on all ethnic wear…"
            aria-label="Post text"
            className="min-h-24"
            invalid
          />
          <FieldError>Too long for X by 20 characters</FieldError>
        </div>
      </Labeled>

      <Labeled label="Date & time · default">
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" aria-label="Date" />
          <Input type="time" aria-label="Time" />
        </div>
      </Labeled>
      <Labeled label="Focus">
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" aria-label="Date" defaultValue="2026-10-15" forceFocus />
          <Input type="time" aria-label="Time" defaultValue="10:00" />
        </div>
      </Labeled>
      <Labeled label="Error">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" aria-label="Date" defaultValue="2026-10-12" invalid />
            <Input type="time" aria-label="Time" defaultValue="18:00" invalid />
          </div>
          <FieldError>Scheduled time must be in the future</FieldError>
        </div>
      </Labeled>

      <Labeled label="Search · default">
        <SearchInput shortcut="⌘K" />
      </Labeled>
      <Labeled label="Focus">
        <SearchInput defaultValue="diwali" forceFocus />
      </Labeled>
      <Labeled label="Error">
        <div className="flex flex-col gap-2">
          <SearchInput defaultValue="diwali" invalid />
          <FieldError>Search is unavailable right now</FieldError>
        </div>
      </Labeled>

      <div className="md:col-span-3">
        <Labeled label="Field with label, hint and live error">
          <LiveField />
        </Labeled>
      </div>
    </div>
  );
}

function LiveField() {
  const [url, setUrl] = useState('');
  const error = url && !/^https:\/\/\S+$/.test(url) ? 'Enter a full URL starting with https://' : undefined;
  return (
    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Field label="Image URL" labelSuffix="(optional)" error={error} className="sm:col-span-2">
        <Input
          placeholder="https://…"
          leadingIcon={<Link2 />}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          inputMode="url"
        />
      </Field>
      <Field label="Date">
        <Input type="date" defaultValue="2026-10-16" />
      </Field>
      <Field
        label="Time"
        hint="Shown in your local time (Asia/Kolkata)"
        hintIcon={<Globe className="size-3.5" aria-hidden="true" />}
      >
        <Input type="time" defaultValue="11:00" />
      </Field>
    </div>
  );
}

function CounterShowcase() {
  const [text, setText] = useState(
    'Weekend workshop: learn latte art with our head barista ☕ Limited seats.',
  );
  const count = countChars(text);
  return (
    <>
      <div className="flex max-w-xl flex-col gap-3">
        <div className="flex items-center gap-4">
          <CharCounter platform="instagram" count={245} className="flex-1" />
          <span className="w-20 text-[11px] uppercase tracking-wider text-text-muted">Normal</span>
        </div>
        <div className="flex items-center gap-4">
          <CharCounter platform="x" count={262} className="flex-1" />
          <span className="w-20 text-[11px] uppercase tracking-wider text-text-muted">Near limit</span>
        </div>
        <div className="flex items-center gap-4">
          <CharCounter platform="x" count={300} className="flex-1" />
          <span className="w-20 text-[11px] uppercase tracking-wider text-text-muted">Over limit</span>
        </div>
      </div>
      <Labeled label="Live (emoji count as one character)">
        <div className="flex max-w-xl flex-col gap-3">
          <Textarea aria-label="Post text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-24" />
          <CharCounter platform="x" count={count} />
          <CharCounter platform="instagram" count={count} />
          <CharCounter platform="facebook" count={count} />
        </div>
      </Labeled>
    </>
  );
}

function SegmentShowcase() {
  const [status, setStatus] = useState<'all' | 'scheduled' | 'published' | 'failed'>('all');
  const [mode, setMode] = useState<'list' | 'calendar'>('list');
  return (
    <div className="flex flex-col gap-6">
      <Labeled label="Status filter">
        <SegmentedControl
          aria-label="Filter by status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'published', label: 'Published' },
            { value: 'failed', label: 'Failed' },
          ]}
        />
      </Labeled>
      <Labeled label="Status filter · full width (mobile sheet)">
        <div className="max-w-md">
          <SegmentedControl
            aria-label="Filter by status"
            fullWidth
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'published', label: 'Published' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
        </div>
      </Labeled>
      <Labeled label="View toggle">
        <SegmentedControl
          aria-label="View"
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'list', label: 'List', icon: <List /> },
            { value: 'calendar', label: 'Calendar', icon: <CalendarDays /> },
          ]}
        />
      </Labeled>
      <div className="flex flex-wrap gap-8">
        <Labeled label="Theme switcher">
          <ThemeSwitcher />
        </Labeled>
        <Labeled label="Compact">
          <ThemeSwitcher compact />
        </Labeled>
      </div>
    </div>
  );
}
