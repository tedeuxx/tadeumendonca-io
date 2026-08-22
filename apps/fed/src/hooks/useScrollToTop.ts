// Scroll behaviour on route change. Client-side routing swaps the tree without touching the
// scroll offset, so before this hook existed, clicking an article card halfway down the landing
// opened the article at that same offset — mid-paragraph, never at the title. Nothing in the app
// handled scroll at all (`grep -rn 'scrollTo\|ScrollRestoration\|scrollIntoView' src` → 0 matches).
//
// WHY A HOOK AND NOT `<ScrollRestoration />`. React Router ships that component, and it is not
// available here: it is a data-router API, and `App.tsx` mounts a plain `<BrowserRouter>` with
// `<Routes>`. Rendered under a non-data router it throws rather than silently doing nothing, but
// either way it is not the fix — this is.
//
// THREE BRANCHES, and the order between them is the whole design:
//
// 1. POP (back / forward) — DO NOTHING. A reader who opens an article and presses back expects to
//    return to the row they were looking at, not to the top of a list they already scrolled once.
//    `history.scrollRestoration` defaults to 'auto', so the browser restores that offset itself;
//    the only thing this hook has to do is stay out of its way. This is the branch a naive
//    scroll-to-top-on-every-navigation gets wrong, and it is invisible in a forward-only test.
//    (It restores reliably here because every page renders synchronously — posts come from
//    markdown compiled into the bundle, so the document is its full height on first paint. A page
//    that fetched its body would need its own restore, which is a different fix than this one.)
//
// 2. A hash target — SCROLL TO IT, never to the top. `/blog` → `/#artigos` is a live redirect
//    (App.tsx) and `RootRedirect` preserves the hash when it re-prefixes an unprefixed URL, so a
//    router navigation carrying a hash is a real, shipped path. A blanket scroll-to-top would
//    fight it and leave the reader at the hero. Left at the default `behavior`, so it inherits the
//    `html { scroll-behavior: smooth }` in styles/index.css — an anchor jump animating is what the
//    landing's own `<a href="#artigos">` nav already does, and the two must not disagree.
//
//    The landing's `<a href="/pt/#artigos">` nav links are NOT this branch: they are plain anchors,
//    so a same-document hash click is handled by the browser and never reaches the router at all.
//
// 3. Everything else (PUSH / REPLACE) — top, INSTANTLY. `behavior: 'instant'` is load-bearing and
//    not a synonym for the default: the default 'auto' resolves to the CSS `scroll-behavior`, which
//    is `smooth` here, so omitting it makes every route change animate the whole page upward before
//    settling. A route change is not an anchor jump; it should be already-there on first paint.
//
// HYDRATION. The prerendered pages hydrate at navigation type POP (the initial entry always is), so
// branch 1 returns early and this hook performs no scroll during hydration — a reader arriving
// straight at an article URL sees no jump on first paint. The redirects that DO run at load
// (`RootRedirect`, the superseded-slug `<Navigate>`) are REPLACEs onto a document already at the
// top, so their scroll-to-top is a no-op in practice.
import { useEffect } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom';

export function useScrollToTop(): void {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  // Keyed on pathname + hash + navigation type — the three things that describe WHICH navigation
  // this is. Not on the `location` object, which is a fresh identity on every render and would fire
  // this on re-renders that navigated nowhere.
  useEffect(() => {
    if (navigationType === NavigationType.Pop) return;

    if (hash) {
      // Decoded because a hash is percent-encoded in the URL but the `id` attribute is not.
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView();
        return;
      }
      // A hash naming nothing on the page falls through to the top: the reader is being shown the
      // page from its start, which is where it is rendering anyway.
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, navigationType]);
}
