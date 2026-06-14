import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders the image when a src is given (decorative alt, so query the element)', () => {
    const { container } = render(<Avatar src="/assets/avatars/u-1-abc.png" fallback="T" className="h-9 w-9" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/assets/avatars/u-1-abc.png');
  });

  it('falls back to the initial chip when there is no src', () => {
    const { container } = render(<Avatar fallback="T" className="h-9 w-9" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
