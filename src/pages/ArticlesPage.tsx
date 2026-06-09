// Articles list (/frontend/ux-states, /frontend/pagination). Lists published articles newest-first with
// an optional tag filter (?tag= in the URL) + cursor "load more". Explicit loading/empty/error states.
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Button from '@cloudscape-design/components/button';
import Container from '@cloudscape-design/components/container';
import Link from '@cloudscape-design/components/link';
import Badge from '@cloudscape-design/components/badge';
import { useArticles } from '../hooks/useArticles';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? undefined;
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useArticles(tag);
  const articles = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ContentLayout
      header={
        <Header variant="h1" description={tag ? `Tag: ${tag}` : undefined} actions={tag ? <Button onClick={() => setParams({})}>Clear filter</Button> : undefined}>
          Articles
        </Header>
      }
    >
      {isLoading && (
        <Box textAlign="center" padding="xxl">
          <Spinner size="large" />
        </Box>
      )}
      {isError && (
        <Alert type="error" header="Couldn't load articles">
          Please try again later.
        </Alert>
      )}
      {!isLoading && !isError && articles.length === 0 && (
        <Box textAlign="center" color="text-status-inactive" padding="xxl">
          No articles yet.
        </Box>
      )}
      <SpaceBetween size="l">
        {articles.map((a) => (
          <Container
            key={a.article_id}
            header={
              <Header variant="h2" description={`${fmtDate(a.created_at)} · ${a.tag}`}>
                <Link fontSize="heading-m">
                  <RouterLink to={`/articles/${a.slug}`}>{a.title}</RouterLink>
                </Link>
              </Header>
            }
          >
            <SpaceBetween size="s">
              {a.excerpt && <Box variant="p">{a.excerpt}</Box>}
              <Box>
                <Link onFollow={() => setParams({ tag: a.tag })}>
                  <Badge color="blue">{a.tag}</Badge>
                </Link>
              </Box>
            </SpaceBetween>
          </Container>
        ))}
        {hasNextPage && (
          <Box textAlign="center">
            <Button onClick={() => void fetchNextPage()} loading={isFetchingNextPage}>
              Load more
            </Button>
          </Box>
        )}
      </SpaceBetween>
    </ContentLayout>
  );
}
