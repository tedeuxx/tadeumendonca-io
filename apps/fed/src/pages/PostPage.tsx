// Single post detail (/frontend/ux-states). Public; the URL (/posts/:postId) is what notification
// emails and og:image deep-links point at. Loading / not-found states are explicit.
import { useNavigate, useParams } from 'react-router-dom';
import { usePost } from '../hooks/useFeed';
import { useDeletePost } from '../hooks/usePostMutations';
import { PostCard } from '../components/PostCard';
import { CommentsSection } from '../components/CommentsSection';
import { AdminActions } from '../components/AdminActions';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';

export function PostPage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError } = usePost(postId ?? '');
  const del = useDeletePost();

  return (
    <div>
      <ColumnHeader
        title="Post"
        back
        actions={
          post && (
            <AdminActions
              editTo={`/compose/${post.post_id}`}
              isDeleting={del.isPending}
              onDelete={() => del.mutate(post.post_id, { onSuccess: () => navigate('/') })}
            />
          )
        }
      />
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
