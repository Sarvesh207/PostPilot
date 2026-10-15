import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';

const TONES = [
  'bg-thumb-peach text-thumb-peach-icon',
  'bg-thumb-sand text-thumb-sand-icon',
  'bg-thumb-rose text-thumb-rose-icon',
] as const;

// Remember URLs that failed so re-renders don't re-request them.
const broken = new Set<string>();

function toneFor(url: string) {
  let h = 0;
  for (const ch of url) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

/**
 * Square post thumbnail. Shows the image when it loads, otherwise a tinted
 * placeholder (the demo URLs point at a CDN that doesn't exist).
 */
export function PostThumb({ url, className }: { url: string; className?: string }) {
  const [failed, setFailed] = useState(() => broken.has(url));
  return (
    <div
      className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg', !failed ? 'bg-surface-sunken' : toneFor(url), className)}
    >
      {failed ? (
        <ImageIcon className="size-5" aria-hidden="true" />
      ) : (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => {
            broken.add(url);
            setFailed(true);
          }}
        />
      )}
    </div>
  );
}
