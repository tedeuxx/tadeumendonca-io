import { describe, it, expect } from 'vitest';
import { catalog } from './catalog';

describe('catalog', () => {
  // Regression guard for #175: the card for this very site must not offer a "View live" link —
  // the reader is already on the live site, so the link would point at the page they're viewing.
  it("the site's own entry carries no liveUrl", () => {
    const self = catalog.find((p) => p.name === 'tadeumendonca.io');
    expect(self).toBeDefined();
    expect(self?.liveUrl).toBeUndefined();
  });
});
