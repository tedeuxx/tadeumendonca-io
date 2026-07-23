import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { BlogPost } from '../lib/content';
import { renderWithLocale } from '../test-utils';

const { getPostBySlug } = vi.hoisted(() => ({ getPostBySlug: vi.fn() }));
vi.mock('../lib/content', () => ({ getPostBySlug }));

import { ArticlePage } from './ArticlePage';

const renderAt = (slug: string) =>
  renderWithLocale(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

const post = (over: Partial<BlogPost> = {}): BlogPost => ({
  slug: 'building',
  title: 'Building Serverless',
  date: '2026-06-01T00:00:00Z',
  tag: 'aws',
  track: 'engenharia',
  body: '## Why\n\ncode',
  ...over,
});

describe('ArticlePage', () => {
  it('renders the post with its markdown body', () => {
    getPostBySlug.mockReturnValue(post());
    renderAt('building');
    expect(screen.getByText('Building Serverless')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why' })).toBeInTheDocument(); // markdown rendered
  });

  it('links back to the articles section and, when present, to the LinkedIn edition', () => {
    getPostBySlug.mockReturnValue(post({ linkedinUrl: 'https://linkedin.com/pulse/x' }));
    renderAt('building');
    expect(screen.getByRole('link', { name: /Todos os artigos/ })).toHaveAttribute('href', '/#artigos');
    expect(screen.getByRole('link', { name: 'Ver no LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/pulse/x');
  });

  it('omits the LinkedIn link when the post has no edition there', () => {
    getPostBySlug.mockReturnValue(post());
    renderAt('building');
    expect(screen.queryByRole('link', { name: 'Ver no LinkedIn' })).toBeNull();
  });

  it('shows not-found for an unknown slug', () => {
    getPostBySlug.mockReturnValue(undefined);
    renderAt('nope');
    expect(screen.getByText(/não existe ou não está publicado/)).toBeInTheDocument();
  });
});
