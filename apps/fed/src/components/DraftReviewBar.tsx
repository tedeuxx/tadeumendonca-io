// The draft review bar (#506) — the two affordances the owner reviews an article with, and nothing else.
//
// THE WORKFLOW IS WHAT EXPLAINS BOTH CONTROLS, so it is stated before either of them. He reads the piece
// at its real URL, side by side on a PC or a tablet; he copies the whole text; he pastes it into the
// article's `content` Issue, DELETES everything he is not commenting on, marks up what is left, and
// submits. The surviving text IS the anchor — that is why there are no markers, no paragraph ids and no
// coordinate scheme here. The anchoring came free and building any of it would have been building a
// second, worse version of what deleting already does.
//
// WHY THE CLIPBOARD AND NEVER A PREFILLED URL, which is the one decision in this file that looks like an
// implementation detail and is not. A prefilled `?body=` becomes a URL, and browsers and servers cut
// around 8 KB; his articles run 6–12 KB of text. So it would work on the short ones and silently truncate
// the long ones — the worst failure mode available, because the reviewer cannot see what was dropped and
// has no reason to suspect anything was. The clipboard has no ceiling and behaves identically on a
// tablet.
//
// THE GATE IS THE PREVIEW PARAMETER ALONE, decided in `ArticlePage` and not here. What follows from it,
// stated because it is the surprising half: a PUBLISHED article reached with `?preview` renders this bar
// too. That is the owner's own refinement — "esse argumento de query string pode permitir esses dois
// botoes visualizados tbm" — and it is why nothing in this component reads `draft`. The consequence he
// asked for is that promotion rebuilds NOTHING: the date moves, the article enters the index, and this
// page is not rebuilt, because the mode was never in the build. Narrowing the gate to `draft && preview`
// would be a second condition nobody asked for and would take the affordance away from the case where an
// already-published piece needs another round.
//
// ~~the bar stops appearing because nobody arrives with the parameter~~ — STRUCK. The citation this
// component copies carries `?preview`, and the ratified workflow publishes that payload on a public
// Issue every round, so links carrying the parameter exist in the world and survive promotion. The true
// statement is narrower and is the one to rely on: nobody sees the bar at a URL that does not carry the
// parameter. `ArticlePage`'s own comment carries the full accounting.
import { MessageSquare, ClipboardCopy, AlertTriangle } from 'lucide-react';
import { useLocalePath, useT } from '../i18n';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { markdownPayload } from './shareMarkdown';
import { PREVIEW_PARAM } from '../lib/preview';
import { ADR_INDEX_URL } from '../content/adrs';

/**
 * Where a `content`-typed Issue lives.
 *
 * The repository URL is spelled in three other places already (`lib/version.ts`'s release link,
 * `data/repoCards.ts`, `content/adrs.ts`'s ADR base). Consolidating the four into one constant is a
 * cleanup with its own blast radius — `repoCards` lists other people's repositories under the same field
 * name — and it is not this slice's, so this adds a fourth rather than pretending to fix the first three.
 * Named and exported so the test asserts the built URL rather than re-typing it.
 */
export const contentIssueUrl = (issue: number) => `https://github.com/tedeuxx/tadeumendonca-io/issues/${issue}`;

export function DraftReviewBar({
  title,
  path,
  body,
  contentIssue,
}: {
  title: string;
  /** The LOCALE-PREFIXED article path (`/pt/blog/meu-compromisso`), as `ArticlePage` builds it. */
  path: string;
  /** The markdown body the page RENDERS — the same string `ShareButton` receives, for the same reason. */
  body: string;
  /**
   * The article's review Issue, from frontmatter, ABSENT for every article authored before #506.
   *
   * NO NUMBER, NO BUTTON — the whole degradation, and it is deliberate rather than defensive. The two
   * alternatives were both worse in the same way: a link to the tracker's front page, or a link built
   * from some other identifier, would be a control that appears to work and lands the reviewer somewhere
   * he did not ask to be. A missing button is legible; a wrong destination is not. `content.ts` closes
   * the other half — a frontmatter value that is present and unusable fails the build rather than
   * arriving here as `undefined`, so this branch means "no Issue was named", never "an Issue was named
   * badly".
   */
  contentIssue?: number;
}) {
  const t = useT();
  const lp = useLocalePath();
  const clipboard = useCopyToClipboard();

  // THE COPIED CITATION CARRIES THE PREVIEW PARAMETER, and this is the seam `preview.ts` was written to
  // be used through: "any future affordance that has to BUILD such a URL (#506's review buttons) spells
  // it once rather than re-typing a string that is a URL contract the moment it is used."
  //
  // It carries it UNCONDITIONALLY rather than only for a held article. The link is for the reviewer, and
  // his article is held while he is reviewing it — a citation without the parameter would redirect him to
  // the locale home, which reads as the article having disappeared. On a published article the parameter
  // is inert, so one behaviour covers both states and there is no branch to get backwards.
  const previewPath = `${path}?${PREVIEW_PARAM}`;

  // Built at click time, synchronously — the Safari user-activation rule argued on `useCopyToClipboard`.
  //
  // `markdownPayload` and NOT a payload of this component's own: it is the same document the share modal
  // already produces (#387), and it is already the right one — root-relative links absolutized, the ADR
  // index fence resolved to a link, the title as an H1 and the citation at the top. A second builder
  // would be a second answer to "what is this article as text", and the two would drift.
  const copy = () =>
    void clipboard.copy(
      markdownPayload({
        title,
        path: previewPath,
        body,
        localizePath: lp,
        sourceLabel: t('share.source'),
        adrIndexLabel: t('share.adrIndexLink'),
        adrIndexUrl: ADR_INDEX_URL,
      }),
    );

  // The label IS the feedback, and both outcomes reuse the share modal's strings — `share.copied` /
  // `share.copyFailed`. Not new keys: they say exactly this, and a second pair would be two spellings of
  // one outcome that a future reword would fix in one of them.
  const copyLabel =
    clipboard.status === 'copied'
      ? t('share.copied')
      : clipboard.status === 'failed'
        ? t('share.copyFailed')
        : t('review.copyText');
  const CopyIcon = clipboard.status === 'failed' ? AlertTriangle : ClipboardCopy;

  return (
    // A group rather than a nav: one of the two controls is a link and the other is not, so `navigation`
    // would name it something it is not to exactly the users who rely on the name.
    <div
      role="group"
      aria-label={t('review.label')}
      className="mb-6 flex flex-wrap items-center gap-2 border-2 border-border-strong p-2"
    >
      {contentIssue !== undefined && (
        <a
          href={contentIssueUrl(contentIssue)}
          target="_blank"
          rel="noreferrer"
          aria-label={t('review.openIssueLabel')}
          className="inline-flex items-center gap-2 border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-wider invert-hover"
        >
          <MessageSquare size={14} className="shrink-0" />
          {t('review.openIssue')}
        </a>
      )}
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-wider invert-hover"
      >
        <CopyIcon size={14} className="shrink-0" />
        {/* Announced, for the same reason the modal's row is: a sighted reader sees the word swap and a
            screen-reader user would otherwise get nothing at all for either outcome — and the failure is
            the only signal that the paste will be empty. Polite, not assertive: a confirmation, not an
            interruption. */}
        <span aria-live="polite">{copyLabel}</span>
      </button>
    </div>
  );
}
