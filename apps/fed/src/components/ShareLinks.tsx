// Share deeplinks for an article (#183) — the FOOTER entry point.
//
// PLACEMENT AND FRAMING ARE UNCHANGED and deliberate: the reader who just finished is the one with
// something to say about it, so offering the share before the text asks them to recommend what they
// have not read. The header's compact button stays because that is the phone affordance and a phone
// reader shares mid-scroll. Two placements, two reasons.
//
// WHAT CHANGED (#314) IS THE SET, NOT THE LOOK. These render `SHARE_TARGETS` — the same list the header's
// modal renders — plus the copy-link the header always had and this block did not. Before, the two
// entry points offered different destinations and the reader met whichever they happened to reach.
//
// STILL INLINE ANCHORS RATHER THAN A SECOND MODAL. The unification #314 asked for is of the DESTINATIONS;
// forcing this block into a dialog would replace three visible desktop links with a button that hides
// them, which is a regression sold as consistency. The header needed a modal because its affordance is
// one compact control; this one has room.
//
// No third-party script: every platform documents a share URL that needs nothing loaded, so nothing runs
// until the reader clicks — the same rule the video facades and the consent bar hold (ADR-0002).
import { useState } from 'react';
import { useLocale, useT } from '../i18n';
import type { MessageKey } from '../i18n/messages';
import { SHARE_TARGETS, shareHref, copyLinkUrl } from './shareTargets';
import { trackShareComplete } from '../lib/analytics';

/**
 * `path` is the LOCALE-PREFIXED article path (`/pt/blog/meu-compromisso`). The slug is per-locale
 * (ADR-0037), so a share link built from the wrong edition's slug sends a pt reader an English article —
 * the caller resolves it, this component never guesses.
 *
 * `labelKey` is the CATALOG KEY for this group's accessible name, and it defaults to the article one
 * (#450). The block used to render only under `ArticlePage`, so `share.linksLabel` — "Compartilhar este
 * artigo" — was unconditionally true; `MarkdownPage`'s `endMatter` renders it on /architecture, which is
 * a section of this site and not a piece of writing, and a landmark that announces the wrong object type
 * to screen-reader users only is the two-tier truth standard this slice already refused one component up.
 * So the caller that is not an article passes `share.linksLabelPage`.
 *
 * A KEY, NOT A RESOLVED STRING: `MessageKey` is the catalog's leaf-path union, so a typo is a typecheck
 * failure here rather than a missing accessible name in production, and the both-locales assertion in
 * `messages.test.ts` keeps covering whatever a caller passes. Optional-with-a-default rather than
 * required, because the four live article pages must stay byte-identical and a required prop would have
 * meant editing their call site to say what it already said.
 */
export function ShareLinks({
  title,
  path,
  labelKey = 'share.linksLabel',
}: {
  title: string;
  path: string;
  labelKey?: MessageKey;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [copied, setCopied] = useState(false);

  // `share_complete` (#597). THIS ENTRY POINT EMITS TOO, and that is the point rather than symmetry for
  // its own sake: #314 made the modal and this block offer the same destinations, so instrumenting only
  // one would have turned the funnel into a measurement of which affordance the reader happened to be
  // nearer. The ceiling and the "emitted at the choice, not at a confirmed outcome" reasoning are
  // written once, on the modal.
  const copy = async () => {
    trackShareComplete({ locale, target: 'copy-link' });
    try {
      await navigator.clipboard.writeText(copyLinkUrl(path));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <nav aria-label={t(labelKey)} className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
        {t('share.linksHeading')}
      </span>
      {/* COPY-LINK LEADS HERE TOO (#387), matching the modal. The owner ordered the dialog and then
          extended the ruling — *"ajusta o rodapé também"* — so both entry points now put the clipboard
          first and then `SHARE_TARGETS` in its own order.

          The counter-argument, recorded so it is not re-litigated: this block's job is DISTRIBUTION, and
          leading with the three deeplinks suits a reader deciding where to SEND the article rather than
          how to save it. Overruled, and the reason is about a contradiction rather than about tidiness —
          copy-link is the only option that never leaves the page and the one just ranked first, and here
          it sat last while styled identically to the deeplinks, so it did not read as a different KIND of
          thing at all. A stated priority inverted on the surface a reader reaches after finishing the
          article is worse than a defensible alternative order.

          The label stays `share.copyLink`, the short published string — no copy moves with this. The
          modal names the clipboard because a second copy row sits beside it; there is still no second row
          here, and the markdown option remains modal-only. */}
      <button
        type="button"
        onClick={() => void copy()}
        className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:underline"
      >
        {copied ? t('share.copied') : t('share.copyLink')}
      </button>
      {SHARE_TARGETS.map((target) => (
        <a
          key={target.key}
          href={shareHref(target, path, title)}
          target="_blank"
          rel="noreferrer"
          // The accessible name says WHAT is being shared and WHERE. "LinkedIn" alone, repeated on every
          // article, is three identical links to a screen reader moving by link list.
          aria-label={`${t(target.nameKey)}: ${title}`}
          onClick={() => trackShareComplete({ locale, target: target.key })}
          className="font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:underline"
          data-locale={locale}
        >
          {target.label}
        </a>
      ))}
    </nav>
  );
}
