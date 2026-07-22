// Articles section (#artigos) — the landing's main pane and the reason the site exists. Each row is
// reader-first: what the piece is, and what you walk away knowing ("Você sai sabendo …").
//
// The track filter (Tudo / Vida pessoal / Engenharia) is LOCAL state on purpose: the section lives
// on the landing, so filtering must never rewrite the canonical URL the prerender snapshots.
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAllPosts, type BlogPost, type Track } from '../lib/content';
import { Empty } from './Column';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

const FILTERS: { value: Track | 'all'; label: string }[] = [
  { value: 'all', label: 'Tudo' },
  { value: 'pessoal', label: 'Vida pessoal' },
  { value: 'engenharia', label: 'Engenharia' },
];

const TRACK_LABEL: Record<Track, string> = { pessoal: 'Vida pessoal', engenharia: 'Engenharia' };

function TrackChip({ track }: { track: Track }) {
  return (
    <span
      className={
        track === 'pessoal'
          ? 'border border-primary bg-primary px-1.5 py-px font-mono text-primary-foreground'
          : 'border border-border px-1.5 py-px font-mono text-muted-foreground'
      }
    >
      {TRACK_LABEL[track]}
    </span>
  );
}

function ArticleRow({ post }: { post: BlogPost }) {
  return (
    <article className="border-b border-border px-[--gutter] py-6">
      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <time dateTime={post.date}>{fmtDate(post.date)}</time>
        {post.tag && <span>· #{post.tag}</span>}
        <span>·</span>
        <TrackChip track={post.track} />
      </div>

      <RouterLink to={`/blog/${post.slug}`} className="block">
        <h3 className="text-[clamp(1.4rem,2.6vw,2.1rem)] font-bold leading-tight tracking-[-0.025em] transition-colors hover:text-primary">
          {post.title}
        </h3>
      </RouterLink>

      {post.excerpt && <p className="mt-2 max-w-prose leading-relaxed text-foreground/80">{post.excerpt}</p>}

      {post.takeaway && (
        <p className="mt-2 max-w-prose leading-relaxed text-foreground/80">
          <span className="mr-2 font-mono text-[0.64rem] uppercase tracking-[0.1em] text-primary">Você sai sabendo</span>
          {post.takeaway}
        </p>
      )}

      {post.hasVideo && (
        <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">▶ vídeo no artigo</p>
      )}

      <div className="mt-4 flex flex-wrap">
        <RouterLink
          to={`/blog/${post.slug}`}
          className="-mr-px border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider invert-hover"
        >
          Ler artigo
        </RouterLink>
        {post.linkedinUrl && (
          <a
            href={post.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="-mr-px border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider invert-hover"
          >
            Ver no LinkedIn
          </a>
        )}
      </div>
    </article>
  );
}

export function ArticlesSection() {
  const [track, setTrack] = useState<Track | 'all'>('all');
  const posts = getAllPosts(track === 'all' ? undefined : { track });

  return (
    <section id="artigos" className="scroll-mt-[--header-h]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-2 border-border-strong px-[--gutter] pb-4 pt-[clamp(1.6rem,3vw,2.4rem)]">
        <h2 className="font-mono text-sm uppercase tracking-[0.16em]">
          <b className="font-bold">Artigos</b> — pra você aplicar
        </h2>
        <p className="label-mono">Escrita técnica com trade-offs explícitos · vídeos embedados no texto</p>
      </div>

      <div role="tablist" aria-label="Filtrar por trilha" className="flex flex-wrap px-[--gutter] pb-5">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={track === value}
            onClick={() => setTrack(value)}
            className={`-mr-px border border-border px-3.5 py-2 font-mono text-xs uppercase tracking-widest ${
              track === value ? 'bg-foreground text-background' : 'text-muted-foreground invert-hover'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {posts.length === 0 && <Empty>Ainda não há artigos nesta trilha.</Empty>}
      {posts.map((post) => (
        <ArticleRow key={post.slug} post={post} />
      ))}
    </section>
  );
}
