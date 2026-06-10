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

  const titleError = touched && !title.trim() ? 'Title is required' : undefined;
  const tagError = touched && !tag.trim() ? 'A tag is required' : undefined;
  const bodyError = touched && !body.trim() ? 'Body is required' : undefined;
  const conflict = create.isError && (create.error as { error?: { code?: string } })?.error?.code === 'conflict';

  const submit = () => {
    setTouched(true);
    if (!title.trim() || !tag.trim() || !body.trim()) return;
    create.mutate(
      { title: title.trim(), tag: tag.trim(), excerpt: excerpt.trim() || undefined, body: body.trim(), published },
      { onSuccess: (article) => navigate(`/articles/${article.slug}`) },
    );
  };

  return (
    <div>
      <ColumnHeader title="New article" back />
      <div className="space-y-5 px-4 py-5">
        {create.isError &&
          (conflict ? (
            <Notice>That title/slug already exists. Pick a different title.</Notice>
          ) : (
            <Notice>Couldn&apos;t save the article. Please check your permissions and try again.</Notice>
          ))}

        <Field label="Title" error={titleError}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
        </Field>
        <Field label="Tag" description="Primary category" error={tagError}>
          <TextInput value={tag} onChange={(e) => setTag(e.target.value)} placeholder="aws" />
        </Field>
        <Field label="Excerpt" description="Short summary (optional)">
          <TextInput value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="One-line summary" />
        </Field>
        <Field label="Body" description="Markdown supported (code blocks highlighted)" error={bodyError}>
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={16} placeholder="Write your article…" />
        </Field>
        <ToggleSwitch checked={published} onChange={setPublished}>
          Publish now
        </ToggleSwitch>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={() => navigate('/articles')}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={create.isPending}>
            {published ? 'Publish' : 'Save draft'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
