// Comments (/frontend/design-system). Public list (oldest-first); any logged-in user can comment
// (post-moderated). Anonymous users see "Entrar para comentar" → Google sign-in, returning to the post.
// The author of a comment, and admins, see a delete control.
import { useState } from 'react';
import { Loader2, Trash2, LogIn } from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { usePostComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import type { Comment } from '../types/post';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function CommentForm({ postId }: { postId: string }) {
  const { status, name, email, signIn } = useAuth();
  const create = useCreateComment(postId);
  const [body, setBody] = useState('');

  if (status !== 'authenticated') {
    return (
      <button
        onClick={() => void signIn()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
      >
        <LogIn size={18} /> Entrar para comentar
      </button>
    );
  }

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    create.mutate({ body: text, author_name: name ?? email ?? 'Member' }, { onSuccess: () => setBody('') });
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Escreva um comentário…"
        className="w-full resize-y rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={create.isPending || !body.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {create.isPending && <Loader2 className="animate-spin" size={16} />}
          Comentar
        </button>
      </div>
    </div>
  );
}

function CommentRow({ comment, postId }: { comment: Comment; postId: string }) {
  const { sub, isAdmin } = useAuth();
  const del = useDeleteComment(postId);
  const canDelete = isAdmin || comment.author_sub === sub;
  return (
    <div className="flex gap-3 border-b border-border px-1 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
        {(comment.author_name || '?')[0]?.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-foreground">{comment.author_name}</span>
          <span className="text-muted-foreground">·</span>
          <time className="text-muted-foreground" dateTime={comment.created_at}>{fmtDate(comment.created_at)}</time>
          {canDelete && (
            <button
              onClick={() => del.mutate(comment.comment_id)}
              disabled={del.isPending}
              aria-label="Delete comment"
              className="ml-auto rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{comment.body}</p>
      </div>
    </div>
  );
}

export function CommentsSection({ postId }: { postId: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePostComments(postId);
  const comments = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="px-4 py-5">
      <h2 className="mb-3 text-lg font-bold">Comentários</h2>
      <CommentForm postId={postId} />

      <div className="mt-4">
        {isLoading && (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
          </div>
        )}
        {!isLoading && comments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Seja o primeiro a comentar.</p>}
        {comments.map((c) => (
          <CommentRow key={c.comment_id} comment={c} postId={postId} />
        ))}
        {hasNextPage && (
          <div className="flex justify-center pt-3">
            <button
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
            >
              {isFetchingNextPage && <Loader2 className="animate-spin" size={14} />}
              Ver mais
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
