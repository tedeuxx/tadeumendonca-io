// Admin compose (/frontend/forms). Create a post; published posts notify subscribers (BFF). Behind
// RequireAuth admin in the router — and the BFF re-checks the admin group, so this UI gate is cosmetic.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePost } from '../hooks/usePostMutations';
import { ColumnHeader, Notice } from '../components/Column';
import { Field, TextInput, TextArea, ToggleSwitch, PrimaryButton, GhostButton } from '../components/Form';

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
    <div>
      <ColumnHeader title="New post" back />
      <div className="space-y-5 px-4 py-5">
        {create.isError && <Notice>Couldn&apos;t save the post. Please check your permissions and try again.</Notice>}

        <Field label="Title" error={titleError}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
        </Field>
        <Field label="Body" description="Markdown supported" error={bodyError}>
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Write your post…" />
        </Field>
        <Field label="Tags" description="Comma-separated">
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="serverless, aws" />
        </Field>
        <ToggleSwitch checked={published} onChange={setPublished}>
          Publish now (notifies subscribers)
        </ToggleSwitch>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={() => navigate('/')}>Cancel</GhostButton>
          <PrimaryButton onClick={submit} disabled={create.isPending}>
            {published ? 'Publish' : 'Save draft'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
