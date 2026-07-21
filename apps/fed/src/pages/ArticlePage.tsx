// Article detail (/frontend/markdown). Public; /blog/:slug is what OG deep-links point at. Reads the
// post from markdown-in-repo (../lib/content) and renders its markdown body — fully static, no backend.
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getPostBySlug } from '../lib/content';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { absoluteUrl } from '../lib/site';
import { Markdown } from '../components/Markdown';
import { ShareButton, articleShareUrl } from '../components/ShareButton';
import { ColumnHeader, Notice } from '../components/Column';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getPostBySlug(slug) : undefined;

  useDocumentHead(
    article
      ? {
          title: article.title,
          description: article.excerpt,
          canonicalPath: `/blog/${article.slug}`,
          image: article.ogImage,
          type: 'article',
          publishedTime: article.date,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            datePublished: article.date,
            articleSection: article.tag,
            url: absoluteUrl(`/blog/${article.slug}`),
            author: { '@type': 'Person', name: 'Luiz Tadeu Mendonça' },
          },
        }
      : { title: 'Artigo não encontrado', canonicalPath: '/blog' },
  );

  return (
    <div>
      <ColumnHeader title="Blog" back />
      {!article && <Notice>Este artigo não existe ou não está publicado.</Notice>}

      {article && (
        <article className="px-4 py-5">
          <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <time dateTime={article.date}>{fmtDate(article.date)}</time>
            <span>·</span>
            <RouterLink to={`/blog?tag=${article.tag}`} className="font-medium text-primary hover:underline">
              #{article.tag}
            </RouterLink>
            <span>·</span>
            <ShareButton title={article.title} url={articleShareUrl(article)} size="sm" />
          </div>
          <div className="mt-5 text-[17px] leading-relaxed text-foreground/90">
            <Markdown>{article.body}</Markdown>
          </div>
        </article>
      )}
    </div>
  );
}
