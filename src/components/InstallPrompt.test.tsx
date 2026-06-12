import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useInstallPrompt } = vi.hoisted(() => ({ useInstallPrompt: vi.fn() }));
vi.mock('../hooks/useInstallPrompt', () => ({ useInstallPrompt }));

import { InstallPrompt } from './InstallPrompt';

beforeEach(() => vi.clearAllMocks());

describe('InstallPrompt', () => {
  it('renders nothing when there is no install affordance', () => {
    useInstallPrompt.mockReturnValue({ mode: null, promptInstall: vi.fn(), dismiss: vi.fn() });
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a one-tap install button (Android/desktop) and triggers the prompt', () => {
    const promptInstall = vi.fn();
    useInstallPrompt.mockReturnValue({ mode: 'button', promptInstall, dismiss: vi.fn() });
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Instalar' }));
    expect(promptInstall).toHaveBeenCalled();
  });

  it('shows the manual Share → Add to Home Screen steps on iOS', () => {
    useInstallPrompt.mockReturnValue({ mode: 'ios', promptInstall: vi.fn(), dismiss: vi.fn() });
    render(<InstallPrompt />);
    expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull();
  });

  it('can be dismissed', () => {
    const dismiss = vi.fn();
    useInstallPrompt.mockReturnValue({ mode: 'ios', promptInstall: vi.fn(), dismiss });
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }));
    expect(dismiss).toHaveBeenCalled();
  });
});
