// Article detail (/frontend/ux-states, /frontend/markdown). Public; the URL (/articles/:slug) is what
// og:image deep-links + notification links point at. Markdown body with syntax highlighting.
import { useParams } from 'react-router-dom';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Badge from '@cloudscape-design/components/badge';
import { useArticle } from '../hooks/useArticles';
import { Markdown } from '../components/Markdown';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, isError } = useArticle(slug ?? '');

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }
  if (isError || !article) {
    return (
      <ContentLayout>
        <Alert type="error" header="Article not found">
          This article doesn’t exist or isn’t published.
        </Alert>
      </ContentLayout>
    );
  }
  return (
    <ContentLayout
      header={
        <Header variant="h1" description={`${fmtDate(article.created_at)} · ${article.tag}`}>
          {article.title}
        </Header>
      }
    >
      <Box padding={{ bottom: 'm' }}>
        <Badge color="blue">{article.tag}</Badge>
      </Box>
      <Box variant="p">
        <Markdown>{article.body}</Markdown>
      </Box>
    </ContentLayout>
  );
}
