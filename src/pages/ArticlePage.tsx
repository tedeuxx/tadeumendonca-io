// Article detail (/frontend/ux-states, /frontend/markdown). Public; the URL (/articles/:slug) is what
// og:image deep-links + notification links point at. Markdown body with syntax highlighting.
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useArticle } from '../hooks/useArticles';
import { Markdown } from '../components/Markdown';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, isError } = useArticle(slug ?? '');

  return (
    <div>
      <ColumnHeader title="Artigo" back />
      {isLoading && <CenterLoader />}
      {(isError || (!isLoading && !article)) && <Notice>Este artigo não existe ou não está publicado.</Notice>}

      {article && (
        <article className="px-4 py-5">
          <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <time dateTime={article.created_at}>{fmtDate(article.created_at)}</time>
            <span>·</span>
            <RouterLink to={`/blog?tag=${article.tag}`} className="font-medium text-primary hover:underline">
              #{article.tag}
            </RouterLink>
          </div>
          <div className="mt-5 text-[17px] leading-relaxed text-foreground/90">
            <Markdown>{article.body}</Markdown>
          </div>
        </article>
      )}
    </div>
  );
}
