import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ContactLinks } from './ContactLinks';
import { renderWithLocale } from '../test-utils';

describe('ContactLinks', () => {
  it('offers GitHub, LinkedIn and a WhatsApp click-to-message link — and no Medium', () => {
    renderWithLocale(<ContactLinks />);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', expect.stringContaining('linkedin.com/in/'));
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringMatching(/wa\.me\/5521986619954\?text=/));
    expect(screen.queryByRole('link', { name: 'Medium' })).toBeNull();
  });

  it('opens every link in a new tab, safely', () => {
    renderWithLocale(<ContactLinks />);
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });

  it('renders every icon in the theme accent — no borrowed brand colour', () => {
    const { container } = renderWithLocale(<ContactLinks />);
    const icons = [...container.querySelectorAll('svg')];
    expect(icons).toHaveLength(3);
    for (const icon of icons) expect(icon).toHaveClass('text-primary');
  });

  it('takes its heading from the caller (aside vs. contact region)', () => {
    renderWithLocale(<ContactLinks title="Contato" />);
    expect(screen.getByRole('heading', { name: 'Contato' })).toBeInTheDocument();
  });

  it('falls back to the localized default heading when the caller omits one', () => {
    renderWithLocale(<ContactLinks />, { locale: 'pt' });
    expect(screen.getByRole('heading', { name: 'Onde me encontrar' })).toBeInTheDocument();
  });

  it('renders the default heading in English when the locale is en', () => {
    renderWithLocale(<ContactLinks />, { locale: 'en' });
    expect(screen.getByRole('heading', { name: 'Where to find me' })).toBeInTheDocument();
  });
});
