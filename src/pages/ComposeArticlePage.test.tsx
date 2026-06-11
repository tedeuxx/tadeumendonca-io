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
});
