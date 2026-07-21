import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BlogPost } from '../lib/content';

const { getAllPosts } = vi.hoisted(() => ({ getAllPosts: vi.fn() }));
vi.mock('../lib/content', () => ({ getAllPosts }));

import { ArticlesPage } from './ArticlesPage';

const post: BlogPost = {
  slug: 'building',
  title: 'Building',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  excerpt: 'x',
  body: '# hi',
};

const renderAt = (path = '/blog') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ArticlesPage />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('ArticlesPage', () => {
  it('shows the empty state', () => {
    getAllPosts.mockReturnValue([]);
    renderAt();
    expect(screen.getByText('Ainda não há artigos.')).toBeInTheDocument();
  });

  it('lists posts with their title link', () => {
    getAllPosts.mockReturnValue([post]);
    renderAt();
    expect(screen.getByRole('link', { name: 'Building' })).toHaveAttribute('href', '/blog/building');
  });

  it('passes the tag from the URL to the loader + shows a clear filter', () => {
    getAllPosts.mockReturnValue([]);
    renderAt('/blog?tag=aws');
    expect(getAllPosts).toHaveBeenCalledWith('aws');
    expect(screen.getByRole('button', { name: 'Limpar filtro' })).toBeInTheDocument();
  });

  it('filters by clicking a tag badge', () => {
    getAllPosts.mockReturnValue([post]);
    renderAt();
    fireEvent.click(screen.getByText('#aws')); // tag → setParams
    expect(screen.getByRole('button', { name: 'Limpar filtro' })).toBeInTheDocument();
  });

  it('clears the tag filter', () => {
    getAllPosts.mockReturnValue([]);
    renderAt('/blog?tag=aws');
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtro' }));
    expect(screen.queryByRole('button', { name: 'Limpar filtro' })).toBeNull();
  });
});
