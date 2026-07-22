import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BlogPost } from '../lib/content';

const { getAllPosts } = vi.hoisted(() => ({ getAllPosts: vi.fn() }));
vi.mock('../lib/content', () => ({ getAllPosts }));

import { ArticlesSection } from './ArticlesSection';

const post: BlogPost = {
  slug: 'building',
  title: 'Building',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  excerpt: 'x',
  body: '# hi',
};

const renderSection = () =>
  render(
    <MemoryRouter>
      <ArticlesSection />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('ArticlesSection', () => {
  it('shows the empty state', () => {
    getAllPosts.mockReturnValue([]);
    renderSection();
    expect(screen.getByText('Ainda não há artigos.')).toBeInTheDocument();
  });

  it('lists posts with their title link', () => {
    getAllPosts.mockReturnValue([post]);
    renderSection();
    expect(screen.getByRole('link', { name: 'Building' })).toHaveAttribute('href', '/blog/building');
  });

  it('starts unfiltered', () => {
    getAllPosts.mockReturnValue([post]);
    renderSection();
    expect(getAllPosts).toHaveBeenCalledWith(undefined);
    expect(screen.queryByRole('button', { name: 'Limpar filtro' })).toBeNull();
  });

  it('filters by clicking a tag, keeping the filter in local state (no URL param)', () => {
    getAllPosts.mockReturnValue([post]);
    renderSection();
    fireEvent.click(screen.getByText('#aws'));
    expect(getAllPosts).toHaveBeenLastCalledWith('aws');
    expect(screen.getByRole('button', { name: 'Limpar filtro' })).toBeInTheDocument();
  });

  it('clears the filter', () => {
    getAllPosts.mockReturnValue([post]);
    renderSection();
    fireEvent.click(screen.getByText('#aws'));
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtro' }));
    expect(getAllPosts).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByRole('button', { name: 'Limpar filtro' })).toBeNull();
  });
});
