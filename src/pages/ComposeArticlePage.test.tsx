import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useCreateArticle } = vi.hoisted(() => ({ useCreateArticle: vi.fn() }));
vi.mock('../hooks/useArticles', () => ({ useCreateArticle }));

import { ComposeArticlePage } from './ComposeArticlePage';

const fill = (placeholder: string, value: string) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

beforeEach(() => vi.clearAllMocks());

describe('ComposeArticlePage', () => {
  it('requires title, tag and body', () => {
    const mutate = vi.fn();
    useCreateArticle.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('A tag is required')).toBeInTheDocument();
  });

  it('submits the article', () => {
    const mutate = vi.fn();
    useCreateArticle.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    fill('Article title', 'My Article');
    fill('aws', 'cloud');
    fill('Write your article…', 'Long form body');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ title: 'My Article', tag: 'cloud', body: 'Long form body', published: false });
  });

  it('navigates to the new article on success', () => {
    const mutate = vi.fn((_input, opts) => opts.onSuccess({ slug: 'my-article' }));
    useCreateArticle.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    fill('Article title', 'My Article');
    fill('aws', 'cloud');
    fill('Write your article…', 'body');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(mutate).toHaveBeenCalled();
  });

  it('surfaces a slug-conflict error', () => {
    useCreateArticle.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: true, error: { error: { code: 'conflict' } } });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('That title/slug already exists')).toBeInTheDocument();
  });
});
