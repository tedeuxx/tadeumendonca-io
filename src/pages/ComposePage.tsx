// Admin compose (/frontend/forms). Create a post; published posts notify subscribers (BFF). Behind
// RequireAuth admin in the router — and the BFF re-checks the admin group, so this UI gate is cosmetic.
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
import { useCreatePost } from '../hooks/usePostMutations';

export function ComposePage() {
  const navigate = useNavigate();
  const create = useCreatePost();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(false);
  const [touched, setTouched] = useState(false);

  const titleError = touched && !title.trim() ? 'Title is required' : undefined;
  const bodyError = touched && !body.trim() ? 'Body is required' : undefined;

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
    <ContentLayout header={<Header variant="h1">New post</Header>}>
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => navigate('/feed')}>
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
            <Alert type="error" header="Couldn't save the post">
              Please check your permissions and try again.
            </Alert>
          )}
          <FormField label="Title" errorText={titleError}>
            <Input value={title} onChange={(e) => setTitle(e.detail.value)} placeholder="Post title" />
          </FormField>
          <FormField label="Body" description="Markdown supported" errorText={bodyError}>
            <Textarea value={body} onChange={(e) => setBody(e.detail.value)} rows={12} placeholder="Write your post…" />
          </FormField>
          <FormField label="Tags" description="Comma-separated">
            <Input value={tags} onChange={(e) => setTags(e.detail.value)} placeholder="serverless, aws" />
          </FormField>
          <Toggle checked={published} onChange={(e) => setPublished(e.detail.checked)}>
            Publish now (notifies subscribers)
          </Toggle>
        </SpaceBetween>
      </Form>
    </ContentLayout>
  );
}
