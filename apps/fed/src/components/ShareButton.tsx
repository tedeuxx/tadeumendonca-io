// Share button (/frontend/design-system) — public. The article's header share affordance.
//
// IT NO LONGER SHARES DIRECTLY (#314). It used to call the Web Share API, falling back to a clipboard
// copy — two destinations, while the footer block offered three different ones. Two placements with
// two reasons to exist is right and both stay; two placements with two FEATURE SETS was the accident,
// and which one a reader met was down to where they happened to look.
//
// So this opens the modal, which renders the one shared target list (`shareTargets.ts`). The layout
// here is unchanged — it is the compact affordance the owner asked to keep, and the phone reader who
// shares mid-scroll still reaches it in the same place, with the same size.
//
// THE NATIVE SHARE SHEET IS GONE, and that is a real loss stated rather than glossed: on a phone the OS
// sheet reaches apps this modal cannot (Signal, Notes, AirDrop). What it could not do is be the same
// affordance as the footer's, which is what #314 asked for — and it is not recoverable by offering both,
// because "tap share, sometimes get the OS sheet and sometimes get our modal" is a worse contract than
// either. The `share-sheet` UTM source stays defined in `utm.ts`; nothing emits it now, and the
// historical rows keep their meaning.
import { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../i18n';
import { ShareModal } from './ShareModal';
import { copyLinkUrl } from './shareTargets';

export function ShareButton({ title, url, size = 'md' }: { title: string; url: string; size?: 'sm' | 'md' }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyLinkUrl(url));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('share.share')}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        )}
      >
        <Share2 size={size === 'sm' ? 14 : 16} />
        {t('share.share')}
      </button>
      {open && (
        <ShareModal
          title={title}
          path={url}
          copied={copied}
          onCopy={() => void copy()}
          onClose={() => setOpen(false)}
          returnFocusTo={trigger}
        />
      )}
    </>
  );
}

// The article's share path. It is just the canonical route — there is no short-code form and no
// redirect service behind one (#268): `/p/<code>` was the retired Hono/Lambda BFF's shape, and on a
// static site nothing can mint or resolve one. Kept as a function rather than inlined at the call
// site so the ONE place that decides a share path stays one place.
export const articleShareUrl = (a: { slug: string }) => `/blog/${a.slug}`;
