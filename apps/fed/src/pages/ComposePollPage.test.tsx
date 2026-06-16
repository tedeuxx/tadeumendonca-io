import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { useAdminPoll, useCreatePoll, useUpdatePoll } = vi.hoisted(() => ({
  useAdminPoll: vi.fn(),
  useCreatePoll: vi.fn(),
  useUpdatePoll: vi.fn(),
}));
vi.mock('../hooks/usePoll', () => ({ useAdminPoll, useCreatePoll, useUpdatePoll }));

import { ComposePollPage } from './ComposePollPage';

const fill = (placeholder: string, value: string) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

beforeEach(() => {
  vi.clearAllMocks();
  useAdminPoll.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  useUpdatePoll.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

describe('ComposePollPage', () => {
  it('requires a question and at least two filled options', () => {
    const mutate = vi.fn();
    useCreatePoll.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePollPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText('A pergunta é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Informe ao menos duas opções')).toBeInTheDocument();
  });

  it('submits a poll with its question + non-empty options', () => {
    const mutate = vi.fn();
    useCreatePoll.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePollPage />
      </MemoryRouter>,
    );
    fill('Qual a pergunta da enquete?', 'A ou B?');
    fill('Opção 1', 'A');
    fill('Opção 2', 'B');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ question: 'A ou B?', options: [{ label: 'A' }, { label: 'B' }], published: false });
  });

  it('adds and removes option rows (min two)', () => {
    useCreatePoll.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePollPage />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('textbox')).toHaveLength(3); // question + 2 options
    fireEvent.click(screen.getByRole('button', { name: /Adicionar opção/ }));
    expect(screen.getAllByRole('textbox')).toHaveLength(4); // + 1 option
    fireEvent.click(screen.getByRole('button', { name: 'Remover opção 3' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(3);
    // back at the minimum → the remaining remove buttons are disabled
    expect(screen.getByRole('button', { name: 'Remover opção 1' })).toBeDisabled();
  });

  it('prefills from the existing poll and submits via update (options keep their ids)', () => {
    const mutate = vi.fn();
    useUpdatePoll.mockReturnValue({ mutate, isPending: false, isError: false });
    useAdminPoll.mockReturnValue({
      data: { poll_id: 'pl1', question: 'Old?', options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }], published: true, created_at: 'x' },
      isLoading: false,
      isError: false,
    });
    render(
      <MemoryRouter initialEntries={['/compose-poll/pl1']}>
        <Routes>
          <Route path="/compose-poll/:pollId" element={<ComposePollPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((screen.getByPlaceholderText('Qual a pergunta da enquete?') as HTMLInputElement).value).toBe('Old?');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ question: 'Old?', options: [{ id: 'o1', label: 'A' }, { id: 'o2', label: 'B' }], published: true });
  });

  const renderEdit = () =>
    render(
      <MemoryRouter initialEntries={['/compose-poll/pl1']}>
        <Routes>
          <Route path="/compose-poll/:pollId" element={<ComposePollPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it('shows a loader while the poll being edited loads', () => {
    useAdminPoll.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderEdit();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows a notice when the poll being edited fails to load', () => {
    useAdminPoll.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderEdit();
    expect(screen.getByText(/Não foi possível carregar esta enquete/)).toBeInTheDocument();
  });
});
