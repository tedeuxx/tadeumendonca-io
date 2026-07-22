import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactLinks } from './ContactLinks';

describe('ContactLinks', () => {
  it('offers GitHub, LinkedIn and a WhatsApp click-to-message link — and no Medium', () => {
    render(<ContactLinks />);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', expect.stringContaining('linkedin.com/in/'));
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringMatching(/wa\.me\/5521986619954\?text=/));
    expect(screen.queryByRole('link', { name: 'Medium' })).toBeNull();
  });

  it('opens every link in a new tab, safely', () => {
    render(<ContactLinks />);
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('renders every icon in the theme accent — no borrowed brand colour', () => {
    const { container } = render(<ContactLinks />);
    const icons = [...container.querySelectorAll('svg')];
    expect(icons).toHaveLength(3);
    for (const icon of icons) expect(icon).toHaveClass('text-primary');
  });

  it('takes its heading from the caller (aside vs. contact region)', () => {
    render(<ContactLinks title="Contato" />);
    expect(screen.getByRole('heading', { name: 'Contato' })).toBeInTheDocument();
  });
});
