// The identity of the committed held-draft fixture (#510), in one place.
//
// `src/content/blog/held-draft-fixture.{pt,en}.md` is a permanent, deliberately HELD pair: it is what the
// unit suite, the build-time script suites and the E2E journeys all assert against, so the mechanism is
// proved against the real content pipeline rather than a synthetic double.
//
// Named here rather than re-typed in six test files for one reason that has already cost this repo: a
// string spelled independently in several places is a string that can be corrected in five of them. If
// the fixture's slug were edited and one suite kept the old spelling, that suite would assert "the held
// article is absent" about an article that does not exist — permanently green, permanently vacuous, and
// indistinguishable from a working check.
//
// NOT imported by any application module, and it must stay that way: it is test identity, not content.
// The app reads the fixture through the same glob it reads every article through.

/** The article KEY — the filename base that pairs the two editions. */
export const HELD_KEY = 'held-draft-fixture';

/** The per-locale slugs (ADR-0037), i.e. the URLs the two held editions answer at. */
export const HELD_SLUGS = { en: 'held-draft-fixture', pt: 'rascunho-retido-fixture' } as const;

/**
 * The review Issue the fixture names in its frontmatter (#506), and the reason it is here rather than
 * re-typed in the specs: the same argument the slugs and the nonces are here for. A number spelled
 * independently in two suites is a number that can be corrected in one of them, and the assertion left
 * behind would check a link against an Issue the fixture no longer names — green, and about nothing.
 *
 * It is #510's number, not #506's: the fixture exists BECAUSE of the held-draft mechanism, so the Issue
 * that would carry its review is the one that created it. Nothing depends on which number it is; the
 * suites assert the built URL agrees with the frontmatter.
 */
export const HELD_CONTENT_ISSUE = 510;

/**
 * The per-locale nonce carried in each edition's body.
 *
 * A nonce rather than a phrase from the prose: the assertions are "this string appears zero times in the
 * index / the feed / the served page", and a phrase that also occurs in the chrome or in another article
 * would make a zero-count assertion pass for the wrong reason.
 */
export const HELD_NONCES = { en: 'HELDNONCE-EN-4f7a1c92', pt: 'HELDNONCE-PT-4f7a1c92' } as const;
