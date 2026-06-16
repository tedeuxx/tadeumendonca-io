import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const toggle = vi.fn();
vi.mock('../hooks/useReactions', () => ({
  REACTION_EMOJIS: ['🔥', '❤️'],
  useReactions: () => ({ counts: { '🔥': 3 }, mine: '🔥', toggle, pending: false }),
}));

import { ReactionBar } from './ReactionBar';

describe('ReactionBar', () => {
  it('renders counts and highlights the viewer reaction (default md size)', () => {
    render(<ReactionBar postId="p1" />);
    expect(screen.getByText('3')).toBeInTheDocument(); // count > 0 branch
    expect(screen.getByRole('button', { name: 'React 🔥' })).toHaveAttribute('aria-pressed', 'true'); // active branch
    expect(screen.getByRole('button', { name: 'React ❤️' })).toHaveAttribute('aria-pressed', 'false'); // inactive + count 0 branch
  });

  it('supports the small size variant', () => {
    render(<ReactionBar postId="p1" size="sm" />); // sm branch
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
