// Admin article compose (/frontend/forms). Behind RequireAuth admin in the router; the BFF re-checks
// the admin group + enforces slug uniqueness (409). On success, navigates to the new article.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateArticle } from '../hooks/useArticles';
import { ColumnHeader, Notice } from '../components/Column';
import { Field, TextInput, TextArea, ToggleSwitch, PrimaryButton, GhostButton } from '../components/Form';

export function ComposeArticlePage() {
  const navigate = useNavigate();
  const create = useCreateArticle();
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(false);
  const [touched, setTouched] = useState(false);

  const titleError = touched && !title.trim() ? 'O título é obrigatório' : undefined;
  const tagError = touched && !tag.trim() ? 'A tag é obrigatória' : undefined;
  const bodyError = touched && !body.trim() ? 'O conteúdo é obrigatório' : undefined;
  const conflict = create.isError && (create.error as { error?: { code?: string } })?.error?.code === 'conflict';

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !tag.trim() || !body.trim()) return;
    create.mutate(
      { title: title.trim(), tag: tag.trim(), excerpt: excerpt.trim() || undefined, body: body.trim(), published },
      { onSuccess: (article) => navigate(`/blog/${article.slug}`) },
    );
  };

  return (
    <div>
      <ColumnHeader title="Novo artigo" back />
      <div className="space-y-5 px-4 py-5">
        {create.isError &&
          (conflict ? (
            <Notice>Esse título/slug já existe. Escolha outro título.</Notice>
          ) : (
            <Notice>Não foi possível salvar o artigo. Verifique suas permissões e tente novamente.</Notice>
          ))}

        <Field label="Título" error={titleError}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do artigo" />
        </Field>
        <Field label="Tag" description="Categoria principal" error={tagError}>
          <TextInput value={tag} onChange={(e) => setTag(e.target.value)} placeholder="aws" />
        </Field>
        <Field label="Resumo" description="Resumo curto (opcional)">
          <TextInput value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Resumo em uma linha" />
        </Field>
        <Field label="Conteúdo" description="Markdown suportado (blocos de código destacados)" error={bodyError}>
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={16} placeholder="Escreva seu artigo…" />
        </Field>
        <ToggleSwitch checked={published} onChange={setPublished}>
          Publicar agora
        </ToggleSwitch>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={() => navigate('/blog')}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={create.isPending}>
            {published ? 'Publicar' : 'Salvar rascunho'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
