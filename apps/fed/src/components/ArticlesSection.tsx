// Articles section (#artigos) — the landing's main pane. Lists posts newest-first from
// markdown-in-repo (../lib/content) with a local tag filter (no URL param: the section lives on the
// landing, so filtering must not rewrite the canonical URL). Fully static — no backend.
//
// Slice 3 keeps the existing list markup; the reader-first restyle and the track filter
// (pessoal/engenharia) land with the articles slice.
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAllPosts } from '../lib/content';
import { Empty } from './Column';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' });

export function ArticlesSection() {
  const [tag, setTag] = useState<string | undefined>(undefined);
  const posts = getAllPosts(tag);

  return (
    <section id="artigos" className="scroll-mt-[--header-h]">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="label-mono">Artigos</h2>
        {tag && (
          <button onClick={() => setTag(undefined)} className="border border-border px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest invert-hover">
            Limpar filtro
          </button>
        )}
      </div>

      {posts.length === 0 && <Empty>Ainda não há artigos.</Empty>}

      {posts.map((p) => (
        <article key={p.slug} className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <time dateTime={p.date}>{fmtDate(p.date)}</time>
            <span>·</span>
            <button onClick={() => setTag(p.tag)} className="text-primary hover:underline">
              #{p.tag}
            </button>
          </div>
          <RouterLink to={`/blog/${p.slug}`} className="mt-0.5 block text-lg font-bold leading-snug text-foreground hover:text-primary">
            {p.title}
          </RouterLink>
          {p.excerpt && <p className="mt-1 text-[15px] leading-relaxed text-foreground/80">{p.excerpt}</p>}
        </article>
      ))}
    </section>
  );
}
