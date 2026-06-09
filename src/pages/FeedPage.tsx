// Public feed (/frontend/ux-states, /frontend/pagination). Lists published posts newest-first with
// "load more" cursor pagination. Loading / error / empty states are explicit.
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import Button from '@cloudscape-design/components/button';
import { useFeed } from '../hooks/useFeed';
import { PostCard } from '../components/PostCard';

export function FeedPage() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ContentLayout header={<Header variant="h1">Feed</Header>}>
      {isLoading && (
        <Box textAlign="center" padding="xxl">
          <Spinner size="large" />
        </Box>
      )}
      {isError && (
        <Alert type="error" header="Couldn't load the feed">
          Please try again later.
        </Alert>
      )}
      {!isLoading && !isError && posts.length === 0 && (
        <Box textAlign="center" color="text-status-inactive" padding="xxl">
          No posts yet.
        </Box>
      )}
      <SpaceBetween size="l">
        {posts.map((post) => (
          <PostCard key={post.post_id} post={post} />
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
