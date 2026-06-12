import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useInstallPrompt } = vi.hoisted(() => ({ useInstallPrompt: vi.fn() }));
vi.mock('../hooks/useInstallPrompt', () => ({ useInstallPrompt }));

import { InstallPrompt } from './InstallPrompt';

const mock = (v: Record<string, unknown>) => useInstallPrompt.mockReturnValue({ promptInstall: vi.fn(), dismiss: vi.fn(), platform: null, ...v });

beforeEach(() => vi.clearAllMocks());

describe('InstallPrompt', () => {
  it('renders nothing when there is no install affordance', () => {
    mock({ mode: null });
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a one-tap install button (Chromium) and triggers the prompt', () => {
    const promptInstall = vi.fn();
    mock({ mode: 'button', promptInstall });
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Instalar' }));
    expect(promptInstall).toHaveBeenCalled();
  });

  it('iOS manual steps mention Safari + Add to Home Screen', () => {
    mock({ mode: 'manual', platform: 'ios' });
    render(<InstallPrompt />);
    expect(screen.getByText(/Safari/)).toBeInTheDocument();
    expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull();
  });

  it('macOS Safari manual steps mention Add to Dock', () => {
    mock({ mode: 'manual', platform: 'macos-safari' });
    render(<InstallPrompt />);
    expect(screen.getByText(/Adicionar ao Dock/)).toBeInTheDocument();
  });

  it('Firefox manual steps mention the Firefox menu + Install', () => {
    mock({ mode: 'manual', platform: 'firefox' });
    render(<InstallPrompt />);
    expect(screen.getByText(/Firefox/)).toBeInTheDocument();
    expect(screen.getByText(/Instalar/)).toBeInTheDocument();
  });

  it('can be dismissed', () => {
    const dismiss = vi.fn();
    mock({ mode: 'manual', platform: 'ios', dismiss });
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }));
    expect(dismiss).toHaveBeenCalled();
  });
});
