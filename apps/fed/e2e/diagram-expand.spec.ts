import { test, expect, type Page } from '@playwright/test';

// THE ASSERTION THIS PAGE DID NOT HAVE (#473): painted type size.
//
// The Issue's finding is that the three mermaid figures ship at 2.1–3.5px of painted type on a phone —
// roughly half what `VennDiagram.tsx`'s own comment calls "present, 'visible' to every assertion, and
// unreadable" — while all 29 existing diagram assertions stayed green. They stayed green because every
// one of them measures a BOX: does it overflow, is it centred, is it reachable, is it as wide as the
// column. None of them measures the thing a reader complains about.
//
// So this spec measures glyphs. `scale = rendered SVG width ÷ viewBox width`, and painted size is each
// `<text>`'s computed `font-size` times that scale — the same reading the Issue and PR #550 took, so
// the numbers here are comparable to theirs rather than a new units system.
//
// WHY E2E AND NOT A UNIT TEST: jsdom has no layout engine and reports zero-sized rects, so scale is
// `0 ÷ viewBox` there and every assertion below would be vacuously true. `DiagramFigure.test.tsx`
// carries everything that IS a DOM fact; this file carries the two things only a browser knows —
// what the type actually measures, and that the page underneath does not move.
const ROUTES = ['/pt/architecture', '/en/architecture'] as const;
const PHONE_WIDTHS = [320, 390, 430] as const;
const HEIGHT = 900;

/** The trigger's accessible name is `"<verb>: <caption>"` in the page's own locale. */
const EXPAND = /^(Enlarge|Ampliar):/;
const COLLAPSE = /^(Close|Fechar):/;

/**
 * Every figure's smallest painted glyph, in CSS pixels, in document order.
 *
 * Read off `.diagram-canvas` rather than off `figure.diagram` so it cannot pick up a control's icon —
 * the reason `DiagramFigure` renders its trigger as text is that `el.querySelector('svg')` in three
 * other suites would otherwise retarget onto a 14px decoration.
 */
const paintedType = (page: Page) =>
  page.locator('.diagram-canvas').evaluateAll((els) =>
    els.map((el) => {
      const svg = el.querySelector('svg')!;
      const viewBox = svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
      const scale = svg.getBoundingClientRect().width / viewBox[2];
      const sizes = [...svg.querySelectorAll('text')].map(
        (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
      );
      return {
        title: svg.querySelector('title')?.textContent ?? '(no title)',
        scale: Number(scale.toFixed(3)),
        smallest: Number(Math.min(...sizes).toFixed(2)),
      };
    }),
  );

test.describe('a figure can be read at the size it was drawn', () => {
  for (const route of ROUTES) {
    for (const width of PHONE_WIDTHS) {
      test(`${route}: every figure paints legible type once expanded, at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        const triggers = page.getByRole('button', { name: EXPAND });
        // Four figures, and the Issue's scope is all four — the owner included the Venn himself. A
        // count assertion rather than "at least one", so a figure that loses its control is a red test
        // rather than an untested figure.
        await expect(triggers).toHaveCount(4);

        const inFlow = await paintedType(page);

        for (let i = 0; i < 4; i++) {
          // `nth(i)`, so all four figures are read rather than the first one four times — and the
          // triggers are re-located each pass because the promoted figure's own control renames itself
          // to the collapse verb, which changes what this locator matches.
          await page.getByRole('button', { name: EXPAND }).nth(i).click();
          const dialog = page.getByRole('dialog');
          await expect(dialog).toHaveCount(1);

          // Only ONE canvas is on screen while promoted — the other three are still in the flow behind
          // the opaque overlay, so the reading is taken from the dialog's own canvas.
          const painted = await dialog.locator('.diagram-canvas').evaluate((el) => {
            const svg = el.querySelector('svg')!;
            const viewBox = svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
            const scale = svg.getBoundingClientRect().width / viewBox[2];
            const sizes = [...svg.querySelectorAll('text')].map(
              (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
            );
            return {
              title: svg.querySelector('title')?.textContent ?? '(no title)',
              scale: Number(scale.toFixed(3)),
              smallest: Number(Math.min(...sizes).toFixed(2)),
            };
          });

          // THE BAR IS THE RECORD'S OWN. `VennDiagram.tsx` calls ~5px unreadable, and #473 measured the
          // figures at 2.1–3.5px against it. 10px is deliberately well clear of that line rather than
          // at it: a threshold set AT the boundary passes on a figure that is exactly as bad as the one
          // this Issue exists about. What the floor actually delivers is scale ≥ 1 — the size the
          // drawing was compiled at — so this fails the moment the promotion stops flooring the width,
          // which is the one mutation that matters.
          expect(
            painted.smallest,
            `"${painted.title}" paints ${painted.smallest}px at ${width} while expanded (scale ${painted.scale}) — the record calls ~5px unreadable`,
          ).toBeGreaterThanOrEqual(10);
          expect(painted.scale, `"${painted.title}" is still being downscaled`).toBeGreaterThanOrEqual(1);

          // The page body must never scroll sideways — the invariant `responsive-overflow.spec.ts`
          // holds for the flow, asserted here for the promoted state, which is a new way to break it:
          // a 1628px drawing is on screen and only its own scroller may move.
          const bodyOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(bodyOverflow, 'the promoted figure pushed the page sideways').toBeLessThanOrEqual(0);

          await page.getByRole('button', { name: COLLAPSE }).click();
          await expect(page.getByRole('dialog')).toHaveCount(0);
        }

        // CLOSING PUTS EVERY FIGURE BACK EXACTLY. The promotion mutates the drawing's own inline
        // `min-width`/`max-width`, so a restore that is off by one figure leaves a 1628px floor in a
        // 352px column — which would break the overflow sweep on a page the reader is still on.
        expect(await paintedType(page)).toEqual(inFlow);
      });
    }
  }

  // THE CONTROL HAS TO LOOK PRESSABLE WITHOUT A POINTER, and this is E2E rather than a unit test for
  // the reason the whole file exists: jsdom does not run the stylesheet, so "the element carries a
  // border class" and "a phone reader sees a boundary" are different claims and only a browser settles
  // the second.
  //
  // The defect this pins: the trigger first shipped with FIGCAPTION_CLASS's exact five properties, so
  // the only thing distinguishing a control from a label was a `hover:` variant — and a phone has no
  // hover. The measured 2.6px → 15px is entirely behind a press, so a control that reads as a caption
  // costs this feature its whole value on the device it was built for.
  //
  // NOTHING IS HOVERED BEFORE THE READING: this runs immediately after load, with no click and no
  // mouse move, so what it measures is the resting state a phone reader actually meets.
  for (const width of PHONE_WIDTHS) {
    test(`/en/architecture: the expand control is visibly pressable without hover, at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto('/en/architecture');
      await page.waitForLoadState('networkidle');

      const seen = await page
        .locator('figure.diagram')
        .first()
        .evaluate((figure) => {
          const button = figure.querySelector('button')!;
          const caption = figure.querySelector('figcaption')!;
          const read = (el: Element) => {
            const s = getComputedStyle(el);
            return {
              borderWidth: parseFloat(s.borderTopWidth),
              borderColor: s.borderTopColor,
              background: s.backgroundColor,
            };
          };
          return { button: read(button), caption: read(caption) };
        });

      // A border that exists and is actually painted. `borderColor` is read too because a 1px border in
      // `transparent` satisfies a width-only assertion and shows the reader nothing.
      expect(seen.button.borderWidth, 'the control has no border at rest').toBeGreaterThanOrEqual(1);
      expect(seen.button.borderColor, 'the control border is painted in transparent').not.toMatch(
        /rgba\(0, 0, 0, 0\)|transparent/,
      );
      // COMPARATIVE, against the one element it must not be mistaken for. "The button has a border" on
      // its own would stay green on a page where the caption grew one too — which is precisely the state
      // this test exists to forbid, since the defect was the two being indistinguishable.
      expect(
        seen.caption.borderWidth,
        'the caption grew a border — the control is indistinguishable from a label again',
      ).toBe(0);
    });
  }

  // The keyboard path is the point of the feature, not a checkbox: a figure a mouse can expand and a
  // keyboard cannot is worse than no overlay at all.
  test('/en/architecture: the overlay opens, traps and closes from the keyboard alone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: HEIGHT });
    await page.goto('/en/architecture');
    await page.waitForLoadState('networkidle');

    const trigger = page.getByRole('button', { name: EXPAND }).first();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(1);

    // Focus moved INTO the dialog. Asserted as containment rather than as one specific control, so
    // adding a control to the overlay does not make this a false red.
    expect(
      await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
    ).toBe(true);

    // Tab cannot leave. Pressed more times than the dialog has controls, so a trap that merely happens
    // to hold for one press does not pass.
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
      'Tab escaped the dialog into the page behind it',
    ).toBe(true);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Focus returns to the control that opened it — otherwise a screen-reader user is dropped at the
    // top of the document and has to find their place again.
    expect(
      await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? ''),
    ).toMatch(EXPAND);
  });

  // The Venn's two mechanisms are the ones #473 forbids breaking, and the overlay touches the very
  // element they act on: the same box is the promoted scroller, and the promotion is a resize its
  // ResizeObserver sees. Asserted AFTER a full open/close cycle rather than on a fresh load — a fresh
  // load is what `diagram-centred.spec.ts` already covers.
  test('/pt/architecture: the Venn is still centred on its intersection after an expand cycle', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: HEIGHT });
    await page.goto('/pt/architecture');
    await page.waitForLoadState('networkidle');

    const before = await page.locator('.diagram-canvas').evaluateAll((els) => {
      const box = els.find((el) =>
        [...el.querySelectorAll('text')].some((t) => t.textContent === 'Context & Harness'),
      )!;
      return { pannable: box.hasAttribute('data-pannable'), scrollLeft: Math.round(box.scrollLeft) };
    });
    expect(before.pannable).toBe(true);
    expect(before.scrollLeft).toBeGreaterThan(0);

    const venn = page
      .locator('figure.diagram')
      .filter({ has: page.locator('svg text', { hasText: 'Context & Harness' }) });
    await venn.getByRole('button', { name: EXPAND }).click();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.getByRole('button', { name: COLLAPSE }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // The observer fires on the next frame, not synchronously.
    await page.waitForTimeout(200);

    const after = await page.locator('.diagram-canvas').evaluateAll((els) => {
      const box = els.find((el) =>
        [...el.querySelectorAll('text')].some((t) => t.textContent === 'Context & Harness'),
      )!;
      const label = [...box.querySelectorAll('text')].find(
        (t) => t.textContent === 'Context & Harness',
      )!;
      const b = box.getBoundingClientRect();
      const l = label.getBoundingClientRect();
      return {
        pannable: box.hasAttribute('data-pannable'),
        scrollLeft: Math.round(box.scrollLeft),
        leftOfView: Math.round(b.left - l.left),
        rightOfView: Math.round(l.right - b.right),
      };
    });

    expect(after.pannable, 'the pan affordance did not come back').toBe(true);
    expect(after.scrollLeft, 'the intersection is no longer centred after an expand cycle').toBe(
      before.scrollLeft,
    );
    expect(after.leftOfView).toBeLessThanOrEqual(0);
    expect(after.rightOfView).toBeLessThanOrEqual(0);
  });
});
