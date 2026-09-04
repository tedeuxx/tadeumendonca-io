// `contact_reach` — the CAREER funnel's middle (#597).
//
// The funnel was `page_view → contact_click` with nothing between, so a reader who never scrolled far
// enough to see the contact section and a reader who saw it and did not click were the same row. They
// are different failures and they have different fixes, which is the whole reason this stage is worth a
// registration slot.
//
// WHAT IT OBSERVES: the landing's `#contato` section intersected the viewport. Not that it was read.
// There is no dwell floor, unlike `article_end_reached`, and that is a decision rather than an
// omission — a floor there separates a scroll-past from a read of PROSE, and this section is a heading
// and five chips that are legible at a glance. A time condition here would measure hesitation, which is
// a different event with a different name.
//
// THE OBSERVER IS CREATED AT THE GRANT, NOT AT MOUNT, and this is slice A's first finding applied
// before it could recur rather than after. The event is one-shot: the observer disconnects on the first
// intersection. An observer started at mount, while the consent banner is still up, therefore CONSUMES
// that one shot silently — `trackEvent` no-ops, the observer disconnects, and a reader who accepts a
// moment later can never emit it for the rest of the visit. Starting at the grant makes
// IntersectionObserver deliver its initial callback for whatever is on screen AT THAT MOMENT, which is
// the earliest state this site is permitted to know anything about.
//
// A CONSEQUENCE OF THAT, STATED SO IT IS NOT MISREAD AS A DEFECT: a reader who accepts while the contact
// section is already on screen emits `contact_reach` immediately. That is correct — they have reached
// it — and it is why the E2E asserts the event is ABSENT at the top of the landing rather than merely
// present at the bottom. The absent-at-the-top assertion is what would catch the other shape of this
// bug: an observer pointed at an element one level too high (the page wrapper rather than the section),
// which is on screen from the first pixel and would make every visit a reach. Slice A shipped exactly
// that defect on a different element and it was invisible until the assertion existed.
//
// ONE PER SESSION, AND THE GUARD CANNOT LIVE IN THIS EFFECT — the repair of the defect PR #602's gate
// measured, and the reason it is a module rather than a boolean here.
//
// ~~ONE PER MOUNT~~ was the shipped behaviour and it is not what ADR-0051 published (*once per visit*).
// `observer.disconnect()` scopes the one-shot to the OBSERVER, and this effect rebuilds its observer on
// every change of `locale` or `status`. A fresh `IntersectionObserver` delivers an initial callback for
// whatever is already on screen, so the shot was re-armed and fired again. Measured in a real browser
// on the built site: a PT/EN toggle with `#contato` on screen emitted twice (`locale: en`, then
// `locale: pt`, `scrollY` unchanged at 2967), and a consent re-grant emitted twice with IDENTICAL
// parameters — no dimension separating the duplicate from a genuine second reach.
//
// Owner's ruling, 2026-09-04: «Uma vez por sessão», with `sessionStorage`. The code moves to the
// record's promise rather than the record retreating to the code, because a funnel terminal's numerator
// must be sessions when its denominator is. Cost, stated: a reader who returns later in the same
// session does not re-count. See `lib/sessionOnce` for why the marker is not a module-level `Set` — one
// of this event's own journeys crosses a full document load.
//
// IT INTRODUCES NO DOM NODE — the ref goes on the `<footer id="contato">` `ContactFooter` already
// renders, which is also the element the nav anchors at, so the thing observed and the thing linked are
// the same object by construction.
import { useEffect, type RefObject } from 'react';
import { useLocale } from '../i18n';
import { useConsent } from '../lib/consent';
import { trackContactReach } from '../lib/analytics';
import { firedThisSession, markFiredThisSession, onceKey } from '../lib/sessionOnce';

/** The event carries no `slug` and the section exists on the landing alone, so the marker needs no
 *  discriminator — there is exactly one `contact_reach` per session to record. */
const REACH_KEY = onceKey('contact_reach');

export function useContactReach(section: RefObject<HTMLElement>): void {
  const { locale } = useLocale();
  const { status } = useConsent();

  useEffect(() => {
    const node = section.current;
    // Guarded rather than assumed: jsdom has no IntersectionObserver, and neither does the prerender's
    // snapshot pass in any way this module should depend on.
    if (!node || typeof IntersectionObserver === 'undefined') return;
    if (status !== 'granted') return;
    // Checked BEFORE the observer is built, not inside its callback: once the session has its row there
    // is nothing left for an observer to do, and not creating it is the difference between a guard and a
    // filter.
    if (firedThisSession(REACH_KEY)) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      // MARKED ONLY IF IT SHIPPED. `trackContactReach` returns false when consent was withdrawn between
      // this observer's creation and this callback — marking there would spend the session's one shot on
      // a hit GA4 never received, and a later re-grant could never produce it.
      if (trackContactReach({ locale })) markFiredThisSession(REACH_KEY);
      // Disconnecting rather than keeping a boolean is what makes the shot single even if the callback
      // is invoked again in the same batch, and it costs nothing — there is nothing else to observe. It
      // bounds THIS observer; the session marker above is what bounds the visit.
      observer.disconnect();
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [section, locale, status]);
}
