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
    tagline: 'This site — an offline-first PWA built agent-first with Claude Code.',
    description:
      'A React/Vite PWA + Hono-on-Lambda BFF, provisioned with Terraform and shipped through an ' +
      'agent-driven SDLC (plan-first, gated CI, per-environment promotion). The repo is the source of truth.',
    stack: ['React', 'Vite', 'Hono', 'AWS Lambda', 'Terraform', 'Claude Code'],
    repoUrl: 'https://github.com/tedeuxx/tadeumendonca-pwa',
    liveUrl: 'https://tadeumendonca.io',
    status: 'live',
  },
];
