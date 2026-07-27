// Article detail (/frontend/markdown). Public; /blog/:slug is what OG deep-links point at. Reads the
// post from markdown-in-repo (../lib/content) and renders its markdown body — fully static, no backend.
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getEditions, getPostBySlug } from '../lib/content';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { absoluteUrl } from '../lib/site';
import { Markdown } from '../components/Markdown';
import { ShareButton, articleShareUrl } from '../components/ShareButton';
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

  useDocumentHead(
    article && eds
      ? {
          title: article.title,
          description: article.excerpt,
          canonicalPath: `/blog/${article.slug}`,
          image: article.ogImage,
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
              <ShareButton title={article.title} url={lp(articleShareUrl(article))} size="sm" />
            </div>
            <h1 className="mt-4 max-w-[22ch] text-balance text-[clamp(2rem,5.5vw,4rem)] font-bold leading-none tracking-[-0.035em]">
              {article.title}
            </h1>
          </header>

          <div className="max-w-none text-[17px] leading-relaxed text-foreground/90">
            <Markdown>{article.body}</Markdown>
          </div>

          <footer className="mt-[clamp(2rem,4vw,3rem)] flex flex-wrap border-t border-border pt-5">
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
