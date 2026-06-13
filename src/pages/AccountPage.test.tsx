import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useMe, useUpdateMe } = vi.hoisted(() => ({ useMe: vi.fn(), useUpdateMe: vi.fn() }));
vi.mock('../hooks/useMe', () => ({ useMe, useUpdateMe }));

import { AccountPage } from './AccountPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <AccountPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  useUpdateMe.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
});

describe('AccountPage', () => {
  it('shows a loader while the profile loads', () => {
    useMe.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows a notice when the profile fails to load', () => {
    useMe.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/Não foi possível carregar sua conta/)).toBeInTheDocument();
  });

  it('prefills the nickname and reveals the cadence only when opted in', () => {
    useMe.mockReturnValue({ data: { cognito_sub: 'u-1', nickname: 'Tadeu', newsletter_opt_in: false, created_at: 'x' }, isLoading: false, isError: false });
    renderPage();
    expect((screen.getByPlaceholderText('Seu apelido') as HTMLInputElement).value).toBe('Tadeu');
    expect(screen.queryByLabelText('Frequência')).not.toBeInTheDocument(); // opted out → no cadence
    fireEvent.click(screen.getByRole('switch')); // opt in
    expect(screen.getByLabelText('Frequência')).toBeInTheDocument();
  });

  it('submits nickname + prefs via PUT and confirms the save', () => {
    const mutate = vi.fn((_input, opts) => opts.onSuccess());
    useUpdateMe.mockReturnValue({ mutate, isPending: false, isError: false });
    useMe.mockReturnValue({ data: { cognito_sub: 'u-1', nickname: 'Tadeu', newsletter_opt_in: true, newsletter_schedule: 'weekly', created_at: 'x' }, isLoading: false, isError: false });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('Seu apelido'), { target: { value: 'Tadeuzão' } });
    fireEvent.change(screen.getByLabelText('Frequência'), { target: { value: 'daily' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ nickname: 'Tadeuzão', newsletter_opt_in: true, newsletter_schedule: 'daily' });
    expect(screen.getByText('Preferências salvas.')).toBeInTheDocument();
  });
});
