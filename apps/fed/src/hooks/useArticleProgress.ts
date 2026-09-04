// `article_progress` and `article_end_reached` — the CONTENT funnel's denominator (#597).
//
// WHAT THIS IS NOT: a read. No client-side signal proves one, and the name that would claim it
// (`read`) is refused in `lib/analytics.ts` for a reason that outlives everyone present for the
// decision. What is refused here is the naive implementation as well, because it is the one every
// analytics guide reaches for first:
//
//   DOCUMENT-100% IS NOT THE END OF AN ARTICLE ON THIS SITE. Below the prose sit the share block, a
//   second share trigger, the footer back-link and the site's contact footer — so a reader who has read
//   every word and stopped is at maybe 80% of the document, while a reader who touched the End key is
//   at 100% having seen nothing. On the landing, 100% is often reached AT LOAD, so the same number is
//   not even comparable across page types.
//
// The proxy is three conditions, and each one closes a different way of being wrong:
//
//   1. THE LAST BLOCK OF THE PROSE entered the viewport — the article's own end, not the document's.
//      Observed on the wrapper `ArticlePage` already renders, so no node is added (the prerender
//      serialises DOM, and new markup can move `page-heading-measure.spec.ts` and
//      `responsive-overflow.spec.ts`; listeners and observers never reach the snapshot).
//   2. THE DEEPEST INTERMEDIATE BLOCK (the 75% milestone) entered it too. This is what separates a
//      scroll-through from a leap: End, or a scrollbar drag, jumps the middle blocks without them ever
//      intersecting, so that milestone never fires and the terminal event never becomes eligible. It
//      is the DEEPEST rather than ANY milestone for a reason measured on the built site — see the
//      condition itself.
//   3. ENOUGH TIME PASSED for the words to have been possible to read, derived from the article's own
//      length rather than a fixed number — a 4,300-word piece and a 450-word one do not share a floor.
//
// WHAT IT STILL CANNOT SEE, said rather than left to be assumed: a reader who scrolls through at a
// plausible pace with the tab in the background, or one who reads carefully and closes the tab one
// paragraph early. The first is over-counted, the second is lost. The event is a proxy with a stated
// direction of error, and it is a counter with provenance rather than a rate — at this site's volume,
// the per-article cut is noise for at least a year.
// ONE PER SESSION, PER ARTICLE — the repair of a defect this hook shipped in slice A and ran with in
// production from v1.1.81 (PR #602, round 2). It is the SAME root cause `useContactReach` had, found by
// that hook's gate and measured here rather than assumed by symmetry:
//
//   scroll /en/blog/my-commitment to the end   -> 25, 50, 75 then article_end_reached   (correct)
//   toggle PT with the article still on screen -> 50, 75 again, and, ~23s later, a SECOND
//                                                 article_end_reached
//
// `sent`, `endSent` and the dwell clock all live in the effect closure, and the effect depends on
// `locale`, `status`, `slug` and `floor`. A dependency change rebuilds the observer, a fresh
// `IntersectionObserver` delivers an initial callback for whatever is already on screen, and every
// milestone visible at that moment is re-emitted having been re-armed. **Both events carry it**, which
// was checked rather than inferred — the terminal one needs a second full dwell floor to elapse first,
// so it is slower and no less real, and the E2E waits it out rather than passing early against it.
//
// THE GUARD IS KEYED ON THE ARTICLE'S IDENTITY, NOT ON ITS SLUG, and this is the one place the repair
// is not a copy of `useContactReach`'s. Slugs are PER-LOCALE (ADR-0037): the toggle above moved
// `my-commitment` to `meu-compromisso`, so a slug-keyed guard would not have matched and the duplicate
// would simply have hidden under a second slug — a worse failure than the visible one, because the two
// rows no longer look like duplicates in any report. The identity is the article's KEY, which is stable
// across editions. It is used for the marker ONLY and is never emitted; `slug` remains what GA4
// receives, unchanged and immutable per ADR-0051.
//
// WHAT IT COSTS: a reader who genuinely re-reads the same piece — or reads both editions — in one
// session is counted once. That is the owner's own trade for `contact_reach` («Uma vez por sessão»)
// applied to the funnel that has the same shape, and it is the conservative direction for a proxy that
// already errs toward over-counting.
import { useEffect, useMemo, type RefObject } from 'react';
import { useLocale } from '../i18n';
import { useConsent } from '../lib/consent';
import { trackArticleEndReached, trackArticleProgress } from '../lib/analytics';
import { firedThisSession, markFiredThisSession, onceKey } from '../lib/sessionOnce';

/**
 * The reading speed above which a human cannot have read the words, in words per minute.
 *
 * NOT an average reading speed — an average would suppress fast readers, who are exactly the audience
 * this site writes for. Ordinary prose reading sits near 200–250 wpm and trained skimming tops out
 * around 700; 1,000 is chosen as the boundary of the physically implausible, so the floor only ever
 * excludes a scroll that could not have been a read.
 *
 * The trade, and it is real: the floor is generous, so a determined skimmer clears it. It is the
 * cheaper error — a floor tight enough to exclude them would exclude genuine fast readers too, and this
 * event is already a proxy rather than a claim.
 */
const MAX_PLAUSIBLE_WORDS_PER_MINUTE = 1000;

/** A floor for very short pieces, where the derived value would be a couple of seconds and would stop
 *  discriminating anything at all. */
const MIN_DWELL_MS = 5_000;

/**
 * Word count off the raw markdown body — so markdown syntax (`##`, `**`, link targets) is counted as
 * words. That INFLATES the count and therefore the floor, in the conservative direction: a longer floor
 * excludes more, never less. Stripping the syntax would need a second markdown parse to be honest about
 * the number, and the number does not deserve one.
 */
export function dwellFloorMs(body: string): number {
  const words = body.trim().length === 0 ? 0 : body.trim().split(/\s+/).length;
  return Math.max(MIN_DWELL_MS, Math.round((words / MAX_PLAUSIBLE_WORDS_PER_MINUTE) * 60_000));
}

/** The intermediate milestones, as percentages of the article's block count. Reported as the `percent`
 *  dimension, which is the one place this schema keeps the shape the original proposal asked for. */
const MILESTONE_PERCENTS = [25, 50, 75] as const;

export function useArticleProgress({
  container,
  slug,
  articleKey,
  body,
}: {
  /** The element whose CHILDREN are the rendered markdown blocks — `ArticlePage`'s existing prose
   *  wrapper. Its last child is the article's last block; the document continues past it. */
  container: RefObject<HTMLElement>;
  /** The LOCALIZED slug. This is the value GA4 receives and it is immutable (ADR-0051). */
  slug: string;
  /**
   * The article's LOCALE-INDEPENDENT identity, used only to key the once-per-session markers and
   * never emitted. Pass the EN edition's slug — by ADR-0037's convention that is the article's KEY.
   * Falling back to `slug` is safe but weaker: the guard then stops matching across a locale toggle.
   */
  articleKey: string;
  body: string;
}): void {
  const { locale } = useLocale();
  const { status } = useConsent();
  const floor = useMemo(() => dwellFloorMs(body), [body]);

  useEffect(() => {
    const node = container.current;
    // Guarded rather than assumed: jsdom has no IntersectionObserver, and neither does the prerender's
    // snapshot pass in any way this module should depend on.
    if (!node || typeof IntersectionObserver === 'undefined') return;
    // THE OBSERVER DOES NOT EXIST UNTIL THE READER HAS CONSENTED, and this is the one place in the
    // slice where the consent gate had to move UPSTREAM of the emitter rather than sit inside it.
    //
    // The milestones are one-shot: a block that has intersected is unobserved and never reported again.
    // Observing from mount therefore CONSUMES every milestone already on screen while the banner is
    // still up — silently, since `trackEvent` no-ops — so a reader who accepts a moment later has
    // already spent the preconditions the terminal event depends on. Measured on the built site, that
    // is not an edge case: the first screenful of a short article covers all three milestones, and the
    // article emitted nothing at all for the whole visit.
    //
    // Starting the observer at the grant makes IntersectionObserver deliver its initial callback for
    // whatever is on screen AT THAT MOMENT, which is the earliest state this site is permitted to know.
    // It also restarts the dwell clock at the grant — conservative in the right direction: a reader who
    // accepts on the last paragraph gets a fresh floor and is not counted as having read.
    if (status !== 'granted') return;

    const blocks = Array.from(node.children);
    if (blocks.length === 0) return;
    const last = blocks[blocks.length - 1];

    // Milestone element → percent. Built from the block index rather than from pixel offsets, so it
    // does not have to be recomputed when an image loads or the viewport changes. `last` is excluded
    // even when the article is short enough for a milestone index to land on it — the terminal event is
    // not allowed to be its own precondition.
    const milestones = new Map<Element, number>();
    for (const percent of MILESTONE_PERCENTS) {
      const el = blocks[Math.floor(((blocks.length - 1) * percent) / 100)];
      if (el && el !== last && !milestones.has(el)) milestones.set(el, percent);
    }

    // THE PRECONDITION IS THE DEEPEST MILESTONE, NOT "ANY MILESTONE", and the difference is the whole
    // strength of the discriminator (#597).
    //
    // "At least one intermediate event" reads like enough and is not: on a real article at 1280×720 the
    // FIRST SCREENFUL already contains the 25% block, so that milestone fires at load and the condition
    // is satisfied before the reader has done anything at all. Measured on the built site — an End-key
    // leap emitted `article_end_reached`, which is the exact journey this condition exists to reject.
    //
    // The 75% block is never in the first viewport of an article long enough to scroll, so requiring it
    // means the reader passed through the body. On a piece so short that everything is visible at once
    // there are no milestones to require and the dwell floor is the only guard left — correct, because
    // on such a page there is nothing to leap over.
    //
    // THE BIGGER CEILING, and it is the one that decides how much this condition is worth on THIS site:
    // `styles/index.css` sets `html { scroll-behavior: smooth }` for every reader who has not asked for
    // reduced motion. So an End press ANIMATES to the bottom, every block genuinely passes through the
    // viewport, and all three milestones fire — there is no leap for an observer to miss, because the
    // browser did not leap. Measured on the built site, on the longest article here. Under
    // `prefers-reduced-motion: reduce` the same stylesheet resets `scroll-behavior: auto`, the jump is
    // instant, and the condition does exactly what it was built for.
    //
    // Read that plainly: for most readers of this site the DWELL FLOOR is what separates a scroll-past
    // from a read, and this condition is a narrow second guard. It is kept because it costs one `Set`
    // lookup and it is the only thing covering the reduced-motion reader — not because it is doing the
    // work the naive reading suggests.
    //
    // THE SMALLER CEILING, measured the same way: on an article under about two viewports tall the
    // condition stops discriminating at all, because the first screen holds the 25% block and the last
    // screen holds the 75% one — so an End press has genuinely put every block on screen. This site's
    // shortest article is one of those, and the E2E leap case therefore runs against its longest. On a
    // short piece the dwell floor is the whole guard, and that is the honest state rather than a gap:
    // there is no leap to detect when the reader can see everything from two positions.
    const required = milestones.size === 0 ? null : Math.max(...milestones.values());

    const progressKey = (percent: number) => onceKey('article_progress', articleKey, percent);
    const endReachedKey = onceKey('article_end_reached', articleKey);

    const openedAt = Date.now();
    // SEEDED FROM THE SESSION, not empty, and the seeding is what keeps the repair from breaking the
    // discriminator it sits next to. `sent` is two things at once: the "do not emit again" set AND the
    // precondition `maybeEnd` tests (`sent.has(required)`). Starting it empty after a rebuild would
    // suppress the re-emission and ALSO make the terminal event permanently ineligible for a reader who
    // had already passed the deepest milestone — a silent loss, which is the worse of the two errors.
    const sent = new Set<number>(MILESTONE_PERCENTS.filter((percent) => firedThisSession(progressKey(percent))));
    let lastVisible = false;
    let endSent = firedThisSession(endReachedKey);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const maybeEnd = () => {
      if (endSent || !lastVisible) return;
      if (required !== null && !sent.has(required)) return;
      const remaining = floor - (Date.now() - openedAt);
      if (remaining > 0) {
        // The end is on screen but the reader got here too fast to have read it. Re-check when the
        // floor elapses rather than dropping the reader: on a short article the whole prose can be
        // visible at load, so the intersection that would re-trigger this never comes. The re-check
        // requires the end to STILL be visible, so a reader who scrolled past and left is not counted.
        timer ??= setTimeout(() => {
          timer = undefined;
          maybeEnd();
        }, remaining);
        return;
      }
      endSent = true;
      // MARKED ONLY IF IT SHIPPED — see `lib/analytics`'s `trackEvent` for why the return value exists.
      // `endSent` is set either way, because that flag bounds THIS observer; the session marker is what
      // bounds the visit, and spending it on a hit a withdrawn reader never sent would lose the event
      // for good on a later re-grant.
      if (trackArticleEndReached({ locale, slug })) markFiredThisSession(endReachedKey);
      observer.unobserve(last);
    };

    const observer = new IntersectionObserver((entries) => {
      // TWO PASSES, and the order is load-bearing. `entries` is not guaranteed to be in document order,
      // so on a short article — where a milestone and the last block first intersect in the SAME batch
      // — a single pass would evaluate the terminal event before `progressSeen` had been set by its own
      // precondition, and the article would be permanently ineligible.
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const percent = milestones.get(entry.target);
        if (percent === undefined || sent.has(percent)) continue;
        sent.add(percent);
        if (trackArticleProgress({ locale, slug, percent })) markFiredThisSession(progressKey(percent));
        observer.unobserve(entry.target);
      }
      for (const entry of entries) {
        if (entry.target !== last) continue;
        lastVisible = entry.isIntersecting;
      }
      maybeEnd();
    });

    // Already-spent milestones are not observed at all. Filtering inside the callback would work too and
    // would be a filter rather than a guard — an observer with nothing left to report should not exist.
    for (const [el, percent] of milestones) if (!sent.has(percent)) observer.observe(el);
    if (!endSent) observer.observe(last);

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      observer.disconnect();
    };
    // `slug` is in the deps because navigating between two articles remounts nothing above this hook:
    // the counters, the clock and the observed nodes all have to start again for the new piece.
    // `articleKey` is in them for the same reason and changes with `slug` in every case but the locale
    // toggle — which is exactly the case the session markers, seeded above, now carry across.
  }, [container, slug, articleKey, floor, locale, status]);
}
