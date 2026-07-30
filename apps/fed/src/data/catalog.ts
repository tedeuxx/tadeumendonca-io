// Portfolio catalog (Site Fase A — reframe-first). A curated, versioned list of projects the site
// links out to on GitHub — the "além do SPA" surface of the professional presence. No backend, no
// GitHub API: fully static and owner-curated.
//
// GROWTH: this list is seeded as real cowork automations "graduate" to public catalog repos (the
// catalog-ready bar). Add an entry per graduated project; the first newsletter edition tracks item #1.
// Keep it honest — only list projects that actually stand on their own with a real README.
//
// BILINGUAL, and the TYPE is the guard (#235). The prose fields were plain `string` and authored in
// Portuguese only, so `/en/portfolio` served Portuguese copy to English readers — on the surface whose
// job is to make the positioning credible, and in contradiction of the repo's own absolute rule that
// everything the reader reads is authored in both languages. Every other reader-facing module already
// made a missing translation a COMPILE error (`profile.ts` via `ProfileSource`, the message catalog,
// `repoCards.ts`'s leaf-bilingual `description`); this file was the one that did not, so nothing
// objected. Same leaf-bilingual shape as ADR-0035's `repoCards.ts`: prose per locale, FACTS once.
//
// BOUNDARY-BY-PATH: these are published positioning words, so a copy change here is ratified by the
// owner via the critical-reviewer — not merged as safe app-data.
import type { Locale } from '../i18n';
export interface CatalogProject {
  /** Repo / project name as shown on the card — a FACT, identical in every edition. */
  name: string;
  /** One-line hook — what it does, in the AI-Engineer-agentic framing. Prose, authored per locale. */
  tagline: Record<Locale, string>;
  /** 1–2 sentences: the real problem it solves. Prose, authored per locale. */
  description: Record<Locale, string>;
  /** Primary stack / tools (shown as chips) — FACTS. */
  stack: string[];
  /**
   * Reader-first payoff — what someone takes away from studying it. Rendered after a localized label
   * ("O que você tira disso" / "What you take away"), so each edition reads as a continuation of its own
   * label and starts lowercase. Prose, authored per locale.
   */
  proof?: Record<Locale, string>;
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
    tagline: {
      pt: 'Este site — SPA estático React/Vite, construído agent-first com Claude Code.',
      // "built agent-first" reads as a bare adverbial in English and is the tell that the copy came from
      // Portuguese; `agent-first` is an adjective, so it needs a noun to attach to.
      en: 'This site — a static React/Vite SPA, built in an agent-first loop with Claude Code.',
    },
    description: {
      // `agent-first`, not `agent-driven` (#245). "Who moves the work through the SDLC" is not a
      // distinct claim from "the agent drafts and the human reviews", which is what `agent-first`
      // already says — and it was the one term with no surface where it was the most precise word
      // available. The full hierarchy lives in the private positioning source, not here (owner
      // decision); `CLAUDE.md` points at it.
      //
      // Retired from reader-facing site copy only. It survives in an ADR and the redesign comp, and
      // those are not rewritten — supersede, never rewrite.
      pt:
        'Uma SPA estática (sem backend) servida em S3 + CloudFront e provisionada com Terraform, ' +
        'entregue por um SDLC agent-first: plan-first, CI com gates e deploy no merge. O repo é a fonte da verdade.',
      // "CI gates", not "gated CI" — the site's own published English already says CI gates
      // (`content/architecture.en.md`), and one presence should not carry two names for one thing.
      en:
        'A static SPA (no backend) served from S3 + CloudFront and provisioned with Terraform, delivered ' +
        'through an agent-first SDLC: plan-first, blocking CI gates, deploy on merge. The repo is the source of truth.',
    },
    // Rendered under "O que você tira disso" / "What you take away", so it must answer THAT question.
    //
    // This line was ALREADY retired once for repeating `description` — "plan-first, CI gated" verbatim a
    // line apart — and the repetition came straight back with the new word: `agent-first SDLC` sat in
    // both fields, and so did `plan-first`, across roughly sixty words on one card. Renaming a term does
    // not fix a structural defect, it just re-dresses it.
    //
    // The label belongs in `description`, which is where a reader learns WHAT this is. The payoff opens
    // on what they can LIFT — which is the ADRs, and the fact that each one carries its cost.
    proof: {
      pt:
        'onde começar a ler o repo, e o que copiar: os ADRs registram cada decisão do plan-first ao ' +
        'deploy — e o trade-off que cada uma custou.',
      en:
        'where to start reading the repo, and what to lift: the ADRs record every decision from plan-first ' +
        'to deploy — and the trade-off each one cost.',
    },
    stack: ['React', 'Vite', 'TypeScript', 'Terraform', 'Claude Code'],
    repoUrl: 'https://github.com/tedeuxx/tadeumendonca-io',
    // No liveUrl: this entry IS this site — the reader is already on it, so a "View live" link
    // would just point at the page they're viewing. The GitHub link is the useful one here (#175).
    status: 'live',
  },
];
