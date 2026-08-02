import { describe, it, expect } from 'vitest';
import { catalog } from './catalog';

describe('catalog', () => {
  // This site's own entry, found by its repoUrl rather than by `name` (#329). The lookup used the literal
  // 'tadeumendonca.io' and went red the moment `name` became the GitHub repo name — a rename in data
  // silently orphaning a guard that then tests nothing is the failure this file exists to prevent, so it
  // is keyed on the FACT that cannot drift: the URL identifying which repo this is.
  const self = catalog.find((p) => p.repoUrl === 'https://github.com/tedeuxx/tadeumendonca-io');

  // Regression guard for #175: the card for this very site must not offer a "View live" link —
  // the reader is already on the live site, so the link would point at the page they're viewing.
  it("the site's own entry carries no liveUrl", () => {
    expect(self).toBeDefined();
    expect(self?.liveUrl).toBeUndefined();
  });

  // #329, and the rule it states on `CatalogProject.name`: a card's title is the GitHub repo name,
  // verbatim. Asserted against the repoUrl's last segment rather than a literal, so the rule is checked
  // for EVERY entry — including the next one, which is the point of making it a rule instead of a fix.
  it('every card is titled with its repo name, verbatim', () => {
    for (const project of catalog) {
      expect(project.name).toBe(project.repoUrl.split('/').pop());
    }
  });

  // Only this repo may claim `this-build`: the tag comes from the local VERSION file, so any other entry
  // declaring it would display THIS site's version beside someone else's repo — a wrong claim that no
  // rendering test can catch, because the component would be doing exactly what it was told.
  it("only this site's own entry reads its tag from this build", () => {
    for (const project of catalog) {
      if (project.releases === 'this-build') {
        expect(project.repoUrl).toBe('https://github.com/tedeuxx/tadeumendonca-io');
      }
    }
  });
});
