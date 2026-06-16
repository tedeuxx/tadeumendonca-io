import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useMe, useUpdateMe, useUploadAvatar } = vi.hoisted(() => ({ useMe: vi.fn(), useUpdateMe: vi.fn(), useUploadAvatar: vi.fn() }));
// avatarUrl is a pure helper — keep the real impl so the rendered <img> src is realistic.
vi.mock('../hooks/useMe', () => ({ useMe, useUpdateMe, useUploadAvatar, avatarUrl: (k?: string) => (k ? `/assets/${k}` : undefined) }));

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
  useUploadAvatar.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false });
  // jsdom doesn't implement object URLs — the avatar preview needs them.
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
  globalThis.URL.revokeObjectURL = vi.fn();
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

  it('uploads a picked avatar as a bare base64 string', async () => {
    const mutate = vi.fn();
    useUploadAvatar.mockReturnValue({ mutate, isPending: false, isError: false });
    useMe.mockReturnValue({ data: { cognito_sub: 'u-1', newsletter_opt_in: false, created_at: 'x' }, isLoading: false, isError: false });
    renderPage();
    const file = new File([Uint8Array.from([1, 2, 3, 4])], 'face.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Escolher foto'), { target: { files: [file] } });
    await waitFor(() => expect(mutate).toHaveBeenCalled());
    const sent = mutate.mock.calls[0][0] as string;
    expect(sent).toBe(btoa(String.fromCharCode(1, 2, 3, 4))); // bare base64, no data-URI prefix
    expect(screen.getByText('Enviar foto')).toBeInTheDocument(); // no avatar yet → "Enviar", not "Trocar"
  });

  it('shows a sending state while the avatar uploads', () => {
    useUploadAvatar.mockReturnValue({ mutate: vi.fn(), isPending: true, isError: false });
    useMe.mockReturnValue({ data: { cognito_sub: 'u-1', avatar_key: 'avatars/u-1-x.png', newsletter_opt_in: false, created_at: 'x' }, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/Enviando/)).toBeDisabled();
  });

  it('surfaces an upload failure', () => {
    useUploadAvatar.mockReturnValue({ mutate: vi.fn(), isPending: false, isError: true });
    useMe.mockReturnValue({ data: { cognito_sub: 'u-1', newsletter_opt_in: false, created_at: 'x' }, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/Falha no envio/)).toBeInTheDocument();
  });

  it('rejects a non-image file without calling upload', () => {
    const mutate = vi.fn();
    useUploadAvatar.mockReturnValue({ mutate, isPending: false, isError: false });
    useMe.mockReturnValue({ data: { cognito_sub: 'u-1', newsletter_opt_in: false, created_at: 'x' }, isLoading: false, isError: false });
    renderPage();
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Escolher foto'), { target: { files: [file] } });
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText(/Selecione um arquivo de imagem/)).toBeInTheDocument();
  });
});
