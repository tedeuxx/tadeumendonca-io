// Article detail (/frontend/markdown). Public; /blog/:slug is what OG deep-links point at. Reads the
// post from markdown-in-repo (../lib/content) and renders its markdown body — fully static, no backend.
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getEditions, getPostBySlug } from '../lib/content';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { absoluteUrl } from '../lib/site';
import { Markdown } from '../components/Markdown';
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
  const article = slug ? getPostBySlug(slug, locale) : undefined;
  // The edition GROUP (both locales) so hreflang can advertise each locale's OWN slug — the canonical /
  // og:url stay this locale's slug (self), the alternates carry the localized pair (ADR-0037).
  const eds = slug ? getEditions(slug, locale) : undefined;

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
          <header className="mb-[clamp(1.8rem,3vw,2.6rem)] border-b-2 border-border-strong pb-[clamp(1.4rem,3vw,2rem)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              <time dateTime={article.date}>{fmtDate(article.date, locale)}</time>
              {article.tag && <span>· #{article.tag}</span>}
              <span>· {t(TRACK_KEY[article.track])}</span>
              {/* `article.body` is the frontmatter-stripped remainder `content.ts` already returns — the
                  raw glob is module-private and never exported, so no `slug`/`date`/`track` can reach the
                  clipboard (#387). It is also the exact string rendered below. */}
              <ShareButton title={article.title} url={lp(articleShareUrl(article))} body={article.body} size="sm" />
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
            <Markdown>{article.body}</Markdown>
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
                that block. */}
            <ShareButton title={article.title} url={lp(articleShareUrl(article))} body={article.body} size="sm" />
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
