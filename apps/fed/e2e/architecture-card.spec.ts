import { test, expect } from '@playwright/test';

// The /architecture teaser card on the landing, in a real viewport (#450, slice 2). Replaces
// `architecture-band.spec.ts`, deleted with the band it measured.
//
// WHY IT IS NOT COVERED ALREADY. `responsive-overflow.spec.ts` asserts the DOCUMENT never scrolls
// sideways across a width sweep — and it stays green on the exact failures guarded here, because both of
// them CLIP rather than widen: the card's control sits in a `flex-wrap` container, and the chip sits in
// another. Overflow is what happens when wrapping is unavailable; clipping is what happens when it is.
// `hero-row.spec.ts` cannot see this one either — its locator is scoped to `header#top`, and the card is
// inside `#artigos`, which is also the assertion that the card did NOT become a fifth hero control.
//
// Both editions, because the chip and the title differ in length between them, and the chip is the string
// this card cannot afford to lose: it is what stops a section teaser reading as an article.
const ROUTES = ['/pt', '/en'];
const WIDTHS = [320, 390, 768, 1280];
const HEIGHT = 900;

const CARD = '[data-testid="architecture-card"]';
const CONTROL = `${CARD} .flex > a`;
const CHIP = `${CARD} span`;

const LABEL: Record<string, { control: string; chip: string }> = {
  '/pt': { control: 'Arquitetura', chip: 'Seção do site' },
  '/en': { control: 'Architecture', chip: 'Site section' },
};

test.describe('the architecture teaser card', () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route}: the card's control and chip are inside the viewport at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const boxes = await page.locator(`${CONTROL}, ${CHIP}`).evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              label: el.textContent?.trim() ?? '',
              href: el.getAttribute('href'),
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
            };
          }),
        );

        // An empty list satisfies every assertion below in silence, and a restyled or renamed card is
        // exactly how these locators would stop matching. Two elements: the chip and the one control.
        expect(boxes.length, 'the card chip/control did not resolve — the locator went stale').toBe(2);

        const viewport = await page.evaluate(() => document.documentElement.clientWidth);
        for (const b of boxes) {
          expect(b.left, `"${b.label}" is cut off the left edge at ${width}px`).toBeGreaterThanOrEqual(0);
          expect(b.right, `"${b.label}" is cut off the right edge at ${width}px`).toBeLessThanOrEqual(viewport);
          // An element that laid out at zero width is "inside the viewport" and invisible.
          expect(b.width, `"${b.label}" collapsed to nothing at ${width}px`).toBeGreaterThan(20);
        }

        // The chip is the load-bearing string, so its TEXT is asserted whole, not just its box: a chip
        // truncated by CSS keeps its width and stops saying what it exists to say.
        const chip = boxes.find((b) => b.href === null)!;
        expect(chip.label, `the chip is not the whole string at ${width}px`).toBe(LABEL[route].chip);

        const control = boxes.find((b) => b.href !== null)!;
        expect(control.label).toBe(LABEL[route].control);
        expect(control.href).toBe(`${route}/architecture`);
      });
    }
  }

  // THE SHAPE DECISION ITSELF, measured on the served build rather than only in jsdom: the card is INSIDE
  // the article list and is its first row, the landing's spine is hero → grid with nothing between, and
  // the hero row is still four controls.
  test('/pt: is the first row of the article list, and adds no fifth hero control', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');

    expect(await page.locator('header#top a[class*="border-border-strong"]').count()).toBe(4);

    const shape = await page.evaluate((sel) => {
      const card = document.querySelector(sel);
      const articles = document.querySelector('#artigos');
      const rows = [...document.querySelectorAll('#artigos article')];
      return {
        found: card !== null,
        insideTheList: articles?.contains(card!) ?? false,
        firstRow: rows[0] === card,
        heroBottom: document.querySelector('header#top')?.getBoundingClientRect().bottom ?? NaN,
        listTop: articles?.getBoundingClientRect().top ?? NaN,
      };
    }, CARD);

    expect(shape.found, 'the card is not on the page').toBe(true);
    expect(shape.insideTheList, 'the card rendered outside #artigos — that is the band again').toBe(true);
    expect(shape.firstRow, 'the card is not the first row of the list').toBe(true);
    // Nothing between the hero and the list: the gap is layout padding, not another block. Measured
    // rather than asserted structurally, because "descaracterizou a home" was a visual verdict.
    expect(shape.listTop - shape.heroBottom).toBeLessThan(HEIGHT / 2);
  });

  // THE CONTROL LABEL IS THE DECISION, not the link's existence: "Ler artigo" on a control that opens a
  // section states something the click does not do. Asserted on the SERVED page because that is the text
  // a reader meets, and asserted positively — the card's controls are enumerated and none of them may
  // carry the article verb.
  test('/pt: no control on the card reads "Ler artigo"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: HEIGHT });
    await page.goto('/pt');
    await page.waitForLoadState('networkidle');

    const labels = await page.locator(`${CARD} a`).evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ''));
    expect(labels.length, 'the card has no links — the locator went stale').toBe(2);
    expect(labels[1]).toBe('Arquitetura');
    expect(labels).not.toContain('Ler artigo');

    // And the rows that ARE articles still carry it, so "the card lost the verb" cannot be satisfied by
    // the section losing it.
    const rowLabels = await page
      .locator('#artigos article:not([data-testid="architecture-card"]) a')
      .evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ''));
    expect(rowLabels, 'no published article row rendered its read control').toContain('Ler artigo');
  });
});
