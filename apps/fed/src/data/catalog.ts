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
// READER-FACING BY PATH: these are published positioning words, so a change here is copy, not app data.
// It is NOT an owner gate — ADR-0003's 2026-07-30 amendment made reader-facing content safe class. What
// it is: the trigger for `product-lead`, which since that amendment is the only lens on this file rather
// than the first of two. (It was `brand-guardian` until skills ADR-0002 amendment #7 merged the claim
// lens and the craft lens into `marketing-lead`, and `marketing-lead` until `-skills`#144 folded that
// into `product-lead`.)
import type { Locale } from '../i18n';
export interface CatalogProject {
  /**
   * **The GitHub repo name, verbatim** — a FACT, identical in every edition.
   *
   * A RULE rather than a per-entry choice (#329, owner: *"ajuste para o nome do repo no github, regra"*).
   * The `.io` entry said `tadeumendonca.io`, which is the SITE's name while the card links a REPO named
   * `tadeumendonca-io`. Binding the title to `repoUrl`'s last segment makes them two views of one fact,
   * which is what stops them drifting — the same reasoning that keeps `slug` per-locale and `name` shared.
   *
   * **This closes a drift rather than buying one**, and the first draft of this comment got that backwards
   * by booking it as an accepted cost — which is what invites a later sweep to revert a correct decision.
   * `content/architecture.{pt,en}.md` already published this repo as `tadeumendonca-io`, in both editions,
   * in a bulleted pair with `tadeumendonca-skills`. So the presence was carrying **two names for one repo
   * across two surfaces a reader meets in one sitting**. Three things agree now: the card's title, the
   * card's link target, and `/architecture`'s repo list.
   *
   * The brand is not at risk of going unnoticed — it is the footer of every route, the nav, the URL bar
   * and the OG card. The portfolio card is the one slot where the reader's next action is *open this
   * repo*, and the string that serves that action is the slug. A shelf titled by repo name reads as an
   * engineer's shelf; a card titled with a domain but linking a repo reads as a marketing tile.
   *
   * **Not per-card.** Making it a choice per entry reinstates the drift this removes and turns every
   * future entry into a fresh judgement — the value here is that it is a rule.
   */
  name: string;
  /**
   * How this card points at the project's releases (#329). Absent means no release affordance at all.
   *
   * - `'this-build'` — **only valid for THIS repo.** Shows the tag baked in from the root `VERSION` file
   *   and links that tag's own notes. The invariant behind it is *every tree the deploy publishes
   *   carries its own tag* — but read HOW it is held, because it is held two different ways and only one
   *   of them is a check.
   *
   *   On a merge and on a deliberate `part` dispatch, `release` bumps `VERSION` in the same commit the
   *   build consumes, and `deploy.yml`'s `gate` **asserts** it: that step is gated on
   *   `needs.release.result == 'success'`, so it runs on exactly those two paths and reddens the run if
   *   the tag does not point at the tree being published.
   *
   *   On a `part: none` republish it is **not asserted** — `release` is skipped, the assert is skipped
   *   with it, and `gate` builds `github.sha` unchecked. There the tag is INHERITED from the run that
   *   last bumped, which is sound while two conditions hold that this path does not enforce: that the
   *   dispatch came from `main` (the main-only guard is a step *inside* `release`, so it never runs
   *   here), and that the merge which produced that tree actually tagged (`release` wedged for four
   *   consecutive merges on 2026-07-23). Neither is hypothetical, and republishing outside them ships a
   *   footer linking a Release that describes an ancestor. Asserted on two paths, inherited on the third.
   * - `'plugin-build'` — **only valid for `tedeuxx/tadeumendonca-skills`.** Shows that plugin's tag and
   *   links its notes. The value is *derived and checked*, never authored: the deploy reads it from a
   *   tokenless checkout of that repo into `VITE_PLUGIN_VERSION`, and a committed `plugin-release.json`
   *   written by `gen-harness` is the floor a local build, a PR build or a fork renders. What it claims is
   *   *the plugin release this build was deployed against* — exact by construction under that reading,
   *   the way `this-build` is, and it may **not** be read as "the plugin's current version".
   * - `'index'` — links the repo's `/releases` page with **no tag shown**.
   *
   * **The 2026-08-02 rejection of a tag read over the NETWORK stands, and `plugin-build` is not a
   * reversal of it.** That decision refused a build-time **GitHub API call**: it can turn a healthy `main`
   * red on rate-limiting or an outage, and *"what does the card show when the call fails"* had no good
   * answer, since a stale tag is worse than no tag and a blank is a visible hole. Every one of those
   * properties is about an API call, and none of them survives the mechanism that replaced it — a `git`
   * checkout of a **public** repo, with no token, no quota and nothing the application fetches at build
   * time or at runtime. There is no failure branch to answer for either: a checkout that fails resolves
   * to the committed floor, which is a real tag that really exists. The rejected option is still
   * rejected; a different option now exists. ADR-0043's 2026-08-04 amendment records the whole trade
   * (#345).
   *
   * A literal tag string is not offered either, deliberately: `-io` re-tags on **every merge** — and on
   * a deliberate minor/major dispatch as well — so a hand-written tag would be wrong more
   * often than right, on the surface whose whole thesis is that its claims are checkable. `plugin-build`
   * is the opposite of that: nobody types it.
   */
  releases?: 'this-build' | 'plugin-build' | 'index';
  /** One-line hook — what it does, in the AI-Engineer-agentic framing. Prose, authored per locale. */
  tagline: Record<Locale, string>;
  /** 1–2 sentences: the real problem it solves. Prose, authored per locale. */
  description: Record<Locale, string>;
  /**
   * Primary stack / tools (shown as chips) — FACTS.
   *
   * THE CRITERION IS "what defines the project", not "the N most characteristic". There is no cap and
   * no ranking, and that is written down because its absence already cost something: `tadeumendonca-io`
   * shipped without `GitHub Actions` while `tadeumendonca-skills` shipped with it — and Actions does
   * MORE work in `-io`, where it runs the gates, the deploy, and the post-deploy check that the live
   * edge function is still this repo's. `/architecture` treats that check as proof rather than as
   * plumbing, so the card was omitting the one tool the page argues hardest about.
   *
   * A card carrying fewer chips carries them because the project uses fewer tools, never because a
   * limit trimmed the list. If a cap is ever wanted, it is a decision to take deliberately here —
   * silently dropping the sixth is how this one went missing.
   */
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
    // The repo name, not the site's — see the rule on `name` above (#329).
    name: 'tadeumendonca-io',
    releases: 'this-build',
    tagline: {
      pt: 'Este site — SPA estático React/Vite, construído agent-first com Claude Code.',
      // "built agent-first" reads as a bare adverbial in English and is the tell that the copy came from
      // Portuguese; `agent-first` is an adjective, so it needs a noun to attach to.
      en: 'This site — a static React/Vite SPA, built in an agent-first loop with Claude Code.',
    },
    description: {
      // `agent-driven` is retired (#245). The vocabulary that replaced it — which term is authoritative
      // where — lives in the private positioning source; `AGENTS.md` points at it and this comment does
      // not restate it.
      //
      // The rename does NOT put `agent-first` here: the tagline one line above already carries it, so
      // swapping the word in would have collapsed two distinct terms into the same word twenty words
      // apart — re-creating, one field higher, the repetition this card was already retired for once.
      //
      // Delivery gets its OWN sentence rather than sitting after a colon. Removing the term took away
      // the noun the colon governed (`um SDLC agent-first`), which the list then unpacked — without it
      // the colon yoked hosting to process and asserted a relation that is not there: an SPA served from
      // S3 is not "plan-first".
      pt:
        'Uma SPA estática (sem backend) servida em S3 + CloudFront e provisionada com Terraform. ' +
        'A entrega é plan-first, com CI de gates e deploy no merge. O repo é a fonte da verdade.',
      // "CI gates", not "gated CI" — the site's own published English already says CI gates
      // (`content/architecture.en.md`), and one presence should not carry two names for one thing.
      en:
        'A static SPA (no backend) served from S3 + CloudFront and provisioned with Terraform. ' +
        'Delivery is plan-first, with blocking CI gates and deploy on merge. The repo is the source of truth.',
    },
    // Rendered under "O que você tira disso" / "What you take away", so it must answer THAT question.
    //
    // This line has been re-broken twice by editors following the comments above it, so read this one
    // as current: it was retired once for repeating `description` verbatim a line apart, and the
    // repetition came straight back with the renamed term. Renaming does not fix a structural defect.
    //
    // What this field carries that no other does: WHERE to start and WHAT is reusable. It does not
    // restate the label — that lives in the tagline (see the note in `description`) — and it does not
    // re-list the stack, which the chips already give.
    proof: {
      // "as decisões que sustentam peso" / "the load-bearing decisions", NOT "every decision" — the first
      // draft of this line said `cada decisão` / `every decision`, which `/architecture` deliberately
      // qualifies ("Toda decisão que sustenta peso… é um ADR"). A universal over a library the reader
      // was just invited to open is falsified by one merged PR that decided something without an ADR.
      // Same defect the bar copy in messages.ts spent four drafts removing, reintroduced 40 lines below
      // that comment block.
      //
      // pt says `levar` rather than `copiar`: in BR Portuguese `copiar` carries the copy-someone's-
      // homework sense, which is the opposite of the invitation. en says `reuse` rather than `lift`
      // because `lift` was a near-synonym of its own label ("What you take away") two words away.
      pt:
        'onde começar a ler o repo, e o que levar: os ADRs registram as decisões que sustentam peso, ' +
        'do plan-first ao deploy — com o trade-off que cada uma custou.',
      en:
        'where to start reading the repo, and what to reuse: the ADRs record the load-bearing decisions, ' +
        'from plan-first to deploy — with the trade-off each one cost.',
    },
    stack: ['React', 'Vite', 'TypeScript', 'Terraform', 'GitHub Actions', 'Claude Code'],
    repoUrl: 'https://github.com/tedeuxx/tadeumendonca-io',
    // No liveUrl: this entry IS this site — the reader is already on it, so a "View live" link
    // would just point at the page they're viewing. The GitHub link is the useful one here (#175).
    status: 'live',
  },
  // #313, reframed by #736. ~~This repo is a DEPENDENCY of the entry above: the site consumes this
  // plugin, so the card explains how the first is built.~~ Struck at #736: no longer true. The plugin is
  // disabled in this repository (`.claude/settings.json`, #715), and the method that runs here is
  // installed at user level from the workstation repository. The owner kept the card and reframed it
  // (option (a) on #736): it now says what the repo is today, a published plugin that is deprecated as a
  // source, where the loop took shape, and it points at `tedeuxx/mhw` the way #733 does on
  // `/architecture`. It does not call the repo a generated mirror: that is false while no regeneration
  // has landed (PR #738's lens record).
  //
  // It cleared `docs/catalog-ready.md` as of `-skills`#109, and #736 re-assessed it row by row at a
  // named `-skills` commit; the rows and the commit are in that file. It did NOT clear the bar before
  // #109: the README pitched a "personal Claude skills library" and failed the "README in the new
  // framing" box, and that bar explicitly refuses to extend the platform's scoping exception to anything
  // else on the shelf.
  {
    name: 'tadeumendonca-skills',
    // A TAG now, where this said `index` until #345 — and the premise that put `index` here is what
    // changed, not the decision that produced it. That comment read: *this repo's VERSION lives in
    // ANOTHER repo the build cannot read, and the only way to a tag here is the network call the owner
    // ruled out (#329)*. The second clause is still true and the network call is still ruled out; the
    // first stopped being true. A tokenless checkout of that public repo makes its VERSION a FILE, and
    // the deploy reads it fresh into `VITE_PLUGIN_VERSION` with `plugin-release.json` as the floor.
    //
    // So this is not #329 being reversed — see the field's own doc comment above, which states the
    // distinction in full. The staleness objection is answered by WHERE the value resolves rather than
    // waived: the window is the interval since the last deploy (this site published 8 times on
    // 2026-08-03), against the tens of releases a committed-only value would have drifted at the
    // plugin's cadence.
    releases: 'plugin-build',
    tagline: {
      // NOT "biblioteca de skills" / "skills library" as the pitch — that is the pitch `-skills`#109
      // retired, and it names the least differentiated third of the repo. NOT a skill count either: that
      // number lives in the other repo's tree, where a gate keeps its copies true, and no gate here can
      // see it.
      //
      // ~~"The harness that builds this site — … a merge gate wired into the tool, not the prompt."~~
      // Struck at #736. Both halves are false here: the plugin is disabled in this repository, so it
      // builds nothing here, and since #731 this repository's merge is held by a rule, not a hook. What
      // the line says now is true of the repo itself and needs no qualifier: the loop took shape in this
      // plugin, and the plugin's personas and skills check an agent's work. Hooks are left to the
      // description, where they can be scoped to where the plugin is installed (#736 AC 1).
      pt: 'O plugin de Claude Code onde meu loop de agentes tomou forma: personas de review e skills que verificam o trabalho de um agente antes de alguém confiar nele.',
      en: "The Claude Code plugin my agent loop took shape in: review personas and skills that check an agent's work before anyone trusts it.",
    },
    description: {
      // Three sentences, each with one job, and the last two are pinned verbatim in meaning by
      // `content/architecture-plugin-disabled.test.ts`, so they cannot drift from `/architecture`.
      //
      // 1. What the plugin does, SCOPED to where it is installed (#736 AC 1). The card published
      //    before #736 said "Here … a hook refuses irreversible actions", and "here" became false when
      //    #715 disabled the plugin in this repository. The human half (`agent-led verification,
      //    HUMAN-RESIDUAL`) stays: a hook line with no human in it reads as *the irreversible is handled
      //    mechanically*, the opposite of what the hook routes to.
      // 2. The disabled-here sentence `/architecture` carries (#733), without its backticks: card copy
      //    renders as plain text, so a backtick would print.
      // 3. The plugin's status, the ADR-0043 sentence #738 landed, also without backticks. It does NOT
      //    say "generated mirror": the plugin's own README says it "becomes" one, and its main still ships
      //    skills the method retired.
      //
      // `contexto fresco`, not `contexto limpo`: `/pt/architecture` already publishes `contexto fresco`.
      // One presence, one name.
      pt:
        'Onde o plugin está instalado, um reviewer julga cada MR em contexto fresco e um hook recusa as ações ' +
        'irreversíveis antes do comando rodar, e o humano fica com o que é dele. ' +
        'O plugin tadeumendonca-skills está desligado neste repositório, e o método que roda aqui vem da ' +
        'workstation, no nível do usuário. ' +
        'O plugin continua publicado, mas está descontinuado como fonte, e o README dele aponta para o tedeuxx/mhw.',
      en:
        'Where the plugin is installed, a reviewer judges each MR in a fresh context and a hook refuses ' +
        'irreversible actions before the command runs, so the human keeps what is theirs. ' +
        'The tadeumendonca-skills plugin is disabled in this repository, and the method that runs here comes ' +
        'from the workstation at user level. ' +
        'The plugin is still published, but it is deprecated as a source, and its README points to tedeuxx/mhw.',
    },
    // Answers "what you take away". ~~"what you can install into your own repo today"~~ struck at #736:
    // the plugin's README now opens by telling a reader to install the method from tedeuxx/mhw, not this
    // plugin, so a card inviting installation contradicts the repo one click away. What a reader takes
    // from it is the loop's design as it was packaged here, and the README's first line, which this
    // proof points at rather than contradicts.
    proof: {
      pt:
        'a primeira forma empacotada do loop, lida nas decisões e nos trade-offs que ele registra; o README ' +
        'abre dizendo onde o método mora agora.',
      en:
        'the first packaged form of the loop, read through the decisions and trade-offs it records; the README ' +
        'opens by saying where the method lives now.',
    },
    // FACTS, and deliberately short: there is no runtime here. Markdown, shell and the plugin manifests.
    stack: ['Claude Code', 'Bash', 'GitHub Actions'],
    repoUrl: 'https://github.com/tedeuxx/tadeumendonca-skills',
    // `live` is kept on purpose (#736 AC 8): the badge says the repo is published and current, not that
    // it runs here. The plugin is still published and still cuts a release on every merge, which is
    // also why `releases: 'plugin-build'` above still has a tag to show. `wip` would be the false badge:
    // nothing about the plugin is in progress.
    status: 'live',
  },
];
