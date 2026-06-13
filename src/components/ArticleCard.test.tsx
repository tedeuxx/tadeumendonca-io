import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ArticleCard } from './ArticleCard';
import type { ArticleFeedItem } from '../types/post';

const article: ArticleFeedItem = {
  kind: 'article',
  article_id: 'a1',
  slug: 'building',
  tag: 'aws',
  title: 'Building on AWS',
  excerpt: 'why and how',
  created_at: '2026-06-02T00:00:00Z',
};

const renderCard = (a: ArticleFeedItem = article) =>
  render(
    <MemoryRouter>
      <ArticleCard article={a} />
    </MemoryRouter>,
  );

describe('ArticleCard', () => {
  it('links the title to the article blog page', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'Building on AWS' })).toHaveAttribute('href', '/blog/building');
  });

  it('links the tag into the Blog tag filter', () => {
    renderCard();
    expect(screen.getByRole('link', { name: '#aws' })).toHaveAttribute('href', '/blog?tag=aws');
  });

  it('shows the Blog badge and the excerpt', () => {
    renderCard();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('why and how')).toBeInTheDocument();
  });

  it('omits the excerpt when absent', () => {
    renderCard({ ...article, excerpt: undefined });
    expect(screen.queryByText('why and how')).toBeNull();
  });

  it('renders link-preview cards when present', () => {
    renderCard({ ...article, link_previews: [{ url: 'https://youtu.be/abc', provider: 'YouTube', title: 'A Video' }] });
    expect(screen.getByText('A Video')).toBeInTheDocument();
  });
});
