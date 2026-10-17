import { PlatformStack } from '../../components/ui/PlatformGlyph';
import { cn } from '../../lib/cn';
import { relativeDateTime, timeZoneAbbr } from '../../lib/dates';
import { PostThumb } from '../queue/PostThumb';
import type { ComposerForm, FormCheck } from './composerForm';

/** Desktop-only live preview of the post, beside the composer card. */
export function ComposerPreview({
  form,
  check,
  now,
  className,
}: {
  form: ComposerForm;
  check: FormCheck;
  now: Date;
  className?: string;
}) {
  const imageUrl = form.imageUrl.trim();
  const when = check.scheduledAt
    ? `${relativeDateTime(check.scheduledAt, now)} ${timeZoneAbbr(check.scheduledAt)}`
    : 'Pick a date and time';

  return (
    <section aria-labelledby="composer-preview-heading" className={className}>
      <h2 id="composer-preview-heading" className="mb-3 text-sm font-semibold text-white">
        Preview
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised text-text shadow-pop">
        <div className="flex items-center gap-3 px-4 pt-4">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text"
            aria-hidden="true"
          >
            YB
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-semibold">[Your brand]</p>
            <p className={cn('mt-0.5 truncate text-[13px]', check.scheduledAt ? 'text-text-muted' : 'text-text-subtle')}>
              {when}
            </p>
          </div>
        </div>

        <p
          className={cn(
            'whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-relaxed',
            !form.content.trim() && 'text-text-subtle',
          )}
        >
          {form.content.trim() ? form.content : 'Your post will appear here.'}
        </p>

        {imageUrl && !check.badImageUrl && (
          <PostThumb url={imageUrl} className="aspect-[16/10] w-full rounded-none [&_svg]:size-9" />
        )}

        <div className="flex min-h-12 items-center gap-2 px-4 py-3 text-[13px] text-text-muted">
          {check.counted.length ? (
            <>
              Posting to
              <PlatformStack platforms={check.counted} overlap={false} />
            </>
          ) : (
            'No platforms selected'
          )}
        </div>
      </div>
    </section>
  );
}
