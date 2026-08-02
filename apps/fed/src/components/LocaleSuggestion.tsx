// "This page is in English — would you rather read it in Portuguese?" (#172)
//
// Per-locale URLs made the path authoritative (ADR-0036), so a shared link pins the language of whoever
// shared it. This OFFERS the reader their own edition without ever taking the decision from them: no
// auto-redirect, dismissible, and remembered so it never nags. The sharer's link keeps working exactly
// as sent.
//
// It must not enter the PRERENDER, and the gate for that is `isPrerender()`, not the mount flag.
//
// `scripts/prerender.mjs` snapshots every route in an en-US browser, so on a `/pt` route the snapshot
// browser looks like an English speaker: every render condition holds and the offer bakes into the
// served Portuguese HTML, suggesting English to every pt reader until hydration removes it.
//
// The obvious fix — render client-only behind a post-mount flag — does NOT work here, and this was
// measured rather than reasoned: the first implementation used exactly that, and the offer was still in
// `dist/pt/**`. This prerender snapshots a LIVE, already-hydrated page, so effects have run and
// `mounted` is true by the time `page.content()` is called. The signal has to be about WHO is rendering,
// not WHEN — hence the flag the snapshot browser sets on itself.
//
// The mount flag is kept anyway, for a different reason: it makes the offer decide against a real
// `navigator`, never a value read during the initial synchronous render.
//
// ConsentBanner needs none of this, but NOT for the reason it is tempting to give: `analyticsConfigured()`
// is TRUE in every shipped build (build:static and both workflows set a measurement id), so the consent
// bar IS baked into the snapshot — `dist/pt/index.html` contains it. It is exempt because it is the same
// for every visitor: consent starts undecided for everyone, and the bar renders in the ROUTE's locale.
// That is the general exemption — "identical for every visitor" — not "it happens not to render".
// `e2e/per-locale.spec.ts` asserts the prerendered HTML stays clean, because this failure is invisible
// in dev and visible only in the shipped artifact.
import { useEffect, useState } from 'react';
import { useLocale } from '../i18n';
import { htmlLang, isLocale } from '../i18n/config';
import { translate } from '../i18n/messages';
import { browserLocale, isPrerender, localeToOffer, readSuggestionState, storeChoice, storeDismissal } from '../lib/localeSuggestion';

const buttonBase = 'px-4 py-2 font-mono text-xs uppercase tracking-[0.12em]';

export function LocaleSuggestion() {
  const { locale, setLocale } = useLocale();
  // Post-mount only — see the prerender note above. `mounted` also means the offer is decided against a
  // REAL navigator, never the snapshot's.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || dismissed || isPrerender()) return null;

  const persisted = readSuggestionState();
  const offer = localeToOffer({
    pathLocale: locale,
    visitorLocale: browserLocale(),
    ...persisted,
  });
  if (!offer) return null;

  // "Continue in Portuguese" is an affirmative statement of preference, not just a way to close the
  // notice — so it PERSISTS the locale the reader is choosing to stay in, alongside the dismissal.
  //
  // Writing only the dismissal was #323, and it is worse than losing a preference: it also silenced the
  // one control that would have asked again. A reader who answered here had stated a language, the site
  // stored nothing, and the next open at the bare root fell through to `navigator.language` — the other
  // edition, permanently. Reported as "it doesn't keep the preference", which is exactly right.
  //
  // Both keys, and they are not redundant. The CHOICE stops `localeToOffer` on this locale (its third
  // silence) and drives the bare-root default. The DISMISSAL covers the other locale, so a later shared
  // link in the language they just declined does not re-ask. That asymmetry with `accept` — which
  // deliberately writes no dismissal, see below — is the whole shape: declining is durable, accepting
  // leaves the feature alive.
  //
  // BUT IT FILLS A GAP AND NEVER OVERWRITES (#333, owner decision). The two controls are not the same
  // kind of act even though both end in a locale:
  //
  //   · the TOGGLE is a decision about the reader's own preference — nothing prompted it, they went
  //     looking for the control;
  //   · the DISMISSAL answers a question the site asked, about the page they are on. "Continue in
  //     Portuguese" means *this page is fine*, a statement about the current visit rather than a
  //     re-declaration of a standing preference.
  //
  // Treating them as equal let an incidental shared link overwrite a deliberate setting — toggle to EN,
  // later open a `/pt` link, answer the offer, and the stored choice silently flipped to `pt`. That is
  // the same class as #323 itself: the site behaving as though the reader had said something they did
  // not say. Found by `security` reviewing the fix for #323, which is the shape a good gate has.
  const dismiss = () => {
    if (!isLocale(persisted.storedChoice)) storeChoice(locale);
    storeDismissal();
    setDismissed(true);
  };

  // `lang` is the region's own, not the page's: the text is in the SUGGESTED language, so without it a
  // screen reader pronounces Portuguese with an English voice, or the reverse.
  // No positioning of its own either — AppShell's bottom stack orders it above the consent bar, so the
  // two never overlap and dismissing either reflows the other with no height arithmetic.
  return (
    <div
      role="region"
      data-print="hide"
      lang={htmlLang(offer)}
      aria-label={translate(offer, 'localeSuggestion.notice')}
      className="border-t-2 border-border-strong bg-background px-[--gutter] py-4"
    >
      <div className="mx-auto flex w-full max-w-screen flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">{translate(offer, 'localeSuggestion.message')}</p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={dismiss} className={`${buttonBase} border border-border text-foreground invert-hover`}>
            {translate(offer, 'localeSuggestion.dismiss')}
          </button>
          <button
            type="button"
            // Persist the choice through the same store the toggle uses, so it overrides detection from
            // here on. Deliberately does NOT write the dismissal key: that key means "declined", and
            // writing it here would permanently retire the feature for a reader who ACCEPTED it — the
            // next shared wrong-language link would put them back where #172 found them. Nothing needs
            // it: on the new edition the visitor's language and the path's now agree, which is
            // `localeToOffer`'s first and cheapest silence. `setDismissed` only covers the render
            // between the click and the navigation.
            onClick={() => {
              setDismissed(true);
              setLocale(offer);
            }}
            className={`${buttonBase} bg-primary text-primary-foreground hover:opacity-90`}
          >
            {translate(offer, 'localeSuggestion.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
