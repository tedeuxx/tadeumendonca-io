// Articles section (#artigos) — the landing's main pane and the reason the site exists. Each row is
// reader-first: what the piece is, and what you walk away knowing ("Você sai sabendo …").
//
// The track filter (Tudo / Vida pessoal / Engenharia) is LOCAL state on purpose: the section lives
// on the landing, so filtering must never rewrite the canonical URL the prerender snapshots.
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAllPosts, type BlogPost, type Track } from '../lib/content';
import { Empty } from './Column';
import { dateLocale, useLocale, useLocalePath, useT, type Locale, type MessageKey } from '../i18n';

const fmtDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(dateLocale(locale), { year: 'numeric', month: 'short', day: 'numeric' });

// Filter values map to catalog keys; 'all' is a virtual filter, the two real ones are the Track chips.
const FILTERS: { value: Track | 'all'; labelKey: MessageKey }[] = [
  { value: 'all', labelKey: 'articles.filterAll' },
  { value: 'pessoal', labelKey: 'tracks.pessoal' },
  { value: 'engenharia', labelKey: 'tracks.engenharia' },
];

const TRACK_KEY: Record<Track, MessageKey> = { pessoal: 'tracks.pessoal', engenharia: 'tracks.engenharia' };

// THE VISUAL ANATOMY OF A ROW IN THIS LIST, extracted as constants rather than left inline, because one
// row is no longer an article: `ArchitectureCard` below reuses every one of these. The owner's ask was a
// card "como esse de post do blog" — visually identical — and the only way that survives a future
// restyle is if there is ONE source for the classes. Two copies drift silently and the drift is exactly
// what would break the ask.
const ROW = 'border-b border-border px-[--gutter] py-6';
const ROW_META =
  'mb-2 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground';
const ROW_TITLE =
  'text-[clamp(1.4rem,2.6vw,2.1rem)] font-bold leading-tight tracking-[-0.025em] transition-colors hover:text-primary';
const ROW_PROSE = 'mt-2 max-w-prose leading-relaxed text-foreground/80';
const ROW_CONTROLS = 'mt-4 flex flex-wrap';
const ROW_CONTROL = '-mr-px border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider invert-hover';
// The chip's neutral treatment — the `engenharia` variant of TrackChip, which is also what the teaser
// card's slot renders. `pessoal` inverts to the accent fill and stays private to TrackChip.
const CHIP = 'border border-border px-1.5 py-px font-mono text-muted-foreground';

function TrackChip({ track }: { track: Track }) {
  const t = useT();
  return (
    <span className={track === 'pessoal' ? 'border border-primary bg-primary px-1.5 py-px font-mono text-primary-foreground' : CHIP}>
      {t(TRACK_KEY[track])}
    </span>
  );
}

/**
 * WHEN `/architecture` WAS PUBLISHED — the one place this date exists, because two places is how the
 * card's rendered date and its position in the list start disagreeing.
 *
 * SOURCED, NOT INVENTED. `docs/adr/0010-routing-landing-cv-split-redirects.md` carries the amendment
 * that made this surface public: *"## Amendment (2026-07-25) — `/architecture`, a fifth public surface"*,
 * whose first line is "`/architecture` joins `/`, `/me`, `/portfolio` and `/ramp-up` as a real route with
 * a nav entry". Git cannot answer this question: the repo's history begins at b2b59bc (2026-07-31), a
 * single commit that adds the whole tree with `content/architecture.en.md` already in it, so every
 * `git log --diff-filter=A` on this page reports the history reset rather than the publication.
 *
 * THE TIME OF DAY IS 12:00Z AND THAT IS LOAD-BEARING, not padding to match the ISO shape. `fmtDate`
 * below renders through `toLocaleDateString` in the READER'S timezone, so `T00:00:00Z` prints as
 * 2026-07-24 to everyone west of Greenwich — including the owner, at UTC-3. Midday UTC is not safe in
 * EVERY zone (UTC+14 would need an hour below 10, UTC-12 an hour at or above 12 — contradictory), it is
 * the maximal-margin choice: the same calendar day from UTC-12 through UTC+11, which covers both
 * editions' readerships. `the-problem-stopped-changing` is authored `T12:00:00.000Z` for the same reason.
 */
export const ARCHITECTURE_PUBLISHED = '2026-07-25T12:00:00.000Z';

// THE /architecture TEASER CARD (#450, slice 2) — a row in this list, sorted among the articles by
// `ARCHITECTURE_PUBLISHED` above, outside the track filter, and visually an article card. It replaces the
// `ArchitectureBand` shipped in #461, which the owner rejected on sight: "você descaracterizou a home".
// The band was a new <section> between the Hero and this grid, and the objection was to the OBJECT, not
// to its words — the landing's shape is the article list, and a band above it is a different landing.
// What he asked for instead: "eu queria que fosse um item como esse de post do blog o teaser para a seção
// arquitetura … deveria ser como artigo, mas não é um artigo pois quero direcionar direto pra seção
// arquitetura."
//
// WHAT THIS REPLACED — THE PIN, REVERSED ON THE OWNER'S REQUEST. Until this slice the card was rendered
// before `posts.map` and was permanently the first row, and the comment here documented that as the
// intended behaviour. It is not: "na home o post da arquitetura tá pinado, não era o comportamento
// esperado. queria que ele seguisse a ordem cronológica decrescente normal dos artigos, como se fosse
// um." Asked which date it should sort by, he chose the date the SECTION was published — hence the
// constant above, and hence divergence 3 below inverting. The reasoning that argued for the pin is kept
// rather than deleted, because it is what a later reader would otherwise re-derive and re-apply:
// the card was pinned so a teaser would not sit below a list the reader has to scroll first. That cost
// is real and is now accepted deliberately — the row is third of three (below both published articles),
// and the owner's instruction is that it takes its chronological place like anything else.
//
// IT LIVES HERE, NOT IN ITS OWN FILE, and that is the whole reason it can keep its promise: it renders
// from the same class constants `ArticleRow` does, a few lines away, where a divergence is visible in one
// screen. In a sibling file "visually identical" would be a claim maintained by memory.
//
// IT IS STILL OUTSIDE THE FILTER, and the un-pin did not touch that: it is rendered from no element of
// `posts`, so no chip state can remove it — including a chip that matches zero articles. The chips are a
// taxonomy over WRITING, and this card is not writing; filtering it by track would be the same untruth
// the chip slot below exists to prevent. Sorting and filtering are different questions, and the owner
// reversed one of them. What changed is only WHERE among the rows it renders.
//
// THE DIVERGENCES FROM AN ARTICLE ROW, each one a thing that would otherwise be false — two kept, one
// reversed:
//   1. KEPT. The chip slot renders `architecture.cardTrack` ("Seção do site" / "Site section") instead of
//      a track. Same slot, same treatment — a reader scanning this column reads that slot as "what kind
//      of writing is this", and the answer has to be "it isn't", said before the click. The un-pin makes
//      this MORE load-bearing, not less: position was the second signal that this row was not an article,
//      and position is now gone. "Como se fosse um" was an instruction about ORDER; a chip reading
//      "Engenharia" on a row that opens a section would be an untruth, and reversing a lie is not what
//      was asked for.
//   2. KEPT, same argument. The control renders `nav.architecture`, never `articles.read`. "Ler artigo"
//      on a control that opens a section states something the click does not do, and that untruth is why
//      reusing the row unchanged was rejected. No new key was authored for it: a NOUN control among verb
//      controls is itself the "not writing" signal, in the last place a reader looks — and #315's
//      one-word-per-destination rule already publishes the word.
//   3. REVERSED (the <time> half). The card now renders its publication date in the same slot, the same
//      element and the same format an article row does. The old argument was that both candidate dates
//      were wrong — "when the page last changed" makes permanent furniture read as dated, and anything
//      else is invented. The second half no longer holds: the publication date is neither of those, it is
//      recorded in ADR-0010, and it is the value this row is now SORTED by. A row that takes a
//      chronological position and shows no date is worse than a pin — the reader is given an order with
//      its key hidden.
//      STILL NO #tag: that is the article taxonomy, and would say "filed among the writing" one slot
//      after the chip said the opposite. The tag was never the sort key and nothing about the un-pin
//      touches it.
//
// AND NO TAKEAWAY LINE. `articles.takeaway` ("Você sai sabendo") is left empty rather than filled with a
// fifth string: the excerpt's second sentence already carries the payoff, and a fourth leaf saying it
// again reads as a card unsure it landed.
export function ArchitectureCard() {
  const { locale, t } = useLocale();
  const lp = useLocalePath();
  const to = lp('/architecture');

  return (
    <article data-testid="architecture-card" className={ROW}>
      <div className={ROW_META}>
        <time dateTime={ARCHITECTURE_PUBLISHED}>{fmtDate(ARCHITECTURE_PUBLISHED, locale)}</time>
        <span>·</span>
        <span className={CHIP}>{t('architecture.cardTrack')}</span>
      </div>

      <RouterLink to={to} className="block">
        <h3 className={ROW_TITLE}>{t('architecture.cardTitle')}</h3>
      </RouterLink>

      <p className={ROW_PROSE}>{t('architecture.cardExcerpt')}</p>

      <div className={ROW_CONTROLS}>
        <RouterLink to={to} className={ROW_CONTROL}>
          {t('nav.architecture')}
        </RouterLink>
      </div>
    </article>
  );
}

function ArticleRow({ post }: { post: BlogPost }) {
  const { locale, t } = useLocale();
  const lp = useLocalePath();
  return (
    <article className={ROW}>
      <div className={ROW_META}>
        <time dateTime={post.date}>{fmtDate(post.date, locale)}</time>
        {post.tag && <span>· #{post.tag}</span>}
        <span>·</span>
        <TrackChip track={post.track} />
      </div>

      <RouterLink to={lp(`/blog/${post.slug}`)} className="block">
        <h3 className={ROW_TITLE}>{post.title}</h3>
      </RouterLink>

      {post.excerpt && <p className={ROW_PROSE}>{post.excerpt}</p>}

      {post.takeaway && (
        <p className={ROW_PROSE}>
          <span className="mr-2 font-mono text-[0.64rem] uppercase tracking-[0.1em] text-primary">{t('articles.takeaway')}</span>
          {post.takeaway}
        </p>
      )}

      {post.hasVideo && (
        <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">{t('articles.hasVideo')}</p>
      )}

      <div className={ROW_CONTROLS}>
        <RouterLink to={lp(`/blog/${post.slug}`)} className={ROW_CONTROL}>
          {t('articles.read')}
        </RouterLink>
        {post.linkedinUrl && (
          <a href={post.linkedinUrl} target="_blank" rel="noreferrer" className={ROW_CONTROL}>
            {t('articles.viewOnLinkedin')}
          </a>
        )}
      </div>
    </article>
  );
}

export function ArticlesSection() {
  const { locale, t } = useLocale();
  const [track, setTrack] = useState<Track | 'all'>('all');
  const posts = getAllPosts(locale, track === 'all' ? undefined : { track });

  // WHERE THE ARCHITECTURE ROW FALLS in the reverse-chronological list: before the first post that is not
  // newer than it, or last when every post is newer. `getAllPosts` already returns newest-first, so this
  // is a single scan of an ordered list rather than a re-sort — and `findIndex` short-circuits, where a
  // `.filter(…).length` would build a throwaway array to count it.
  //
  // COMPARED AS STRINGS, on purpose and not by accident: `lib/content.ts` sorts the catalogue itself with
  // `a.date < b.date`, both sides being ISO-8601 UTC, and this index must agree with THAT ordering. A
  // `Date` comparison here would be a second, subtly different rule for the same list.
  const firstOlder = posts.findIndex((p) => p.date <= ARCHITECTURE_PUBLISHED);
  const cardIndex = firstOlder === -1 ? posts.length : firstOlder;

  return (
    <section id="artigos" className="scroll-mt-[--header-h]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-2 border-border-strong px-[--gutter] pb-4 pt-[clamp(1.6rem,3vw,2.4rem)]">
        <h2 className="font-mono text-sm uppercase tracking-[0.16em]">
          <b className="font-bold">{t('articles.headingBold')}</b> — {t('articles.headingRest')}
        </h2>
        <p className="label-mono">{t('articles.subtitle')}</p>
      </div>

      <div role="tablist" aria-label={t('articles.filtersLabel')} className="flex flex-wrap px-[--gutter] pb-5">
        {FILTERS.map(({ value, labelKey }) => (
          <button
            key={value}
            role="tab"
            aria-selected={track === value}
            onClick={() => setTrack(value)}
            className={`-mr-px border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-widest ${
              track === value ? 'bg-foreground text-background' : 'text-muted-foreground invert-hover'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {posts.length === 0 && <Empty>{t('articles.empty')}</Empty>}

      {/* IN ITS CHRONOLOGICAL PLACE, AND STILL OUTSIDE THE FILTER. The card is spliced into the rendered
          rows at `cardIndex` rather than pushed through `posts`, which is what keeps both properties at
          once: it sorts like an article, and no chip can remove it — including one that matches zero
          articles, where the empty state above is what the reader sees about the WRITING and this card is
          still the front door to the section. */}
      {posts.slice(0, cardIndex).map((post) => (
        <ArticleRow key={post.slug} post={post} />
      ))}
      <ArchitectureCard />
      {posts.slice(cardIndex).map((post) => (
        <ArticleRow key={post.slug} post={post} />
      ))}
    </section>
  );
}
