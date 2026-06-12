// Admin compose (/frontend/forms). Creates a post, or edits one when the route carries a :postId.
// Published posts notify subscribers (BFF, on create and on draft→published). Behind RequireAuth admin
// in the router — and the BFF re-checks the admin group, so this UI gate is cosmetic.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCreatePost, useUpdatePost } from '../hooks/usePostMutations';
import { usePost } from '../hooks/useFeed';
import { useUnfurl } from '../hooks/useUnfurl';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';
import { LinkPreviewCard } from '../components/LinkPreviewCard';
import { Field, TextInput, TextArea, ToggleSwitch, PrimaryButton, GhostButton } from '../components/Form';

export function ComposePage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const isEdit = Boolean(postId);

  const existing = usePost(postId ?? '', isEdit);
  const create = useCreatePost();
  const update = useUpdatePost(postId ?? '');
  const save = isEdit ? update : create;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(false);
  const [touched, setTouched] = useState(false);
  const { previews, loading: unfurling } = useUnfurl(body);

  // Prefill once from the loaded post (a background refetch must not clobber in-progress edits).
  const prefilled = useRef(false);
  useEffect(() => {
    if (existing.data && !prefilled.current) {
      prefilled.current = true;
      setTitle(existing.data.title);
      setBody(existing.data.body);
      setTags((existing.data.tags ?? []).join(', '));
      setPublished(existing.data.published);
    }
  }, [existing.data]);

  const titleError = touched && !title.trim() ? 'O título é obrigatório' : undefined;
  const bodyError = touched && !body.trim() ? 'O conteúdo é obrigatório' : undefined;

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !body.trim()) return;
    save.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        published,
      },
      { onSuccess: (post) => navigate(`/posts/${post.post_id}`) },
    );
  };

  if (isEdit && existing.isLoading) return <CenterLoader />;
  if (isEdit && existing.isError) {
    return (
      <div>
        <ColumnHeader title="Editar post" back />
        <Notice>Não foi possível carregar este post. Talvez não exista ou não esteja publicado.</Notice>
      </div>
    );
  }

  return (
    <div>
      <ColumnHeader title={isEdit ? 'Editar post' : 'Novo post'} back />
      <div className="space-y-5 px-4 py-5">
        {save.isError && <Notice>Não foi possível salvar o post. Verifique suas permissões e tente novamente.</Notice>}

        <Field label="Título" error={titleError}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do post" />
        </Field>
        <Field label="Conteúdo" description="Markdown suportado" error={bodyError}>
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Escreva seu post…" />
        </Field>

        {(previews.length > 0 || unfurling) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Pré-visualização de links {unfurling && <Loader2 className="animate-spin" size={14} />}
            </div>
            {previews.map((p) => (
              <LinkPreviewCard key={p.url} preview={p} />
            ))}
          </div>
        )}

        <Field label="Tags" description="Separadas por vírgula">
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="serverless, aws" />
        </Field>
        <ToggleSwitch checked={published} onChange={setPublished}>
          Publicar agora (notifica inscritos)
        </ToggleSwitch>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={() => navigate(isEdit ? `/posts/${postId}` : '/')}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={save.isPending}>
            {isEdit ? 'Salvar alterações' : published ? 'Publicar' : 'Salvar rascunho'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
