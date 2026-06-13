import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocialLinksWidget } from './SocialLinksWidget';

describe('SocialLinksWidget', () => {
  it('renders the social links, each opening in a new tab', () => {
    render(<SocialLinksWidget />);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530/',
    );
    expect(screen.getByRole('link', { name: 'Medium' })).toHaveAttribute('href', 'https://tadeumendonca.medium.com');
    for (const name of ['GitHub', 'LinkedIn', 'Medium', 'WhatsApp']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('target', '_blank');
    }
  });

  it('builds a WhatsApp click-to-message link with the pre-filled message', () => {
    render(<SocialLinksWidget />);
    const wa = screen.getByRole('link', { name: 'WhatsApp' });
    expect(wa).toHaveAttribute('href', expect.stringContaining('https://wa.me/5521986619954?text='));
    // the message is URL-encoded
    expect(wa.getAttribute('href')).toContain(encodeURIComponent('Olá Tadeu, vim pelo tadeumendonca.io'));
  });
});
