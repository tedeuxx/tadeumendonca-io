import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('../auth/authStore', () => ({ useAuth }));

import { NewPostButton } from './NewPostButton';

const renderBtn = () =>
  render(
    <MemoryRouter>
      <NewPostButton />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('NewPostButton', () => {
  it('renders a link to the compose page for admins', () => {
    useAuth.mockReturnValue({ isAdmin: true });
    renderBtn();
    expect(screen.getByRole('link', { name: /Novo post/ })).toHaveAttribute('href', '/compose');
  });

  it('renders nothing for non-admins', () => {
    useAuth.mockReturnValue({ isAdmin: false });
    const { container } = renderBtn();
    expect(container).toBeEmptyDOMElement();
  });
});
