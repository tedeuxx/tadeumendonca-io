// Article detail (/frontend/markdown). Public; /blog/:slug is what OG deep-links point at. Reads the
// post from markdown-in-repo (../lib/content) and renders its markdown body — fully static, no backend.
import { useRef } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import { getEditions, getPostBySlug } from '../lib/content';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { useArticleProgress } from '../hooks/useArticleProgress';
import { absoluteUrl } from '../lib/site';
import { isPreviewRequested } from '../lib/preview';
import { Markdown } from '../components/Markdown';
import { DraftReviewBar } from '../components/DraftReviewBar';
import { ShareButton, articleShareUrl } from '../components/ShareButton';
import { ShareLinks } from '../components/ShareLinks';
import { ColumnHeader, Notice } from '../components/Column';
import { dateLocale, useLocale, useLocalePath, type Locale, type MessageKey } from '../i18n';

const fmtDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(dateLocale(locale), { year: 'numeric', month: 'short', day: 'numeric' });

const TRACK_KEY = { pessoal: 'tracks.pessoal', engenharia: 'tracks.engenharia' } as const satisfies Record<string, MessageKey>;

export function ArticlePage() {
  const { locale, t } = useLocale();
  const lp = useLocalePath();
  const { slug } = useParams<{ slug: string }>();
  const { search } = useLocation();
  const article = slug ? getPostBySlug(slug, locale) : undefined;
  // THE REVIEW BAR'S GATE, and it is the parameter ALONE (#506) — the owner's refinement: "esse argumento
  // de query string pode permitir esses dois botoes visualizados tbm".
  //
  // NOT `article.draft && …`, deliberately, and the consequence is stated rather than left to be
  // discovered: a PUBLISHED article reached with `?preview` renders the bar too. Three reasons, in the
  // order they weighed. (1) It is what he asked for, in those words. (2) It is what makes promotion
  // rebuild nothing — the date moves, the article enters the index, and NOTHING about this page is
  // rebuilt, because the mode was never in the build. (3) A second round on an already-published piece is
  // a real case, and a `draft` gate would take the affordance away exactly there.
  //
  // WHAT IT COSTS, and this is larger than "a visitor who appends the parameter" — the enlargement is
  // this slice's own doing. The copy payload's citation carries `?preview` unconditionally, and the
  // ratified workflow pastes that payload into a PUBLIC `content` Issue every review round. So the
  // parameter travels in published links: a reader can arrive here by CLICKING, without ever knowing the
  // parameter exists. What they meet is a copy button that copies what the page already shows, plus —
  // only where the article names one — a link to a public Issue. Judged and accepted rather than
  // narrowed: a stranger following such a link finds the owner's own review machinery on the page, which
  // is this site's argument visible rather than asserted.
  //
  // What stays true without qualification, and is the sentence to reach for: NOBODY SEES ANY OF THIS AT A
  // URL THAT DOES NOT CARRY THE PARAMETER. That one is pinned — the two tests named on the `review` group
  // in `messages.ts`.
  //
  // Read from `useLocation`, not `window.location`, for the reason `ArticleRoute` gives one layer up: a
  // client-side navigation is the one moment the two disagree.
  const reviewing = isPreviewRequested(search);
  // The edition GROUP (both locales) so hreflang can advertise each locale's OWN slug — the canonical /
  // og:url stay this locale's slug (self), the alternates carry the localized pair (ADR-0037).
  const eds = slug ? getEditions(slug, locale) : undefined;

  // #597. The progress observer watches `Markdown`'s own wrapper — an element that was ALREADY HERE.
  // Read `useArticleProgress` for why introducing a sentinel node would have been the wrong shape on a
  // prerendered page. Called unconditionally (the not-found arm renders no prose, so the ref is null and
  // the hook returns), because a hook may not sit behind `article &&`.
  const prose = useRef<HTMLDivElement>(null);
  useArticleProgress({ container: prose, slug: article?.slug ?? '', body: article?.body ?? '' });

  // DELIBERATE EXCEPTION to ADR-0045. An article is a document, not a section: its own name IS the
  // address a reader bookmarks, searches for and shares, and prefixing it with a section label would
  // spend the front of the tab — and the front of a SERP line — on the word every article would repeat.
  // The not-found arm is the same reasoning: "Artigo não encontrado" is the state, and it is what the
  // reader needs to see first.
  useDocumentHead(
    article && eds
      ? {
          title: article.title,
          description: article.excerpt,
          canonicalPath: `/blog/${article.slug}`,
          image: article.ogImage,
          // The card IS the title, set over the site's art (ADR-0041) — so the title is what the alt
          // says. Not the default card's alt: that describes a different picture, and a screen-reader
          // user is the one reader who cannot notice the substitution.
          imageAlt: article.title,
          type: 'article',
          publishedTime: article.date,
          // A HELD article is reachable at its final URL and out of the sitemap (#510). Nothing links it,
          // so a crawler has no path to it — this covers the case where the URL reaches one anyway, and
          // it is the weaker half of the hold rather than its mechanism (see `DocumentHead.robots`).
          // `nofollow` too: a held draft's outbound links should not spend crawl budget or pass signal
          // from a page that is, by construction, not published yet.
          robots: article.draft ? 'noindex, nofollow' : undefined,
          alternates: { pt: `/blog/${eds.pt.slug}`, en: `/blog/${eds.en.slug}` },
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            datePublished: article.date,
            articleSection: article.tag,
            url: absoluteUrl(lp(`/blog/${article.slug}`)),
            author: { '@type': 'Person', name: 'Luiz Tadeu Mendonça' },
          },
        }
      : { title: t('article.notFoundTitle'), canonicalPath: '/blog' },
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ColumnHeader title="Blog" back />
      {!article && <Notice>{t('article.notFoundBody')}</Notice>}

      {article && (
        <article className="px-[--gutter] py-6">
          {/* ABOVE THE TITLE, not below the body. The reviewer's first action on landing is to copy the
              text, and a control he has to scroll past the whole article to reach is a control he reaches
              after doing the thing it was there to help with. It also keeps the published page's own
              layout untouched: nothing above the header moves when the bar is absent, because the bar is
              the only thing that was ever there. */}
          {reviewing && (
            <DraftReviewBar
              title={article.title}
              path={lp(articleShareUrl(article))}
              body={article.body}
              contentIssue={article.contentIssue}
            />
          )}
          <header className="mb-[clamp(1.8rem,3vw,2.6rem)] border-b-2 border-border-strong pb-[clamp(1.4rem,3vw,2rem)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              <time dateTime={article.date}>{fmtDate(article.date, locale)}</time>
              {article.tag && <span>· #{article.tag}</span>}
              <span>· {t(TRACK_KEY[article.track])}</span>
              {/* `article.body` is the frontmatter-stripped remainder `content.ts` already returns — the
                  raw glob is module-private and never exported, so no `slug`/`date`/`track` can reach the
                  clipboard (#387). It is also the exact string rendered below. */}
              <ShareButton
                title={article.title}
                url={lp(articleShareUrl(article))}
                // The edition's OWN slug (ADR-0037 makes it per-locale), so `share_open` and the article
                // events name the same piece and can be joined. The page holds it; nothing derives it.
                slug={article.slug}
                body={article.body}
                size="sm"
              />
            </div>
            {/* Same heading shape, same fix, same reasoning as `MarkdownPage.tsx` (#392) — read the long
                comment there for WHY `text-balance` is the bigger half of the cause and why `text-pretty`
                replaces it rather than nothing. #392 landed on that component only; this header is a
                second copy of the same markup (`LibraryPage` is a third), so the article page kept the
                squeezed title after `/architecture` and `/ramp-up` were fixed, until the owner reported
                it from the live site. Measured here the same way — Chromium, built site, against the
                header's own content measure, both editions:

                  1280px, 921.63px measure
                    pt "Da cloud à IA, com o mesmo crachá."   before  box 912.38 · widest 520.97 (56.5%)
                                                              after   box 921.63 · widest 793.67 (86.1%)
                    en "From cloud to AI, on the same badge." before  box 912.38 · widest 568.91 (61.7%)
                                                              after   box 921.63 · widest 845.52 (91.7%)

                86% and 92%, not the 98% #392 recorded, and that is the fix working rather than working
                partly: a filled line still has to end at a word boundary, and these two titles have no
                break point nearer the edge. The number to compare against is the 56–62% the balanced
                version drew, not `/architecture`'s. The clearer reading is one viewport down, where the
                change removes the wrap entirely — at 1024px both editions go from two balanced lines
                (458.45 / 500.64) to ONE line filling the measure (900.63 / 933.28), and the same at 768.

                The short-title case was measured rather than assumed, because it is the one this change
                could plausibly make worse: "Meu Compromisso" / "My Commitment" fit on one line from 320px
                up, so `balance` was already a no-op on them and `pretty` is one too — the drawn line is
                byte-identical before and after at every width swept (266.31 / 239.11 at 320px, 532.61 /
                478.22 at 1280px). Only the invisible element box moves. At 320px the cap was inert on
                every title anyway (box 284 = measure 284), which is #392's own finding re-confirmed here.

                What binds this is `e2e/page-heading-measure.spec.ts` — renamed from
                `markdown-page-heading.spec.ts`, because a check scoped to ONE component is what let this
                copy drift. It now drives all ten heading routes and probes each with a fixed heading
                rather than the shipped title. */}
            <h1 className="mt-4 text-pretty text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
              {article.title}
            </h1>
          </header>

          <div className="max-w-none text-[17px] leading-relaxed text-foreground/90">
            {/* The ref goes to `Markdown`'s OWN wrapper, not to this one (#597). This div has exactly
                one child — that wrapper — so an observer built from it would treat the entire article as
                a single block and never report a milestone. Found by the E2E, not by the unit suite,
                which is recorded on the `blockRef` prop. */}
            <Markdown blockRef={prose}>{article.body}</Markdown>
          </div>

          {/* The deeplinks sit at the END of the article, not in the header (#183). A reader who has
              just finished is the one with something to say about it; offering the share before the text
              asks them to recommend what they have not read. The header's ShareButton stays — it is the
              phone affordance, and a phone reader shares mid-scroll. */}
          <div className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
            <ShareLinks title={article.title} path={lp(`/blog/${article.slug}`)} />
            {/* #409, owner decision (A): the SAME ELEMENT as the header, not the same capability. The
                footer carries the modal trigger beside the deeplink block, so the reader who has just
                finished reaches copy-as-markdown (#387) without scrolling back up. The redundancy is real
                and accepted — after #314 both blocks already reach the same three deeplinks and
                copy-link — and (B), folding markdown into `ShareLinks`, is decided AGAINST, which is why
                the footer's silent `catch {}` reasoning is untouched: no article-sized payload enters
                that block.

                IT DOES NOT ANSWER TO "COMPARTILHAR", and that is the owner's second decision on this
                slice rather than an implementation detail. The same element in two places under one label
                put two byte-identical buttons on the page — the collision `share.linksLabel`'s comment
                had already named and ruled against for the nav beside it. This one names what it ADDS
                over that nav: the nav is the direct destinations, this opens the dialog that also carries
                copy-as-markdown (#387). The visible label moves with the accessible name because 2.5.3
                requires containment; the full reasoning, including why `linksLabel` was not reused
                despite already reading exactly right, is on the catalog keys. The HEADER trigger is
                untouched. */}
            <ShareButton
              title={article.title}
              url={lp(articleShareUrl(article))}
              slug={article.slug}
              body={article.body}
              size="sm"
              labelKey="share.moreOptions"
              labelNameKey="share.moreOptionsLabel"
            />
          </div>

          <footer className="mt-5 flex flex-wrap border-t border-border pt-5">
            {/* The /blog list is retired: "back to the articles" points at the landing's section. */}
            <RouterLink
              to={lp('/#artigos')}
              className="-mr-px border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-wider invert-hover"
            >
              {t('article.allArticles')}
            </RouterLink>
            {article.linkedinUrl && (
              <a
                href={article.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="-mr-px border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-wider invert-hover"
              >
                {t('articles.viewOnLinkedin')}
              </a>
            )}
          </footer>
        </article>
      )}
    </div>
  );
}
