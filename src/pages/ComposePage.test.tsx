import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { useCreatePost, useUpdatePost, usePost } = vi.hoisted(() => ({ useCreatePost: vi.fn(), useUpdatePost: vi.fn(), usePost: vi.fn() }));
vi.mock('../hooks/usePostMutations', () => ({ useCreatePost, useUpdatePost }));
vi.mock('../hooks/useFeed', () => ({ usePost }));

import { ComposePage } from './ComposePage';

// Target the native control by placeholder (Cloudscape derives detail.value from the native value).
const setByPlaceholder = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

beforeEach(() => {
  vi.clearAllMocks();
  usePost.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  useUpdatePost.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

describe('ComposePage', () => {
  it('validates required title + body before submitting', () => {
    const mutate = vi.fn();
    useCreatePost.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText('O título é obrigatório')).toBeInTheDocument();
  });

  it('submits a parsed post (tags split, published flag)', () => {
    const mutate = vi.fn();
    useCreatePost.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePage />
      </MemoryRouter>,
    );
    setByPlaceholder('Título do post', 'My Post');
    setByPlaceholder('Escreva seu post…', 'Hello body');
    setByPlaceholder('serverless, aws', 'aws, serverless');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(mutate).toHaveBeenCalled();
    expect(mutate.mock.calls[0][0]).toMatchObject({ title: 'My Post', body: 'Hello body', tags: ['aws', 'serverless'], published: false });
  });

  it('prefills from the existing post and submits via update in edit mode', () => {
    const mutate = vi.fn();
    useUpdatePost.mockReturnValue({ mutate, isPending: false, isError: false });
    usePost.mockReturnValue({
      data: { post_id: 'p1', title: 'Old Title', body: 'old body', tags: ['aws'], published: true, created_at: 'x' },
      isLoading: false,
      isError: false,
    });
    render(
      <MemoryRouter initialEntries={['/compose/p1']}>
        <Routes>
          <Route path="/compose/:postId" element={<ComposePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((screen.getByPlaceholderText('Título do post') as HTMLInputElement).value).toBe('Old Title');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(mutate).toHaveBeenCalled();
    expect(mutate.mock.calls[0][0]).toMatchObject({ title: 'Old Title', body: 'old body', tags: ['aws'], published: true });
  });

  const renderEdit = () =>
    render(
      <MemoryRouter initialEntries={['/compose/p1']}>
        <Routes>
          <Route path="/compose/:postId" element={<ComposePage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('shows a loader while the post being edited loads', () => {
    usePost.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderEdit();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows a notice when the post being edited fails to load', () => {
    usePost.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderEdit();
    expect(screen.getByText(/Não foi possível carregar este post/)).toBeInTheDocument();
  });
});
