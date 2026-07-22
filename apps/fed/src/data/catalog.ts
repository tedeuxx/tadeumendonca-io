// Portfolio catalog (Site Fase A — reframe-first). A curated, versioned list of projects the site
// links out to on GitHub — the "além do SPA" surface of the professional presence. No backend, no
// GitHub API: fully static and owner-curated.
//
// GROWTH: this list is seeded as real cowork automations "graduate" to public catalog repos (the
// catalog-ready bar). Add an entry per graduated project; the first newsletter edition tracks item #1.
// Keep it honest — only list projects that actually stand on their own with a real README.
export interface CatalogProject {
  /** Repo / project name as shown on the card. */
  name: string;
  /** One-line hook — what it does, in the AI-Engineer-agentic framing. */
  tagline: string;
  /** 1–2 sentences: the real problem it solves. */
  description: string;
  /** Primary stack / tools (shown as chips). */
  stack: string[];
  /** Reader-first payoff — what someone takes away from studying it ("o que você tira disso"). */
  proof?: string;
  /** Canonical GitHub URL. */
  repoUrl: string;
  /** Optional live/demo URL. */
  liveUrl?: string;
  /** Rough maturity, drives a small badge. */
  status?: 'live' | 'wip';
}

// Seed: the site itself is a real, defensible agent-built artifact. Replace/extend as cowork
// automations graduate — this is the curated shortlist, not an exhaustive repo dump.
export const catalog: CatalogProject[] = [
  {
    name: 'tadeumendonca.io',
    tagline: 'Este site — SPA estático React/Vite, construído agent-first com Claude Code.',
    description:
      'Uma SPA estática (sem backend) servida em S3 + CloudFront e provisionada com Terraform, ' +
      'entregue por um SDLC agent-driven: plan-first, CI com gates e deploy no merge. O repo é a fonte da verdade.',
    proof:
      'um exemplo real de SDLC agent-driven ponta a ponta: plan-first, CI gated, prerender para SEO e ' +
      'deploy estático em S3 + CloudFront via Terraform.',
    stack: ['React', 'Vite', 'TypeScript', 'Terraform', 'Claude Code'],
    repoUrl: 'https://github.com/tedeuxx/tadeumendonca-io',
    liveUrl: 'https://tadeumendonca.io',
    status: 'live',
  },
];
