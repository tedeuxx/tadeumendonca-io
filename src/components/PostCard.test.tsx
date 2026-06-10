import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostCard } from './PostCard';
import type { Post } from '../types/post';

const post: Post = {
  post_id: 'p1',
  title: 'Hello world',
  body: 'Some **markdown** body.',
  tags: ['aws', 'serverless'],
  published: true,
  created_at: '2026-06-01T00:00:00.000Z',
};

const renderCard = (p: Post, linkTitle = true) =>
  render(
    <MemoryRouter>
      <PostCard post={p} linkTitle={linkTitle} />
    </MemoryRouter>,
  );

describe('PostCard', () => {
  it('renders the title as a link to the post, tags, and the markdown body', () => {
    renderCard(post);
    const link = screen.getByRole('link', { name: 'Hello world' });
    expect(link).toHaveAttribute('href', '/posts/p1');
    expect(screen.getByText('#aws')).toBeInTheDocument();
    expect(screen.getByText('#serverless')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument(); // bold rendered from markdown
  });

  it('renders the title as plain text when linkTitle is false', () => {
    renderCard(post, false);
    expect(screen.queryByRole('link', { name: 'Hello world' })).toBeNull();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
