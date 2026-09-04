// `contact_click` — the CAREER funnel's terminal event (#597).
//
// ONE DELEGATED LISTENER, on the shell's own root element, rather than an `onClick` on each contact
// anchor. The channels render from a single list (`contactChannels.ts`) but through TWO components
// (`ContactLinks`, the "where to find me" directory, and `ContactFooter`, the reader-first CTA), and
// the landing renders one of them in two places. Per-anchor handlers would be four call sites for one
// event, and the fifth surface that renders the list next would be the one that forgets.
//
// IT INTRODUCES NO DOM NODE. The listener attaches to an element `AppShell` already renders, which is
// the constraint the prerender imposes: `scripts/prerender.mjs` serialises the DOM via `page.content()`
// — listeners are not DOM and never reach the snapshot, but a new sentinel `<div>` or wrapper WOULD
// change the served bytes and can move `page-heading-measure.spec.ts` and `responsive-overflow.spec.ts`.
//
// WHY A REF AND NOT `document`: a listener on `document` would also catch clicks in anything rendered
// outside this tree. Nothing does today; the ref keeps that true by construction rather than by
// nobody having done it yet.
import { useEffect, type RefObject } from 'react';
import { useLocale } from '../i18n';
import { trackContactClick } from '../lib/analytics';
import { CONTACT_TARGET_BY_HREF } from '../components/contactChannels';

export function useContactClicks(root: RefObject<HTMLElement>): void {
  const { locale } = useLocale();

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const onClick = (event: MouseEvent) => {
      // `closest`, not `event.target`: every contact link wraps an icon and a label, so the actual
      // target is almost always the <span> or the <svg> inside the anchor, never the anchor itself.
      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;
      // `getAttribute`, not `.href`: the map is keyed on the literal strings `contactChannels.ts`
      // declares, and the attribute is that same literal, so this compares like for like. The `.href`
      // PROPERTY resolves against the document base and may normalise percent-encoding — a difference
      // an exact-match rule cannot absorb, and the one channel carrying an encoded query is WhatsApp.
      //
      // MEASURED, and recorded because it is the opposite of what a comment here would normally imply:
      // swapping in `anchor.href` leaves the whole suite GREEN. The two spellings do not differ on any
      // channel this site has today. Read this as the spelling that cannot go wrong rather than as a
      // defect the tests would catch — nothing here discriminates them, and a future channel with a
      // relative or unusually encoded href is where the difference would first appear.
      const href = anchor.getAttribute('href');
      if (!href) return;
      const target = CONTACT_TARGET_BY_HREF.get(href);
      // Not a contact channel — a share deeplink, a nav item, an in-article link. Those are slice B's
      // `outbound_click` and `nav_click`, and emitting a half-classified event here in the meantime
      // would put two populations under one name, which is the one thing this schema may not do.
      if (target === undefined) return;
      trackContactClick({ locale, target });
    };

    node.addEventListener('click', onClick);
    return () => node.removeEventListener('click', onClick);
  }, [root, locale]);
}
