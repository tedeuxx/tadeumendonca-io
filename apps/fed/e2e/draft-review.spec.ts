import { test, expect } from '@playwright/test';
import { HELD_CONTENT_ISSUE, HELD_NONCES, HELD_SLUGS } from '../src/content/heldFixture';

// #506 — the two review affordances, against the SERVED artifact.
//
// WHY THIS EXISTS ALONGSIDE THE UNIT SUITES, which already assert the gate, the payload and both failure
// shapes. Three things are only true in a browser, and each is a way this ships broken while jsdom stays
// green:
//
//   1. THE CLIPBOARD IS REAL HERE. The unit tests stub `navigator.clipboard` and assert what `writeText`
//      was CALLED WITH — the payload, not the clipboard. This reads back what actually landed.
//   2. THE BODY TRAVELS THROUGH THE REAL BUNDLE. The article reaching the bar comes through the real
//      glob, the real frontmatter parse and the real hydration, not through a hand-built `BlogPost`.
//   3. THE GATE IS EXERCISED FROM THE URL, through the router, exactly as the owner reaches it — including
//      the `?preview` that `ArticleRoute` reads one layer up to decide whether the page renders at all.
//
// EVERY assertion is mutation-checked on the SOURCE; the reds are recorded on the PR, not here.
//
// Chromium-only, which is the whole project matrix. The Safari user-activation rule the copy is built
// around is therefore argued in `useCopyToClipboard` and covered by no browser in this suite — stated
// rather than implied.
test.use({ locale: 'pt-BR' });

const held = (locale: 'pt' | 'en') => `/${locale}/blog/${HELD_SLUGS[locale]}`;

const ISSUE_LINK = { pt: 'Abrir a issue deste artigo no GitHub', en: 'Open the issue for this article on GitHub' };
const COPY = { pt: 'Copiar o texto do artigo', en: 'Copy the article text' };

test.describe('the review affordances on a held article', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('offers both controls, in either edition, behind the preview parameter', async ({ page }) => {
    for (const locale of ['pt', 'en'] as const) {
      await page.goto(`${held(locale)}?preview`);
      await expect(page.getByRole('link', { name: ISSUE_LINK[locale] })).toBeVisible();
      await expect(page.getByRole('button', { name: COPY[locale] })).toBeVisible();
    }
  });

  // The link's destination is derived from the fixture's own frontmatter, so the assertion compares the
  // served href against the single spelling of that number rather than against a re-typed one.
  test('points the issue control at the Issue the article names', async ({ page }) => {
    await page.goto(`${held('pt')}?preview`);
    await expect(page.getByRole('link', { name: ISSUE_LINK.pt })).toHaveAttribute(
      'href',
      `https://github.com/tedeuxx/tadeumendonca-io/issues/${HELD_CONTENT_ISSUE}`,
    );
  });

  // THE WHOLE POINT OF THE COPY CONTROL: the entire article on the clipboard, so it can be pasted into
  // the Issue's compose box and cut down to what is being commented on. The nonce is what says the BODY
  // arrived and not merely the title.
  test('lands the whole article on the system clipboard', async ({ page }) => {
    await page.goto(`${held('pt')}?preview`);
    await page.getByRole('button', { name: COPY.pt }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());

    expect(text).toMatch(/^# Fixture de rascunho retido\n/);
    expect(text).toContain(HELD_NONCES.pt);
    // The citation opens the article WHILE IT IS HELD. Without the parameter this link redirects the
    // reviewer to the locale home from inside the review he is writing — the article reading as gone.
    expect(text).toContain(`https://tadeumendonca.io${held('pt')}?preview`);
    // The ruler: the body is not merely present, it is whole. A payload truncated the way a prefilled
    // `?body=` URL would truncate it still contains the title and could still contain the nonce.
    const served = await page.locator('article').innerText();
    expect(text.length).toBeGreaterThan(served.length / 2);
  });

  test('confirms the copy on the control itself', async ({ page }) => {
    await page.goto(`${held('en')}?preview`);
    await page.getByRole('button', { name: COPY.en }).click();
    await expect(page.getByText('Copied')).toBeVisible();
  });
});

test.describe('who does NOT meet the review affordances', () => {
  // THE SAFE-CLASS CLAIM, on the served site. A published article is what every visitor reaches, and
  // nothing about the bar may be on it. Read from the whole rendered body rather than by role, so a
  // control that lost its accessible name is still caught.
  test('a published article shows nothing of it to an ordinary reader', async ({ page }) => {
    await page.goto('/pt/blog/meu-compromisso');
    // The ruler first: the article really rendered, so the absences below are findings and not an empty
    // page — the false-green shape this suite keeps guarding against.
    //
    // BY NAME, not `{ level: 1 }`: the page carries TWO h1s — the column header's "Blog" and the
    // article's own title — so the level locator is a strict-mode violation and this ruler failed on its
    // first run against the built site. Naming the article's title is also the stronger ruler: the
    // column header renders on the not-found branch too, so it would have been satisfied by a page that
    // never found the article at all.
    await expect(page.getByRole('heading', { name: 'Meu Compromisso' })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Copiar o texto do artigo');
    expect(body).not.toContain('Abrir a issue');
    expect(await page.getByRole('group', { name: 'Revisão do artigo' }).count()).toBe(0);
  });

  // THE DEGRADATION, on a real article rather than a fixture: every piece published before #506 names no
  // Issue, so the copy control is offered and the link is not. This is also the assertion that pins the
  // gate being the PARAMETER ALONE — a published article renders the bar, which is the decision recorded
  // in `ArticlePage`. A reviewer who wants the narrower `draft && preview` gate deletes this test
  // deliberately rather than discovering the behaviour after the fact.
  test('a published article WITH the parameter offers the copy control and no link', async ({ page }) => {
    await page.goto('/pt/blog/meu-compromisso?preview');
    await expect(page.getByRole('button', { name: COPY.pt })).toBeVisible();
    expect(await page.getByRole('link', { name: ISSUE_LINK.pt }).count()).toBe(0);
  });
});
