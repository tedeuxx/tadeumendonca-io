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

// THE /architecture TEASER CARD (#450, slice 2) — pinned at the top of this list, outside the track
// filter, and visually an article card. It replaces the `ArchitectureBand` shipped in #461, which the
// owner rejected on sight: "você descaracterizou a home". The band was a new <section> between the Hero
// and this grid, and the objection was to the OBJECT, not to its words — the landing's shape is the
// article list, and a band above it is a different landing. What he asked for instead: "eu queria que
// fosse um item como esse de post do blog o teaser para a seção arquitetura … deveria ser como artigo,
// mas não é um artigo pois quero direcionar direto pra seção arquitetura."
//
// IT LIVES HERE, NOT IN ITS OWN FILE, and that is the whole reason it can keep its promise: it renders
// from the same class constants `ArticleRow` does, three lines away, where a divergence is visible in one
// screen. In a sibling file "visually identical" would be a claim maintained by memory.
//
// IT IS OUTSIDE THE FILTER, deliberately and mechanically: it is rendered before `posts.map`, from no
// element of `posts`, so no chip state can remove it — including a chip that matches zero articles. The
// chips are a taxonomy over WRITING, and this card is not writing; filtering it by track would be the
// same untruth the chip slot below exists to prevent.
//
// THE THREE DIVERGENCES FROM AN ARTICLE ROW, each one a thing that would otherwise be false:
//   1. The chip slot renders `architecture.cardTrack` ("Seção do site" / "Site section") instead of a
//      track. Same slot, same treatment — a reader scanning this column reads that slot as "what kind of
//      writing is this", and the answer has to be "it isn't", said before the click.
//   2. The control renders `nav.architecture`, never `articles.read`. "Ler artigo" on a control that
//      opens a section states something the click does not do, and that untruth is why reusing the row
//      unchanged was rejected. No new key was authored for it: a NOUN control among verb controls is
//      itself the "not writing" signal, in the last place a reader looks — and #315's one-word-per-
//      destination rule already publishes the word.
//   3. No <time> and no #tag. A date in that slot reads as a publication date because on every other row
//      it IS one, and both candidates are wrong — "when the page last changed" makes permanent furniture
//      read as dated, and anything else is invented. The #tag is the article taxonomy, and would say
//      "filed among the writing" one slot after the chip said the opposite.
//
// AND NO TAKEAWAY LINE. `articles.takeaway` ("Você sai sabendo") is left empty rather than filled with a
// fifth string: the excerpt's second sentence already carries the payoff, and a fourth leaf saying it
// again reads as a card unsure it landed.
export function ArchitectureCard() {
  const t = useT();
  const lp = useLocalePath();
  const to = lp('/architecture');

  return (
    <article data-testid="architecture-card" className={ROW}>
      <div className={ROW_META}>
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

      {/* PINNED, AND ABOVE THE EMPTY STATE. Rendered outside `posts` entirely, so it survives every chip
          — including one that matches zero articles, where the empty state below is what the reader sees
          about the WRITING and this card is still the front door to the section. */}
      <ArchitectureCard />

      {posts.length === 0 && <Empty>{t('articles.empty')}</Empty>}
      {posts.map((post) => (
        <ArticleRow key={post.slug} post={post} />
      ))}
    </section>
  );
}
