// Admin article compose (/frontend/forms). Creates an article, or edits one when the route carries a
// :slug. Behind RequireAuth admin in the router; the BFF re-checks the admin group + enforces slug
// uniqueness (409). Retitling regenerates the slug server-side, so a successful save navigates to the
// slug the BFF returns.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateArticle, useUpdateArticle, useArticle } from '../hooks/useArticles';
import { ColumnHeader, CenterLoader, Notice } from '../components/Column';
import { Field, TextInput, TextArea, ToggleSwitch, PrimaryButton, GhostButton } from '../components/Form';

export function ComposeArticlePage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = Boolean(slug);

  const existing = useArticle(slug ?? '', isEdit);
  const create = useCreateArticle();
  const update = useUpdateArticle(slug ?? '');
  const save = isEdit ? update : create;

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(false);
  const [touched, setTouched] = useState(false);

  const prefilled = useRef(false);
  useEffect(() => {
    if (existing.data && !prefilled.current) {
      prefilled.current = true;
      setTitle(existing.data.title);
      setTag(existing.data.tag);
      setExcerpt(existing.data.excerpt ?? '');
      setBody(existing.data.body);
      setPublished(existing.data.published);
    }
  }, [existing.data]);

  const titleError = touched && !title.trim() ? 'O título é obrigatório' : undefined;
  const tagError = touched && !tag.trim() ? 'A tag é obrigatória' : undefined;
  const bodyError = touched && !body.trim() ? 'O conteúdo é obrigatório' : undefined;
  const conflict = save.isError && (save.error as { error?: { code?: string } })?.error?.code === 'conflict';

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !tag.trim() || !body.trim()) return;
    save.mutate(
      { title: title.trim(), tag: tag.trim(), excerpt: excerpt.trim() || undefined, body: body.trim(), published },
      { onSuccess: (article) => navigate(`/blog/${article.slug}`) },
    );
  };

  if (isEdit && existing.isLoading) return <CenterLoader />;
  if (isEdit && existing.isError) {
    return (
      <div>
        <ColumnHeader title="Editar artigo" back />
        <Notice>Não foi possível carregar este artigo. Talvez não exista ou não esteja publicado.</Notice>
      </div>
    );
  }

  return (
    <div>
      <ColumnHeader title={isEdit ? 'Editar artigo' : 'Novo artigo'} back />
      <div className="space-y-5 px-4 py-5">
        {save.isError &&
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
          <GhostButton onClick={() => navigate(isEdit ? `/blog/${slug}` : '/blog')}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={save.isPending}>
            {isEdit ? 'Salvar alterações' : published ? 'Publicar' : 'Salvar rascunho'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
