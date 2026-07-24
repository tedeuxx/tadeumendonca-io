import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ContactLinks } from './ContactLinks';
import { CONTACT_EMAIL } from './contactChannels';
import { renderWithLocale } from '../test-utils';

describe('ContactLinks', () => {
  it('offers GitHub, LinkedIn, X, WhatsApp and e-mail — and no Medium', () => {
    renderWithLocale(<ContactLinks />);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', expect.stringContaining('linkedin.com/in/'));
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', 'https://x.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringMatching(/wa\.me\/5521986619954\?text=/));
    expect(screen.getByRole('link', { name: 'E-mail' })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    expect(screen.queryByRole('link', { name: 'Medium' })).toBeNull();
  });

  it('opens the outbound links in a new tab and keeps the mailto in the same one', () => {
    renderWithLocale(<ContactLinks />);
    for (const name of ['GitHub', 'LinkedIn', 'X', 'WhatsApp']) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
    expect(screen.getByRole('link', { name: 'E-mail' })).not.toHaveAttribute('target');
  });

  it('renders every icon in the theme accent — no borrowed brand colour', () => {
    const { container } = renderWithLocale(<ContactLinks />);
    const icons = [...container.querySelectorAll('svg')];
    expect(icons).toHaveLength(5);
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
