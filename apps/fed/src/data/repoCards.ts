// Static, owner-curated repo cards for long-form pages (issue #122, ADR-0035).
//
// A small allowlist of GitHub repos the ramp-up page cites, rendered as brutalist cards INSTEAD of plain
// links — with no GitHub API call, no runtime XHR and no third-party JS. A repo only becomes a card when
// its canonical URL is in this registry; any other GitHub link on the page falls through to a plain link
// (the same opt-in shape as the YouTube VideoEmbed facade — see Markdown.tsx). This is fully static and
// owner-curated, exactly like the portfolio `catalog.ts`.
//
// READER-FACING BY PATH: the `description` field is reader-facing bilingual prose, so despite living under
// `src/data/` a change to one is copy, not app data. It is NOT an owner gate — ADR-0003's 2026-07-30
// amendment made reader-facing content safe class and retired the content-by-path list this comment used
// to mirror. What it still is: the trigger for `marketing-lead`, now the only lens on these words
// (it was `brand-guardian` until skills ADR-0002 amendment #7 merged the claim and craft lenses).
//
// The FACTS below (name, owner, language, repoUrl) are authored once and carry no
// locale — a repo's name and primary language are the same in every edition (the facts-once / prose-per-
// locale split from ADR-0024 / content.ts).
import type { Locale } from '../i18n';

export interface RepoCardData {
  /** Repo name as GitHub spells it (canonical casing) — a fact. */
  name: string;
  /** GitHub account/org that owns the repo — a fact. */
  owner: string;
  /** Primary language, shown as a static chip. A stable at-a-glance signal that never goes stale —
   *  deliberately NOT a star count, which would freeze and mislead on a static card (ADR-0035). A fact. */
  language: string;
  /** Canonical GitHub URL — a fact, and the registry key (matched case-insensitively, trailing slash
   *  ignored — see `repoCardFor`). */
  repoUrl: string;
  /** One-line hook: why this repo is worth a reader's time. Reader-facing prose, authored per locale. */
  description: Record<Locale, string>;
}

// The repos the ramp-up "sources → GitHub" section points at — the configs and skill sets these people
// run in the open. Owner-curated; extend as new repos earn a card.
export const repoCards: RepoCardData[] = [
  {
    name: 'skills',
    owner: 'mattpocock',
    language: 'Shell',
    repoUrl: 'https://github.com/mattpocock/skills',
    description: {
      en: "Matt Pocock's own `.claude` skills — engineering discipline (TDD, domain modeling, review) that keeps AI coding honest.",
      pt: 'As skills do `.claude` do próprio Matt Pocock — disciplina de engenharia (TDD, modelagem de domínio, review) que mantém o AI coding honesto.',
    },
  },
  {
    name: 'gstack',
    owner: 'garrytan',
    language: 'TypeScript',
    repoUrl: 'https://github.com/garrytan/gstack',
    description: {
      en: 'An opinionated agent stack wired into Claude Code — a virtual eng team behind slash commands, shipping its own `skills.md`.',
      pt: 'Uma stack de agente opinativa plugada no Claude Code — um time de engenharia virtual atrás de slash commands, com seu próprio `skills.md`.',
    },
  },
  {
    name: 'gbrain',
    owner: 'garrytan',
    language: 'TypeScript',
    repoUrl: 'https://github.com/garrytan/gbrain',
    description: {
      en: 'The memory layer for an agent — a self-wiring knowledge graph that lets it remember across runs.',
      pt: 'A camada de memória de um agente — um grafo de conhecimento auto-montável que o faz lembrar entre execuções.',
    },
  },
  {
    name: 'nanoGPT',
    owner: 'karpathy',
    language: 'Python',
    repoUrl: 'https://github.com/karpathy/nanoGPT',
    description: {
      en: 'The compact GPT that actually reproduces GPT-2 — read it end to end and the architecture stops being a black box.',
      pt: 'O GPT compacto que de fato reproduz o GPT-2 — leia de ponta a ponta e a arquitetura deixa de ser caixa-preta.',
    },
  },
  {
    name: 'llm.c',
    owner: 'karpathy',
    language: 'C/CUDA',
    repoUrl: 'https://github.com/karpathy/llm.c',
    description: {
      en: 'LLM training in raw C/CUDA, no framework in the way — the layer beneath the layer.',
      pt: 'Treino de LLM em C/CUDA puro, sem framework no meio do caminho — a camada abaixo da camada.',
    },
  },
  {
    name: 'nanochat',
    owner: 'karpathy',
    language: 'Python',
    repoUrl: 'https://github.com/karpathy/nanochat',
    description: {
      en: 'A full ChatGPT-style stack in one hackable codebase — pretraining through to a chat UI.',
      pt: 'Uma stack estilo ChatGPT inteira num código hackeável — do pré-treino até a interface de chat.',
    },
  },
  {
    name: 'minGPT',
    owner: 'karpathy',
    language: 'Python',
    repoUrl: 'https://github.com/karpathy/minGPT',
    description: {
      en: 'The teaching GPT that started the line — a few hundred lines that make the transformer legible.',
      pt: 'O GPT didático que começou a linhagem — algumas centenas de linhas que tornam o transformer legível.',
    },
  },
];

/** Normalize a GitHub repo URL for matching: trim, drop any trailing slash(es), lowercase. So a stray
 *  trailing slash or a casing difference in the markdown (`.../nanoGPT` vs the link) still resolves to the
 *  card instead of silently falling through to a plain link. */
export function normalizeRepoUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

const byUrl = new Map(repoCards.map((repo) => [normalizeRepoUrl(repo.repoUrl), repo]));

/** The registered card for a URL, or null when the URL isn't a curated repo (→ render a plain link). */
export function repoCardFor(url: string): RepoCardData | null {
  return byUrl.get(normalizeRepoUrl(url)) ?? null;
}
