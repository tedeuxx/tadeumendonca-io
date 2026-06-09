// Single post detail (/frontend/ux-states). Public; the URL (/posts/:postId) is what notification
// emails and og:image deep-links point at. Loading / not-found states are explicit.
import { useParams } from 'react-router-dom';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Box from '@cloudscape-design/components/box';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import { usePost } from '../hooks/useFeed';
import { PostCard } from '../components/PostCard';

export function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError } = usePost(postId ?? '');

  if (isLoading) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }
  if (isError || !post) {
    return (
      <ContentLayout>
        <Alert type="error" header="Post not found">
          This post doesn’t exist or isn’t published.
        </Alert>
      </ContentLayout>
    );
  }
  return (
    <ContentLayout>
      <PostCard post={post} linkTitle={false} />
    </ContentLayout>
  );
}
