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
//
// AND IT IS NOT ONLY THE ARTICLE. `MarkdownPage` renders this too, so `/ramp-up` and `/architecture`
// get the modal — and those pages have NO footer share block, so on them the unification argument does
// not apply: there is no second affordance to converge with, and the sheet is removed with nothing
// gained. Still the right call, because the destinations there are the same three and one share
// behaviour across the site beats two. But the reasoning is narrower than on an article, and stating
// that is cheaper than letting the next reader assume the argument covered every call site.
//
// #387 ADDS A FIFTH OPTION — the page as markdown, on the clipboard — and it lives HERE and not in the
// footer's `ShareLinks`. That is a deliberate narrowing of #314's "both entry points offer the same
// destinations", and it is worth naming rather than hoping nobody checks: the equality #314 bought is
// still asserted on the three deeplinks and on copy-link, the two affordances still differ in no
// destination a reader can reach by another route, and the footer exists only on articles while this
// modal serves three surfaces. The Issue scoped the option to the modal; extending it to the footer is a
// decision, not an implementation detail, so it is not made here.
//
// THE FOOTER'S SILENT `catch {}` ALSO STAYS, for the reason the intake gave: it copies a 60-character URL
// the reader can select by hand, and the argument for a visible failure state is an argument about a
// payload the reader believes is a whole article.
//
// #409 RENDERS THIS TWICE ON AN ARTICLE PAGE — once in the header, once beside the footer's `ShareLinks`
// — so the label stopped being a constant and became `labelKey` / `labelNameKey`. It is the shape
// `ShareLinks` already carries for the same class of problem (#450), not a new convention; the two props
// and the 2.5.3 invariant binding them are documented on the props themselves.
import { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '../lib/cn';
import { useLocalePath, useT } from '../i18n';
import type { MessageKey } from '../i18n/messages';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { ShareModal } from './ShareModal';
import { copyLinkUrl } from './shareTargets';
import { markdownPayload } from './shareMarkdown';
import { ADR_INDEX_URL } from '../content/adrs';

export function ShareButton({
  title,
  url,
  body,
  size = 'md',
  labelKey = 'share.share',
  labelNameKey = labelKey,
}: {
  title: string;
  url: string;
  /**
   * The page's markdown body, for the copy-as-markdown option (#387) — the string the page RENDERS, not
   * the raw import: `RampUpPage` resolves `{{years}}` before its body reaches the shell, and reading the
   * rendered value is what keeps the token out of the clipboard without a second resolver.
   *
   * OPTIONAL, and that is the whole scope mechanism. A future page that adds this button without a body
   * offers four destinations and is silently correct; a route list would have to be remembered and would
   * rot. Every route that reaches this modal today HAS a markdown source, so today it is always passed.
   */
  body?: string;
  size?: 'sm' | 'md';
  /**
   * The trigger's VISIBLE label, as a catalog key, defaulting to the one every caller used before #409.
   * A key and not a resolved string, for the reason `ShareLinks.labelKey` gives: `MessageKey` is the
   * catalog's leaf-path union, so a typo is a typecheck failure here rather than a missing label in
   * production, and `messages.test.ts`'s both-locales assertion keeps covering whatever a caller passes.
   *
   * Optional-with-a-default rather than required, so the header trigger and `MarkdownPage`'s stay
   * byte-identical: a required prop would have meant editing two call sites to say what they already said.
   */
  labelKey?: MessageKey;
  /**
   * The trigger's ACCESSIBLE NAME, when it must differ from the visible label — the article footer, whose
   * trigger sits in the same row as `ShareLinks` and may not answer to the same name (#409).
   *
   * DEFAULTS TO `labelKey`, and that default is the invariant rather than a convenience: WCAG 2.5.3
   * (Label in Name) requires the accessible name to contain the visible one, and a caller that overrides
   * only the visible label therefore cannot break it. A caller that overrides BOTH owns the containment,
   * which is why the catalog's two `share.moreOptions*` strings are written as short ⊂ long.
   */
  labelNameKey?: MessageKey;
}) {
  const t = useT();
  const lp = useLocalePath();
  const [open, setOpen] = useState(false);
  // ONE HOOK CALL PER CONTROL — the two states stay independent, which is the property the suite asserts
  // ("the state is per control, and both were silent before"). See `useCopyToClipboard` for the whole
  // state machine; it moved there at #506 unchanged, so the draft review bar's copy affordance cannot
  // announce a failure differently from these two.
  const link = useCopyToClipboard();
  const markdown = useCopyToClipboard();
  const trigger = useRef<HTMLButtonElement>(null);

  // Built at click time, synchronously, and only when there is a body to build from. The synchronous
  // build is the Safari user-activation rule, argued on the hook: `writeText` must be the first thing
  // the handler awaits.
  const copyMarkdown = body
    ? () =>
        void markdown.copy(
          markdownPayload({
            title,
            path: url,
            body,
            localizePath: lp,
            sourceLabel: t('share.source'),
            adrIndexLabel: t('share.adrIndexLink'),
            adrIndexUrl: ADR_INDEX_URL,
          }),
        )
    : undefined;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(labelNameKey)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        )}
      >
        <Share2 size={size === 'sm' ? 14 : 16} />
        {t(labelKey)}
      </button>
      {open && (
        <ShareModal
          title={title}
          path={url}
          linkStatus={link.status}
          onCopyLink={() => void link.copy(copyLinkUrl(url))}
          markdownStatus={markdown.status}
          onCopyMarkdown={copyMarkdown}
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
