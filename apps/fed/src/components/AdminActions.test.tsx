import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminActions } from './AdminActions';
import { useAuth } from '../auth/authStore';

const renderActions = (onDelete = vi.fn()) =>
  render(
    <MemoryRouter>
      <AdminActions editTo="/compose/p1" onDelete={onDelete} />
    </MemoryRouter>,
  );

afterEach(() => useAuth.setState({ isAdmin: false }));
beforeEach(() => vi.clearAllMocks());

describe('AdminActions', () => {
  it('renders nothing for non-admins', () => {
    useAuth.setState({ isAdmin: false });
    const { container } = renderActions();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows edit + delete for admins; edit links to the compose route', () => {
    useAuth.setState({ isAdmin: true });
    renderActions();
    expect(screen.getByRole('link', { name: /Editar/ })).toHaveAttribute('href', '/compose/p1');
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeInTheDocument();
  });

  it('requires a two-step confirm before calling onDelete', () => {
    useAuth.setState({ isAdmin: true });
    const onDelete = vi.fn();
    renderActions(onDelete);

    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }));
    expect(onDelete).not.toHaveBeenCalled(); // first click only reveals the confirm
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/ }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('lets the admin back out of the confirm', () => {
    useAuth.setState({ isAdmin: true });
    const onDelete = vi.fn();
    renderActions(onDelete);
    fireEvent.click(screen.getByRole('button', { name: /Excluir/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: /Confirmar/ })).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
