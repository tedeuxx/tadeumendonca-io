import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ContactFooter, CONTACT_EMAIL } from './ContactFooter';
import { renderWithLocale } from '../test-utils';

describe('ContactFooter', () => {
  it('asks a reader-first question rather than pitching for work', () => {
    renderWithLocale(<ContactFooter />);
    expect(screen.getByRole('heading', { name: /Algo aqui te ajudou/ })).toBeInTheDocument();
  });

  it('offers the direct channels, with e-mail on the site’s own domain', () => {
    renderWithLocale(<ContactFooter />);
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringMatching(/wa\.me\/5521986619954/));
    expect(screen.getByRole('link', { name: 'E-mail' })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    expect(CONTACT_EMAIL).toMatch(/@tadeumendonca\.io$/);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
  });

  it('keeps the mailto in the same tab and the outbound links in a new one', () => {
    renderWithLocale(<ContactFooter />);
    expect(screen.getByRole('link', { name: 'E-mail' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders every icon in the theme accent — no borrowed brand colour', () => {
    const { container } = renderWithLocale(<ContactFooter />);
    const icons = [...container.querySelectorAll('svg')];
    expect(icons).toHaveLength(4);
    for (const icon of icons) expect(icon).toHaveClass('text-primary');
  });

  it('anchors the #contato nav target', () => {
    const { container } = renderWithLocale(<ContactFooter />);
    expect(container.querySelector('#contato')).not.toBeNull();
  });
});
