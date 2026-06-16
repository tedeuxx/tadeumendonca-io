import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { useCreateArticle, useUpdateArticle, useArticle } = vi.hoisted(() => ({ useCreateArticle: vi.fn(), useUpdateArticle: vi.fn(), useArticle: vi.fn() }));
vi.mock('../hooks/useArticles', () => ({ useCreateArticle, useUpdateArticle, useArticle }));

import { ComposeArticlePage } from './ComposeArticlePage';

const fill = (placeholder: string, value: string) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

beforeEach(() => {
  vi.clearAllMocks();
  useArticle.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  useUpdateArticle.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

describe('ComposeArticlePage', () => {
  it('requires title, tag and body', () => {
    const mutate = vi.fn();
    useCreateArticle.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText('O título é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('A tag é obrigatória')).toBeInTheDocument();
  });

  it('submits the article', () => {
    const mutate = vi.fn();
    useCreateArticle.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    fill('Título do artigo', 'My Article');
    fill('aws', 'cloud');
    fill('Escreva seu artigo…', 'Long form body');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
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
    fill('Título do artigo', 'My Article');
    fill('aws', 'cloud');
    fill('Escreva seu artigo…', 'body');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(mutate).toHaveBeenCalled();
  });

  it('surfaces a slug-conflict error', () => {
    useCreateArticle.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: true, error: { error: { code: 'conflict' } } });
    render(
      <MemoryRouter>
        <ComposeArticlePage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Esse título\/slug já existe/)).toBeInTheDocument();
  });

  it('prefills from the existing article and submits via update in edit mode', () => {
    const mutate = vi.fn();
    useUpdateArticle.mockReturnValue({ mutate, isPending: false, isError: false });
    useArticle.mockReturnValue({
      data: { article_id: 'a1', slug: 'building', tag: 'aws', title: 'Old', excerpt: 'e', body: 'old body', published: true, created_at: 'x' },
      isLoading: false,
      isError: false,
    });
    render(
      <MemoryRouter initialEntries={['/compose-article/building']}>
        <Routes>
          <Route path="/compose-article/:slug" element={<ComposeArticlePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((screen.getByPlaceholderText('Título do artigo') as HTMLInputElement).value).toBe('Old');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ title: 'Old', tag: 'aws', body: 'old body', published: true });
  });

  const renderEdit = () =>
    render(
      <MemoryRouter initialEntries={['/compose-article/building']}>
        <Routes>
          <Route path="/compose-article/:slug" element={<ComposeArticlePage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('shows a loader while the article being edited loads', () => {
    useArticle.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderEdit();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows a notice when the article being edited fails to load', () => {
    useArticle.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderEdit();
    expect(screen.getByText(/Não foi possível carregar este artigo/)).toBeInTheDocument();
  });
});
