// Admin compose (/frontend/forms). Create a post; published posts notify subscribers (BFF). Behind
// RequireAuth admin in the router — and the BFF re-checks the admin group, so this UI gate is cosmetic.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCreatePost } from '../hooks/usePostMutations';
import { useUnfurl } from '../hooks/useUnfurl';
import { ColumnHeader, Notice } from '../components/Column';
import { LinkPreviewCard } from '../components/LinkPreviewCard';
import { Field, TextInput, TextArea, ToggleSwitch, PrimaryButton, GhostButton } from '../components/Form';

export function ComposePage() {
  const navigate = useNavigate();
  const create = useCreatePost();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(false);
  const [touched, setTouched] = useState(false);
  const { previews, loading: unfurling } = useUnfurl(body);

  const titleError = touched && !title.trim() ? 'O título é obrigatório' : undefined;
  const bodyError = touched && !body.trim() ? 'O conteúdo é obrigatório' : undefined;

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !body.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        published,
      },
      { onSuccess: (post) => navigate(`/posts/${post.post_id}`) },
    );
  };

  return (
    <div>
      <ColumnHeader title="Novo post" back />
      <div className="space-y-5 px-4 py-5">
        {create.isError && <Notice>Não foi possível salvar o post. Verifique suas permissões e tente novamente.</Notice>}

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
          <GhostButton onClick={() => navigate('/')}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={create.isPending}>
            {published ? 'Publicar' : 'Salvar rascunho'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
