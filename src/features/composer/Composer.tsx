import * as RadixDialog from '@radix-ui/react-dialog';
import { Globe, Link2, X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from 'react';
import { Button } from '../../components/ui/Button';
import { CharCounter } from '../../components/ui/CharCounter';
import { Modal } from '../../components/ui/Dialog';
import { Field, FieldError } from '../../components/ui/Field';
import { Input, Textarea } from '../../components/ui/Input';
import { PlatformToggle } from '../../components/ui/PlatformToggle';
import { ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { dayKey, localTimeZone, relativeDateTime } from '../../lib/dates';
import { PLATFORMS, type Platform } from '../../lib/platforms';
import { usePortalContainer } from '../../lib/portal';
import { actions, useAppState, useNow } from '../../lib/store';
import { toast } from '../../lib/toast';
import type { Post } from '../../lib/types';
import { menuTriggerId } from '../queue/postActions';
import { PostThumb } from '../queue/PostThumb';
import { checkForm, EMPTY_FORM, formFromPost, isDirty, overLimitMessage, toDraft, type ComposerForm } from './composerForm';
import { ComposerPreview } from './ComposerPreview';
import { closeComposer, composerOpener, composerUi } from './composerStore';

/** The new / edit post composer; mount once near the app root. */
export function ComposerHost({ desktop }: { desktop: boolean }) {
  const open = composerUi.useStore((s) => s.open);
  const session = composerUi.useStore((s) => s.session);
  const postId = composerUi.useStore((s) => s.postId);
  const post = useAppState((s) => (postId ? s.posts.find((p) => p.id === postId) : undefined));
  const container = usePortalContainer();

  // A post deleted elsewhere while its editor is open has nothing left to edit.
  const editingGone = open && postId !== null && !post;

  return (
    <RadixDialog.Root open={open && !editingGone} onOpenChange={(next) => !next && closeComposer()}>
      <RadixDialog.Portal container={container}>
        <ComposerDialog key={session} post={post} desktop={desktop} />
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

function ComposerDialog({ post, desktop }: { post?: Post; desktop: boolean }) {
  const tz = localTimeZone();
  const [initial] = useState(() => (post ? formFromPost(post, tz) : EMPTY_FORM));
  const [form, setForm] = useState<ComposerForm>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ platforms: false, mediaUrl: false });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const now = useNow(15_000);

  const check = checkForm(form, now, tz);
  const editing = Boolean(post);
  const title = editing ? 'Edit post' : 'New post';

  const update = (patch: Partial<ComposerForm>) => setForm((f) => ({ ...f, ...patch }));

  /** Close, unless that would throw away work — then ask first. */
  const requestClose = () => {
    if (submitting) return;
    if (isDirty(form, initial)) setConfirmDiscard(true);
    else closeComposer();
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched({ platforms: true, mediaUrl: true });
    if (!check.valid || submitting) return;
    setSubmitting(true);
    try {
      const draft = toDraft(form, tz);
      const saved = post ? await actions.updatePost(post.id, draft) : await actions.createPost(draft);
      const when = relativeDateTime(saved.scheduledAt);
      toast(post ? `Post updated — scheduled for ${when}` : `Post scheduled for ${when}`);
      closeComposer();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't save the post — please try again", 'error');
      setSubmitting(false);
    }
  };

  const contentProps = {
    // Escape and outside clicks go through the discard check instead of closing outright.
    onEscapeKeyDown: (e: globalThis.KeyboardEvent) => {
      e.preventDefault();
      requestClose();
    },
    onOpenAutoFocus: (e: Event) => {
      e.preventDefault();
      const el = textareaRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    },
    // Return focus to whatever opened the composer. Edit opens from a menu item
    // that has since unmounted, so use the post's ⋯ button instead.
    onCloseAutoFocus: (e: Event) => {
      e.preventDefault();
      const target = post ? document.getElementById(menuTriggerId(post.id)) : composerOpener();
      (target?.isConnected ? target : document.getElementById('main-content'))?.focus();
    },
    'aria-describedby': undefined,
  };

  const footer = (
    <>
      <Button onClick={requestClose} disabled={submitting} className={cn(!desktop && 'flex-1')} size={desktop ? 'md' : 'lg'}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={!check.valid}
        loading={submitting}
        loadingText={editing ? 'Saving…' : 'Scheduling…'}
        className={cn(!desktop && 'flex-1')}
        size={desktop ? 'md' : 'lg'}
      >
        {editing ? 'Save changes' : 'Schedule post'}
      </Button>
    </>
  );

  const body = (
    <ComposerFields
      form={form}
      check={check}
      update={update}
      touched={touched}
      setTouched={setTouched}
      submitting={submitting}
      desktop={desktop}
      textareaRef={textareaRef}
      now={now}
      tz={tz}
    />
  );

  const discard = (
    <Modal
      open={confirmDiscard}
      onOpenChange={setConfirmDiscard}
      title={editing ? 'Discard your changes?' : 'Discard this post?'}
      description={editing ? 'Your edits will be lost and the post stays as it was.' : "What you've written will be lost."}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        textareaRef.current?.focus();
      }}
      footer={
        <>
          <Button onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
          <Button variant="destructive" onClick={closeComposer}>
            Discard
          </Button>
        </>
      }
    >
      {null}
    </Modal>
  );

  if (!desktop) {
    return (
      <RadixDialog.Content
        {...contentProps}
        className="fixed inset-0 z-40 flex flex-col bg-surface text-text outline-none data-[state=open]:animate-sheet-up"
      >
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <header className="grid h-14 shrink-0 grid-cols-[44px_1fr_44px] items-center border-b border-border-subtle px-2">
            <CloseButton onClick={requestClose} disabled={submitting} />
            <RadixDialog.Title className="text-center text-[17px] font-semibold">{title}</RadixDialog.Title>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{body}</div>
          <div className="flex shrink-0 gap-3 border-t border-border-subtle px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        </form>
        {discard}
      </RadixDialog.Content>
    );
  }

  return (
    <>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in" />
      <RadixDialog.Content
        {...contentProps}
        // The content box fills the screen so the preview can sit beside the
        // card; clicks on its empty backdrop count as outside clicks.
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
        className="fixed inset-0 z-50 flex justify-center gap-6 overflow-y-auto px-8 py-10 outline-none data-[state=open]:animate-rise-in"
      >
        <form
          onSubmit={submit}
          noValidate
          className="flex h-fit max-h-[calc(100dvh-80px)] w-full max-w-[560px] flex-col rounded-2xl border border-border-subtle bg-surface-raised text-text shadow-pop"
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-6 py-4">
            <RadixDialog.Title className="mr-auto text-xl font-semibold">{title}</RadixDialog.Title>
            <CloseButton onClick={requestClose} disabled={submitting} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{body}</div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-border-subtle px-6 py-4">{footer}</div>
        </form>
        <ComposerPreview form={form} check={check} now={now} className="sticky top-0 hidden w-[340px] shrink-0 lg:block" />
        {discard}
      </RadixDialog.Content>
    </>
  );
}

function CloseButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      disabled={disabled}
      className="focus-ring grid size-11 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-50 sm:-mr-2 sm:size-9"
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  );
}

interface FieldsProps {
  form: ComposerForm;
  check: ReturnType<typeof checkForm>;
  update: (patch: Partial<ComposerForm>) => void;
  touched: { platforms: boolean; mediaUrl: boolean };
  setTouched: (fn: (t: { platforms: boolean; mediaUrl: boolean }) => { platforms: boolean; mediaUrl: boolean }) => void;
  submitting: boolean;
  desktop: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  now: Date;
  tz: string;
}

function ComposerFields({ form, check, update, touched, setTouched, submitting, desktop, textareaRef, now, tz }: FieldsProps) {
  const id = useId();
  const counterId = `${id}-counter`;
  const limitErrorId = `${id}-limit`;
  const platformErrorId = `${id}-platforms`;
  const scheduleErrorId = `${id}-schedule`;
  const scheduleHintId = `${id}-tz`;
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  console.log("PDFFILE", pdfRef.current?.files)


  const limitError = overLimitMessage(check.overLimit);
  const platformError = touched.platforms && form.platforms.length === 0;
  const imageError = touched.mediaUrl && check.badMediaUrl;
  const showImage = form.mediaUrl.trim() !== '' && !check.badMediaUrl;

  const togglePlatform = (p: Platform) => {
    setTouched((t) => ({ ...t, platforms: true }));
    update({ platforms: form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p] });
  };

  const onContentKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const scheduleDescribedBy = [check.pastSchedule && scheduleErrorId, scheduleHintId].filter(Boolean).join(' ');

  function clearPdf() {
    update({ pdfFile: null })
    if (pdfRef.current) {
      pdfRef.current.value = ''
    }
  }

  return (
    // A disabled fieldset locks every control while the post is being saved.
    <fieldset disabled={submitting} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
      <div className="flex flex-col gap-3">
        <Textarea
          ref={textareaRef}
          aria-label="Post content"
          aria-describedby={[limitError && limitErrorId, counterId].filter(Boolean).join(' ')}
          placeholder="What do you want to share?"
          value={form.content}
          onChange={(e) => update({ content: e.target.value })}
          onKeyDown={onContentKeyDown}
          invalid={Boolean(limitError)}
          className={cn(desktop ? 'min-h-40' : 'h-44 min-h-32')}
        />
        <div id={counterId} className="flex flex-col gap-2">
          {check.counted.length ? (
            check.counted.map((p) => <CharCounter key={p} platform={p} count={check.chars} />)
          ) : (
            <p className="text-[13px] text-text-muted">Pick a platform to see its character limit.</p>
          )}
        </div>
        <div aria-live="polite">{limitError && <FieldError id={limitErrorId}>{limitError}</FieldError>}</div>
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0" aria-describedby={platformError ? platformErrorId : undefined}>
        <legend className="mb-3 p-0 text-sm font-medium text-text">Post to</legend>
        <div className={cn('grid gap-3', desktop ? 'grid-cols-4' : 'grid-cols-2')}>
          {PLATFORMS.map(({ id: p }) => (
            <PlatformToggle
              key={p}
              platform={p}
              layout={desktop ? 'card' : 'row'}
              selected={form.platforms.includes(p)}
              invalid={platformError}
              onClick={() => togglePlatform(p)}
            />
          ))}
        </div>
        <div aria-live="polite">{platformError && <FieldError id={platformErrorId}>Select at least one platform</FieldError>}</div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <Field
          label="Image URL"
          labelSuffix="(optional)"
          error={imageError ? 'Enter a full link, starting with https://' : undefined}
        >
          <Input
            ref={imageRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://…"
            leadingIcon={<Link2 />}
            value={form.mediaUrl}
            onChange={(e) => update({ mediaUrl: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, mediaUrl: true }))}
          />
        </Field>
        {showImage && (
          <div className="flex items-center gap-3 rounded-[10px] border border-border-subtle bg-surface-sunken p-2 pr-1">
            <PostThumb url={form.mediaUrl.trim()} className="size-12" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-text-muted">{form.mediaUrl.trim()}</span>
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => {
                update({ mediaUrl: '' });
                imageRef.current?.focus();
              }}
              className="focus-ring grid size-11 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text sm:size-9"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Field
          label="PDF File"
          labelSuffix="(optional)"

        >
          <Input
            ref={pdfRef}
            type="file"
            placeholder="Attatch PDF"
            leadingIcon={<Link2 />}
            accept='application/pdf'
            onChange={(e) => update({ pdfFile: e.target.files?.[0] ?? null })}
          />

          {
            form.pdfFile && (
              <button
                type="button"
                aria-label="Remove PDF"
                onClick={clearPdf}
                className=" focus-ring grid size-11 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text sm:size-9"
              >
                Remove PDF
              </button>

            )
          }
        </Field>

      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" className="min-w-0">
            <Input
              type="date"
              min={dayKey(now, tz)}
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
              invalid={check.pastSchedule}
              aria-describedby={scheduleDescribedBy}
            />
          </Field>
          <Field label="Time" className="min-w-0">
            <Input
              type="time"
              value={form.time}
              onChange={(e) => update({ time: e.target.value })}
              invalid={check.pastSchedule}
              aria-describedby={scheduleDescribedBy}
            />
          </Field>
        </div>
        <div aria-live="polite">
          {check.pastSchedule && <FieldError id={scheduleErrorId}>Scheduled time must be in the future</FieldError>}
        </div>
        <p id={scheduleHintId} className="flex items-center gap-1.5 text-[13px] text-text-muted">
          <Globe className="size-3.5 shrink-0" aria-hidden="true" />
          Shown in your local time ({tz})
        </p>
      </div>
    </fieldset>
  );
}
