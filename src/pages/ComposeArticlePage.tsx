// Admin article compose (/frontend/forms). Behind RequireAuth admin in the router; the BFF re-checks
// the admin group + enforces slug uniqueness (409). On success, navigates to the new article.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Toggle from '@cloudscape-design/components/toggle';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';
import { useCreateArticle } from '../hooks/useArticles';

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
    <ContentLayout header={<Header variant="h1">New article</Header>}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => navigate('/articles')}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit} loading={create.isPending}>
              {published ? 'Publish' : 'Save draft'}
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="l">
          {create.isError && (
            <Alert type="error" header={conflict ? 'That title/slug already exists' : "Couldn't save the article"}>
              {conflict ? 'Pick a different title.' : 'Please check your permissions and try again.'}
            </Alert>
          )}
          <FormField label="Title" errorText={titleError}>
            <Input value={title} onChange={(e) => setTitle(e.detail.value)} placeholder="Article title" />
          </FormField>
          <FormField label="Tag" description="Primary category" errorText={tagError}>
            <Input value={tag} onChange={(e) => setTag(e.detail.value)} placeholder="aws" />
          </FormField>
          <FormField label="Excerpt" description="Short summary (optional)">
            <Input value={excerpt} onChange={(e) => setExcerpt(e.detail.value)} placeholder="One-line summary" />
          </FormField>
          <FormField label="Body" description="Markdown supported (code blocks highlighted)" errorText={bodyError}>
            <Textarea value={body} onChange={(e) => setBody(e.detail.value)} rows={16} placeholder="Write your article…" />
          </FormField>
          <Toggle checked={published} onChange={(e) => setPublished(e.detail.checked)}>
            Publish now
          </Toggle>
        </SpaceBetween>
      </Form>
    </ContentLayout>
  );
}
