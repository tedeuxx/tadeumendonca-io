import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { useAuth } = vi.hoisted(() => ({ useAuth: vi.fn() }));
const { useSubscribe } = vi.hoisted(() => ({ useSubscribe: vi.fn() }));
vi.mock('../auth/authStore', () => ({ useAuth }));
vi.mock('../hooks/usePostMutations', () => ({ useSubscribe }));

import { SubscribeButton } from './SubscribeButton';

beforeEach(() => vi.clearAllMocks());

describe('SubscribeButton', () => {
  it('renders nothing for anonymous users', () => {
    useAuth.mockReturnValue({ status: 'anonymous', signIn: vi.fn() });
    useSubscribe.mockReturnValue({ mutate: vi.fn(), isPending: false, isSuccess: false });
    const { container } = render(<SubscribeButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('subscribes the signed-in user email', () => {
    const mutate = vi.fn();
    useAuth.mockReturnValue({ status: 'authenticated', email: 'a@b.io', signIn: vi.fn() });
    useSubscribe.mockReturnValue({ mutate, isPending: false, isSuccess: false });
    render(<SubscribeButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Inscrever-se' }));
    expect(mutate).toHaveBeenCalledWith('a@b.io');
  });

  it('shows a success indicator after subscribing', () => {
    useAuth.mockReturnValue({ status: 'authenticated', email: 'a@b.io', signIn: vi.fn() });
    useSubscribe.mockReturnValue({ mutate: vi.fn(), isPending: false, isSuccess: true });
    render(<SubscribeButton />);
    expect(screen.getByText(/Inscrito/)).toBeInTheDocument();
  });
});
