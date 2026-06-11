// Single post detail (/frontend/ux-states). Public; the URL (/posts/:postId) is what notification
// emails and og:image deep-links point at. Loading / not-found states are explicit.
import { useParams } from 'react-router-dom';
import { usePost } from '../hooks/useFeed';
import { PostCard } from '../components/PostCard';
import { CommentsSection } from '../components/CommentsSection';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';

export function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError } = usePost(postId ?? '');

  return (
    <div>
      <ColumnHeader title="Post" back />
      {isLoading && <CenterLoader />}
      {(isError || (!isLoading && !post)) && <Notice>Este post não existe ou não está publicado.</Notice>}
      {post && (
        <>
          <PostCard post={post} linkTitle={false} />
          <CommentsSection postId={post.post_id} />
        </>
      )}
    </div>
  );
}
