import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SITE_VERSION, releaseUrl } from '../lib/version';
import { ContactFooter, CONTACT_EMAIL } from './ContactFooter';
import { renderWithLocale } from '../test-utils';

describe('ContactFooter', () => {
  it('asks a reader-first question rather than pitching for work', () => {
    renderWithLocale(<ContactFooter />);
    expect(screen.getByRole('heading', { name: /Algo aqui te ajudou/ })).toBeInTheDocument();
  });

  // The version is only useful if it is the version that SHIPPED — so it comes from the root VERSION
  // file, the same one `version-main` bumps and tags, never a literal restated here.
  //
  // A test cannot independently know the version: any assertion reads the same file the component does,
  // so comparing them proves only that both read something. What it CAN prove is that what they read is
  // a real version and reaches the reader intact — which is why the shape is asserted first. Without
  // that line, an empty or undefined import renders "v" and an assertion built from the same broken
  // value matches it happily.
  it('shows the running build, and links it to the release that made it', () => {
    expect(SITE_VERSION, 'VERSION must resolve to a real semver at build time').toMatch(/^\d+\.\d+\.\d+$/);

    renderWithLocale(<ContactFooter />);
    expect(screen.getByRole('link', { name: `v${SITE_VERSION}` })).toHaveAttribute('href', releaseUrl());
    // The link points at the release for THIS build, not a generic releases page — that is what makes
    // the number checkable rather than decorative.
    expect(releaseUrl()).toBe(
      `https://github.com/tedeuxx/tadeumendonca-io/releases/tag/v${SITE_VERSION}`,
    );
  });

  it('offers the direct channels, with e-mail on the site’s own domain', () => {
    renderWithLocale(<ContactFooter />);
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', expect.stringMatching(/wa\.me\/5521986619954/));
    expect(screen.getByRole('link', { name: 'E-mail' })).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    expect(CONTACT_EMAIL).toMatch(/@tadeumendonca\.io$/);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tedeuxx');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', 'https://x.com/tedeuxx');
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
    expect(icons).toHaveLength(5);
    for (const icon of icons) expect(icon).toHaveClass('text-primary');
  });

  it('anchors the #contato nav target', () => {
    const { container } = renderWithLocale(<ContactFooter />);
    expect(container.querySelector('#contato')).not.toBeNull();
  });
});
