import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { MarkdownPage } from './MarkdownPage';
import { CONTACT_CHANNELS } from './contactChannels';
import { renderWithLocale } from '../test-utils';
import { SITE_URL } from '../lib/site';

// The shell is shared by /ramp-up and /architecture, so its DEFAULT arm is what /ramp-up gets. That is
// what this file is mostly about: `endMatter` is opt-in, and the cost of getting the default wrong is a
// reader-facing change to a page nobody reviewed.
const BODY = '## A section\n\nSome body text.\n';

const renderShell = (props: { endMatter?: boolean; locale?: 'pt' | 'en' } = {}) => {
  const { endMatter, locale = 'pt' } = props;
  return renderWithLocale(
    <MarkdownPage
      kicker="A kicker"
      title="A title"
      description="A description"
      heading="A heading"
      canonicalPath="/architecture"
      jsonLdType="Article"
      body={BODY}
      {...(endMatter === undefined ? {} : { endMatter })}
    />,
    { locale },
  );
};

// The two blocks the flag gates, queried by their accessible names rather than by class — a restyle must
// not silently re-point these at nothing.
const shareBlock = (locale: 'pt' | 'en') =>
  screen.queryByRole('navigation', { name: locale === 'pt' ? 'Compartilhar este artigo' : 'Share this article' });
const contactBlock = (locale: 'pt' | 'en') =>
  screen.queryByRole('heading', { name: locale === 'pt' ? 'Onde me encontrar' : 'Where to find me' });

describe('MarkdownPage', () => {
  it('renders the chrome and the body it is handed', () => {
    renderShell();
    expect(screen.getByRole('heading', { level: 1, name: 'A heading' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'A section' })).toBeInTheDocument();
  });

  // DECISION 2 on #450, and this is the assertion that protects it. The default arm is what /ramp-up
  // renders; a shell that rendered the block unconditionally would hand a personal plan in progress a
  // distribution affordance and a contact CTA as a side effect of a slice about a different page.
  //
  // MUTATION-CHECKED BY DOING IT, not by reading it: flipping `endMatter = false` to `endMatter = true`
  // in MarkdownPage.tsx turns these four assertions red (and the two in RampUpPage.test.tsx with them).
  // A negative assertion whose query is simply wrong passes on a healthy page and on a broken one alike,
  // which is why the positive arm below queries through the SAME two helpers.
  it.each(['pt', 'en'] as const)('renders NO closing block by default (%s)', (locale) => {
    renderShell({ locale });
    expect(shareBlock(locale)).toBeNull();
    expect(contactBlock(locale)).toBeNull();
  });

  it.each(['pt', 'en'] as const)('renders the contact route and the deeplinks when opted in (%s)', (locale) => {
    renderShell({ endMatter: true, locale });
    expect(shareBlock(locale)).toBeInTheDocument();
    expect(contactBlock(locale)).toBeInTheDocument();
  });

  // The contact route is sourced from `contactChannels.ts` — the declared single source of truth for the
  // owner's public channels — and NOT from a hardcoded address anywhere else. Asserted against the module
  // itself so a second, divergent list cannot satisfy it.
  it('sources every contact channel from contactChannels, hardcoding none', () => {
    const { container } = renderShell({ endMatter: true });
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    for (const channel of CONTACT_CHANNELS) {
      expect(hrefs, `${channel.label} must come from CONTACT_CHANNELS`).toContain(channel.href);
    }
    // Exactly one mailto, and it is the shared constant's — a second one would be the second source of
    // truth this wiring exists to avoid.
    expect(hrefs.filter((h) => h?.startsWith('mailto:'))).toHaveLength(1);
  });

  // The deeplinks are given the LOCALE-PREFIXED canonical path. The component never guesses it, so this
  // pins the caller's half: a share link built from the unprefixed path sends every reader the pt edition.
  it.each(['pt', 'en'] as const)('shares the localized canonical URL of the page (%s)', (locale) => {
    renderShell({ endMatter: true, locale });
    const linkedin = screen.getByRole('link', {
      name: locale === 'pt' ? 'Compartilhar no LinkedIn: A title' : 'Share on LinkedIn: A title',
    });
    expect(linkedin.getAttribute('href')).toContain(encodeURIComponent(`${SITE_URL}/${locale}/architecture`));
  });

  // ORDER: the contact route sits directly under the body's closing ask, and the deeplinks close the page
  // (#183 — "a reader who has just finished is the one with something to say about it"). Inverting them
  // would leave both blocks present and both assertions above green.
  it('puts the contact route above the deeplinks, both after the body', () => {
    const { container } = renderShell({ endMatter: true });
    const body = container.querySelector('[data-testid="markdown-body"]');
    const contact = screen.getByRole('heading', { name: 'Onde me encontrar' });
    const share = screen.getByRole('navigation', { name: 'Compartilhar este artigo' });
    expect(body!.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(contact.compareDocumentPosition(share) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
