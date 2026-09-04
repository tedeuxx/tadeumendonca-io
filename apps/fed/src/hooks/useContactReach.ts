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
// IT INTRODUCES NO DOM NODE — the ref goes on the `<footer id="contato">` `ContactFooter` already
// renders, which is also the element the nav anchors at, so the thing observed and the thing linked are
// the same object by construction.
import { useEffect, type RefObject } from 'react';
import { useLocale } from '../i18n';
import { useConsent } from '../lib/consent';
import { trackContactReach } from '../lib/analytics';

export function useContactReach(section: RefObject<HTMLElement>): void {
  const { locale } = useLocale();
  const { status } = useConsent();

  useEffect(() => {
    const node = section.current;
    // Guarded rather than assumed: jsdom has no IntersectionObserver, and neither does the prerender's
    // snapshot pass in any way this module should depend on.
    if (!node || typeof IntersectionObserver === 'undefined') return;
    if (status !== 'granted') return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      trackContactReach({ locale });
      // ONE PER MOUNT. Disconnecting rather than keeping a boolean is what makes that true even if the
      // callback is invoked again in the same batch, and it costs nothing — there is nothing else to
      // observe.
      observer.disconnect();
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [section, locale, status]);
}
