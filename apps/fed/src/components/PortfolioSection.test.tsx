import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import type { CatalogProject } from '../data/catalog';
import { renderWithLocale } from '../test-utils';

// Drive both the empty state and the populated state by mocking the (static) catalog module.
const { state } = vi.hoisted(() => ({ state: { catalog: [] as CatalogProject[] } }));
vi.mock('../data/catalog', () => ({
  get catalog() {
    return state.catalog;
  },
}));

import { PortfolioSection } from './PortfolioSection';

// Distinct pt/en strings per prose field (#235): identical fixtures would render the same either way,
// so the locale resolution would be untested — the shape of defect that let /en/portfolio ship
// Portuguese copy in the first place.
const sample: CatalogProject = {
  name: 'demo-project',
  tagline: { pt: 'Uma automação de exemplo.', en: 'A demo automation.' },
  description: { pt: 'Faz uma coisa.', en: 'Does a thing.' },
  proof: { pt: 'como encadear um agente com ferramentas.', en: 'how to chain an agent with tools.' },
  stack: ['Python'],
  repoUrl: 'https://github.com/tedeuxx/demo',
  liveUrl: 'https://example.com',
  status: 'live',
};

const renderSection = (props: { limit?: number; showAllLink?: boolean } = {}) =>
  renderWithLocale(<PortfolioSection {...props} />);

describe('PortfolioSection', () => {
  beforeEach(() => {
    state.catalog = [];
  });

  it('shows an empty state linking to GitHub when the catalog is empty', () => {
    renderSection();
    expect(screen.getByText(/Catálogo em construção/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Acompanhe no GitHub/ })).toHaveAttribute('href', 'https://github.com/tedeuxx');
  });

  it('renders a card per catalog project, with the reader-first payoff', () => {
    state.catalog = [sample];
    renderSection();
    expect(screen.getByRole('link', { name: /demo-project/ })).toHaveAttribute('href', sample.repoUrl);
    expect(screen.getByText('Uma automação de exemplo.')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('O que você tira disso')).toBeInTheDocument();
    expect(screen.getByText(/como encadear um agente/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver no GitHub/ })).toHaveAttribute('href', sample.repoUrl);
    expect(screen.getByRole('link', { name: /Ver ao vivo/ })).toHaveAttribute('href', sample.liveUrl);
  });

  // #329. The two release shapes, and what each must NOT do.
  //
  // Asserting `v${SITE_VERSION}` against a card built from `SITE_VERSION` would be circular — the same
  // literal on both sides of the equals. What is worth pinning here is the COUPLING the issue's
  // acceptance actually names: *the card must not be able to display a tag that is not the tag it links
  // to.* So the assertion reads the rendered label and checks the href contains that same string,
  // whatever it happens to be. It fails if either side is derived separately, which is the defect.
  //
  // Whether the tag is the RIGHT one is not a unit-test question at all — a stale literal passes any
  // test that reads the same literal. That is asserted on the served artifact, in e2e/routes.spec.ts.
  //
  // Queried by the ACCESSIBLE NAME, not the visible text: the link carries an `aria-label`, which
  // overrides its text content for the `name` option. Finding the element by `/^⌂ v/` stopped working the
  // moment that label was added — and that is the label doing its job, since a screen reader would
  // otherwise announce a house glyph and a version number.
  it('shows the build tag and links THAT tag, from one value', () => {
    state.catalog = [{ ...sample, releases: 'this-build' }];
    renderSection();

    const link = screen.getByRole('link', { name: /Notas da release/ });
    const tag = link.textContent!.replace('⌂', '').trim();
    expect(tag).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(link).toHaveAttribute('href', `https://github.com/tedeuxx/tadeumendonca-io/releases/tag/${tag}`);
  });

  // The third shape (#345). Same coupling assertion as `this-build` above and for the same reason — the
  // label is read off the render and the href expectation is BUILT from it, so it holds at any version
  // and fails the moment the two are derived separately.
  //
  // The href is built from the CARD's repoUrl, not from a literal: "which repo" is data on the card, so a
  // hardcoded expectation here would pass even if the component pointed every plugin-build tag at this
  // site's repo.
  it('shows the plugin tag and links THAT tag on the plugin\'s own repo', () => {
    state.catalog = [{ ...sample, releases: 'plugin-build' }];
    renderSection();

    const link = screen.getByRole('link', { name: /Notas da release deste projeto/ });
    const tag = link.textContent!.replace('⌂', '').trim();
    expect(tag).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(link).toHaveAttribute('href', `${sample.repoUrl}/releases/tag/${tag}`);
  });

  // The two tag variants must not share an accessible name, because they do not make the same claim:
  // `this-build` is this site's own version, `plugin-build` is the plugin release this site was deployed
  // against. Reusing `viewReleaseTag` ("this version of the project") on the plugin card would overclaim,
  // and nothing but this assertion would notice — the visible text is identical either way.
  it('gives the plugin tag its own accessible name, not the this-build one', () => {
    state.catalog = [{ ...sample, releases: 'plugin-build' }];
    renderSection();
    expect(screen.queryByRole('link', { name: /Notas da release desta versão do projeto/ })).toBeNull();
    expect(
      screen.getByRole('link', { name: /Notas da release deste projeto com que o site foi publicado/ }),
    ).toBeInTheDocument();
  });

  // The card that shows no tag at all. Asserted as an absence as much as a presence: a tag on an `index`
  // card would mean it came from somewhere that can go stale.
  it('links the releases index with no tag when the tag is not knowable', () => {
    state.catalog = [{ ...sample, releases: 'index' }];
    renderSection();

    expect(screen.getByRole('link', { name: /Releases/ })).toHaveAttribute('href', `${sample.repoUrl}/releases`);
    expect(screen.queryByText(/^v\d+\.\d+\.\d+$/)).toBeNull();
  });

  // Absent `releases` renders nothing at all — a card for a project with no releases must not grow an
  // affordance by default. Every catalog entry predating #329 is in this state.
  it('renders no release affordance when the field is absent', () => {
    state.catalog = [sample];
    renderSection();
    expect(screen.queryByRole('link', { name: /Releases|Notas da release/ })).toBeNull();
  });

  // The accessible name is asserted on its own, because it is the whole reason the visible text can stay
  // a bare version string. A screen reader announcing "house v-zero-point-one" is what this prevents.
  it('gives the bare tag an accessible name, and leaves the worded variant alone', () => {
    state.catalog = [{ ...sample, releases: 'this-build' }];
    const { unmount } = renderSection();
    expect(screen.getByRole('link', { name: /Notas da release desta versão do projeto/ })).toBeInTheDocument();
    unmount();

    // `Releases` is already its own accessible name, so it must NOT be given a redundant one — asserted
    // as the ABSENCE of the tag label rather than by matching an exact string, since the name includes
    // the leading glyph (`⌂ Releases`).
    state.catalog = [{ ...sample, releases: 'index' }];
    renderSection();
    expect(screen.getByRole('link', { name: /Releases/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Notas da release/ })).toBeNull();
  });

  // The bug this file's bilingual shape exists to prevent (#235): /en/portfolio served Portuguese copy
  // because the prose fields were plain strings. Asserted in BOTH directions — each edition must show
  // its own prose AND not leak the other's, which is the same parity contract the blog editions carry.
  it('renders each edition in its own language, with no leak from the other', () => {
    state.catalog = [sample];
    const { unmount } = renderWithLocale(<PortfolioSection />, { locale: 'en' });
    expect(screen.getByText('A demo automation.')).toBeInTheDocument();
    expect(screen.getByText('Does a thing.')).toBeInTheDocument();
    expect(screen.getByText(/how to chain an agent/)).toBeInTheDocument();
    expect(screen.queryByText('Uma automação de exemplo.')).toBeNull();
    unmount();

    renderWithLocale(<PortfolioSection />, { locale: 'pt' });
    expect(screen.getByText('Uma automação de exemplo.')).toBeInTheDocument();
    expect(screen.getByText('Faz uma coisa.')).toBeInTheDocument();
    expect(screen.queryByText('A demo automation.')).toBeNull();
  });

  // #246 — with one item, and that item being this site, the page reads as a catalog that has not
  // started unless it says something governs what gets listed. Asserted in both editions, and on the
  // href, because the link is what makes the claim checkable rather than a promise.
  it('states the bar and links the checkable artifact, in both editions', () => {
    state.catalog = [sample];
    const bar = 'https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md';

    const { unmount } = renderWithLocale(<PortfolioSection showBar />, { locale: 'pt' });
    expect(screen.getByText(/A régua pra entrar aqui/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'docs/catalog-ready.md' })).toHaveAttribute('href', bar);
    unmount();

    renderWithLocale(<PortfolioSection showBar />, { locale: 'en' });
    expect(screen.getByText(/The bar for getting listed here/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'docs/catalog-ready.md' })).toHaveAttribute('href', bar);
  });

  it('states the bar even when the catalog is empty — the standard is not conditional on having items', () => {
    renderWithLocale(<PortfolioSection showBar />, { locale: 'pt' });
    expect(screen.getByText(/A régua pra entrar aqui/)).toBeInTheDocument();
  });

  // The default is silent, and that is a product call (PR #251) rather than an implementation detail:
  // the landing renders this same component and must NOT carry the curation claim. Asserted on
  // the LINK too, because a future refactor could drop the sentence and leave the anchor behind.
  it('says nothing about the bar unless the caller asks for it — the landing must not carry the claim', () => {
    state.catalog = [sample];
    renderWithLocale(<PortfolioSection />, { locale: 'pt' });
    expect(screen.queryByText(/A régua pra entrar aqui/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'docs/catalog-ready.md' })).toBeNull();
  });

  it('omits the live link when the project has none', () => {
    state.catalog = [{ ...sample, liveUrl: undefined }];
    renderSection();
    expect(screen.queryByRole('link', { name: /Ver ao vivo/ })).toBeNull();
  });

  it('omits the payoff line when the project declares none', () => {
    state.catalog = [{ ...sample, proof: undefined }];
    renderSection();
    expect(screen.queryByText('O que você tira disso')).toBeNull();
  });

  it('truncates to the shortlist and links to the full catalog on request', () => {
    state.catalog = [sample, { ...sample, name: 'second' }, { ...sample, name: 'third' }];
    renderSection({ limit: 2, showAllLink: true });
    expect(screen.queryByRole('link', { name: /third/ })).toBeNull();
    expect(screen.getByRole('link', { name: /Ver catálogo completo/ })).toHaveAttribute('href', '/pt/portfolio');
  });

  it('shows everything and no catalog link by default', () => {
    state.catalog = [sample, { ...sample, name: 'second' }];
    renderSection();
    expect(screen.getByRole('link', { name: /second/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver catálogo completo/ })).toBeNull();
  });
});
