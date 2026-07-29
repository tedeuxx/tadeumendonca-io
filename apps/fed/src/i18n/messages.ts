// The typed message catalog — EVERY UI-chrome string. Key-first: each string carries BOTH locales
// adjacent ({ pt, en }), so there is no parallel per-locale block (which duplication detectors read as
// duplicated code) and adding a key can't miss a locale (the `satisfies` below makes it a compile error).
// The CV *content* is NOT here — it lives in src/data/profile.ts, authored bilingually in the same
// key-first shape and flattened by `resolveProfile`. Two catalogs, one convention: this one for chrome,
// that one for the CV, so chrome and content are in the visitor's language together.
import type { Locale } from './config';

/** One UI-chrome string in both locales. */
export interface Entry {
  pt: string;
  en: string;
}

const strings = {
  nav: {
    articles: { pt: 'Artigos', en: 'Articles' },
    portfolio: { pt: 'Portfólio', en: 'Portfolio' },
    contact: { pt: 'Contato', en: 'Contact' },
    profile: { pt: 'Perfil', en: 'Profile' },
    rampup: { pt: 'Ramp-up', en: 'Ramp-up' },
    architecture: { pt: 'Arquitetura', en: 'Architecture' },
    openMenu: { pt: 'Abrir menu', en: 'Open menu' },
    closeMenu: { pt: 'Fechar menu', en: 'Close menu' },
  },
  locale: {
    // aria-label for the PT/EN toggle group.
    switch: { pt: 'Idioma', en: 'Language' },
  },
  marquee: {
    subjects: { pt: 'Assuntos', en: 'Subjects' },
  },
  hero: {
    badge: { pt: 'Conteúdo técnico aberto', en: 'Open technical content' },
    badgeAccent: { pt: '▶ Da vida pessoal à produção', en: '▶ From personal life to production' },
    taglineLead: { pt: 'Aprenda a construir com IA —', en: 'Learn to build with AI —' },
    taglineAccent: { pt: 'do dia a dia à produção', en: 'from everyday life to production' },
    bodyLead: {
      pt: 'Compartilho o que aprendo construindo com IA — de experimentos que automatizam a',
      en: 'I share what I learn building with AI — from experiments that automate',
    },
    bodyStrong1: { pt: 'vida pessoal com Claude Cowork', en: 'personal life with Claude Cowork' },
    bodyConnector: { pt: 'a', en: 'to' },
    bodyStrong2: { pt: 'agentic development', en: 'agentic development' },
    bodyTail: {
      pt: '. Trade-offs reais e código aberto pra você aplicar, seja na sua rotina ou na sua empresa. O objetivo é te fazer construir melhor — quem escreve isso é consequência, não o ponto.',
      en: '. Real trade-offs and open source for you to apply, whether in your routine or at your company. The goal is to help you build better — who writes it is a by-product, not the point.',
    },
  },
  tracks: {
    pessoal: { pt: 'Vida pessoal', en: 'Personal life' },
    engenharia: { pt: 'Engenharia', en: 'Engineering' },
  },
  articles: {
    headingBold: { pt: 'Artigos', en: 'Articles' },
    headingRest: { pt: 'pra você aplicar', en: 'to put to use' },
    subtitle: {
      pt: 'Escrita técnica com trade-offs explícitos · vídeos embedados no texto',
      en: 'Technical writing with explicit trade-offs · videos embedded in the text',
    },
    filtersLabel: { pt: 'Filtrar por trilha', en: 'Filter by track' },
    filterAll: { pt: 'Tudo', en: 'All' },
    takeaway: { pt: 'Você sai sabendo', en: "What you'll walk away with" },
    hasVideo: { pt: '▶ vídeo no artigo', en: '▶ video in the article' },
    read: { pt: 'Ler artigo', en: 'Read article' },
    viewOnLinkedin: { pt: 'Ver no LinkedIn', en: 'View on LinkedIn' },
    empty: { pt: 'Ainda não há artigos nesta trilha.', en: 'No articles in this track yet.' },
  },
  // The ramp-up page's chrome. Its BODY is markdown-in-repo, authored in both locales
  // (content/rampup.pt.md · content/rampup.en.md), so chrome and content are always in the same
  // language — the parity rule, not an interim.
  rampup: {
    heading: { pt: 'Ramp-Up — Virando AI Engineer', en: 'Ramp-Up — Becoming an AI Engineer' },
    // Document title (the site name is appended by useDocumentHead).
    title: { pt: 'Ramp-up para AI Engineer', en: 'Ramp-up to AI Engineer' },
    kicker: { pt: 'Plano aberto · em andamento', en: 'Open plan · in progress' },
    metaDescription: {
      pt: 'O plano que montei para migrar de arquiteto de aplicações cloud para AI Engineer: o raciocínio, os cinco pilares, o roadmap de 6–12 meses e as fontes que estou realmente usando.',
      en: 'The plan I built to move from cloud application architect to AI Engineer: the reasoning, the five pillars, the 6–12 month roadmap, and the sources I am actually using.',
    },
  },
  // The architecture page's chrome. Its BODY is markdown-in-repo, authored in both locales
  // (content/architecture.pt.md · content/architecture.en.md), so chrome and content are always in the
  // same language — the parity rule. The page is an orientation layer that LINKS canonical detail
  // (the ADRs, the two public repos, catalog-ready) rather than restating it.
  architecture: {
    heading: { pt: 'Arquitetura — a planta, em aberto', en: 'Architecture — the blueprint, in the open' },
    // Document title (the site name is appended by useDocumentHead).
    title: { pt: 'Como este site é construído', en: 'How this site is built' },
    kicker: { pt: 'A planta · aberta', en: 'The blueprint · open' },
    metaDescription: {
      pt: 'Como este site é construído: a SPA estática em S3 + CloudFront, o conteúdo em markdown no repo prerenderizado no build, o dev-loop de verificação liderada pelo agente, e os ADRs que registram cada decisão — com links para replicar.',
      en: 'How this site is built: the static SPA on S3 + CloudFront, markdown-in-repo content prerendered at build, the agent-led verification dev-loop, and the ADRs that record every decision — with links to replicate it.',
    },
  },
  portfolio: {
    heading: { pt: 'Portfólio', en: 'Portfolio' },
    intro: {
      pt: 'Código aberto pra você estudar, clonar e usar. Cresce conforme as automações graduam.',
      en: 'Open source for you to study, clone and use. It grows as the automations graduate.',
    },
    // The BAR (#246). With one item in the catalog — and that item being this site — the page reads as a
    // catalog that has not started. Saying inclusion is earned turns "the only item" into "the first item
    // that cleared the bar", which is a different claim to someone deciding whether the list is thin or
    // selective. It costs nothing to keep true: `docs/catalog-ready.md` already exists and is public, so
    // the sentence points at something checkable rather than making a promise to maintain.
    // The term is NOT free per edition: `/architecture` already names this same standard — en "The bar",
    // pt "A régua" — and an adjacent surface calling it something else is the inconsistency this copy was
    // supposed to remove, not add. The first draft said "clarear a barra", which is worse than
    // inconsistent: `clarear` means to lighten, so it is a calque of "clear the bar" that does not carry
    // "pass a threshold" in pt-BR at all.
    //
    // Both editions must also assert the SAME thing. The draft's pt read "entra depois de passar" —
    // temporal, i.e. sequence — while en asserted merit. #246's criterion is that inclusion is EARNED, so
    // sequence is the weaker claim and only one edition was making the argument.
    bar: {
      pt: 'Cada projeto conquista seu lugar passando pela régua:',
      en: 'Each project earns its place by clearing the bar:',
    },
    // The link text is the filename, deliberately untranslated — it names the artifact rather than
    // describing it, so there is nothing to keep in sync between editions.
    barLink: { pt: 'catalog-ready.md', en: 'catalog-ready.md' },
    payoff: { pt: 'O que você tira disso', en: 'What you take away' },
    statusLive: { pt: 'Live', en: 'Live' },
    statusWip: { pt: 'WIP', en: 'WIP' },
    viewGithub: { pt: 'Ver no GitHub', en: 'View on GitHub' },
    viewLive: { pt: 'Ver ao vivo', en: 'View live' },
    emptyLead: { pt: 'Catálogo em construção.', en: 'Catalog under construction.' },
    emptyLink: { pt: 'Acompanhe no GitHub', en: 'Follow on GitHub' },
    viewAll: { pt: '→ Ver catálogo completo', en: '→ View the full catalog' },
    metaDescription: {
      pt: 'Automações, agentes e projetos — o catálogo no GitHub.',
      en: 'Automations, agents and projects — the catalog on GitHub.',
    },
  },
  contact: {
    heading: { pt: 'Algo aqui te ajudou? Me conta', en: 'Did something here help you? Tell me' },
  },
  contactLinks: {
    defaultTitle: { pt: 'Onde me encontrar', en: 'Where to find me' },
  },
  about: {
    heading: { pt: 'Sobre este site', en: 'About this site' },
    body: {
      pt: 'Escrevo e construo em público sobre engenharia de IA. Se algo aqui te ajudou a evoluir, cumpriu o papel.',
      en: 'I write and build in public about AI engineering. If something here helped you grow, it did its job.',
    },
    whoWrites: { pt: 'Quem escreve', en: 'Who writes this' },
  },
  cv: {
    experience: { pt: 'Experiência', en: 'Experience' },
    education: { pt: 'Formação', en: 'Education' },
    certifications: { pt: 'Certificações', en: 'Certifications' },
    skills: { pt: 'Habilidades', en: 'Skills' },
    present: { pt: 'Atual', en: 'Present' },
    unavailable: { pt: 'Perfil ainda não disponível.', en: 'Profile not available yet.' },
    download: { pt: 'Baixar CV (PDF)', en: 'Download CV (PDF)' },
    // Print-only proficiency wording for the one-page CV (#161). On screen the 4-square meter carries
    // this; reflowed inline for print the meter is dropped, which printed a level-1 keyword beside a
    // level-4 one as equals — flattening a deliberate honesty device into an over-claim. Only the low
    // levels are worded, because they are the ones the flattening exaggerated; 3–4 print bare.
    // Two labels rather than one: collapsing 1 and 2 into "basic" would under-claim level 2, which is
    // the same distortion in the other direction.
    level1: { pt: 'básico', en: 'foundational' },
    level2: { pt: 'intermediário', en: 'working' },
  },
  // The locale OFFER (#172), shown when the URL's locale is not the visitor's own language. Every string
  // here is rendered in the SUGGESTED language, not the page's — it is addressed to a reader who may not
  // read the page's language at all, so writing it in that language would defeat the purpose. The region
  // therefore also carries its own `lang`, or a screen reader pronounces it with the wrong voice.
  localeSuggestion: {
    //
    // Register follows the rest of this catalog, which is first-person and informal ("pra", "me conta",
    // "te fazer construir melhor") — "Prefere ler em português?" read a notch more deferential than the
    // person who writes everything else on the page.
    //
    // The question names no language: between them the two buttons already do, and in a ten-word notice
    // each edition was otherwise named twice. The buttons carry the nouns, the question carries the ask.
    message: {
      pt: 'Esta página está em inglês. Quer trocar?',
      en: 'This page is in Portuguese. Want to switch?',
    },
    // Accept states its consequence rather than merely closing the notice — it also PERSISTS the choice,
    // overriding detection from then on, and a control that changes state should say what it changes to.
    accept: { pt: 'Ler em português', en: 'Read in English' },
    // Dismiss names the language too, for the same reason. "Continue", not "keep reading": a large share
    // of these readers arrive cold from a shared link and have not read anything yet.
    dismiss: { pt: 'Continuar em inglês', en: 'Continue in Portuguese' },
    // aria-label for the region.
    notice: { pt: 'Sugestão de idioma', en: 'Language suggestion' },
  },
  column: {
    loading: { pt: 'Carregando', en: 'Loading' },
    back: { pt: 'Voltar', en: 'Back' },
  },
  article: {
    notFoundTitle: { pt: 'Artigo não encontrado', en: 'Article not found' },
    notFoundBody: { pt: 'Este artigo não existe ou não está publicado.', en: 'This article does not exist or is not published.' },
    allArticles: { pt: '← Todos os artigos', en: '← All articles' },
  },
  share: {
    share: { pt: 'Compartilhar', en: 'Share' },
    copied: { pt: 'Copiado', en: 'Copied' },
  },
  video: {
    play: { pt: 'Reproduzir vídeo', en: 'Play video' },
    watch: { pt: '▶ Assistir', en: '▶ Watch' },
    defaultTitle: { pt: 'Vídeo', en: 'Video' },
  },
  consent: {
    notice: { pt: 'Aviso de cookies', en: 'Cookie notice' },
    message: {
      pt: 'Uso o Google Analytics pra entender o que é lido por aqui. Ele só carrega se você aceitar — nada de terceiros roda antes disso.',
      en: 'I use Google Analytics to understand what gets read here. It only loads if you accept — nothing third-party runs before that.',
    },
    accept: { pt: 'Aceitar', en: 'Accept' },
    reject: { pt: 'Recusar', en: 'Decline' },
    learnMore: { pt: 'Como o Google usa esses dados', en: 'How Google uses this data' },
    manage: { pt: 'Preferências de cookies', en: 'Cookie preferences' },
  },
} satisfies Record<string, Record<string, Entry>>;

export { strings };

/** Dot-path union of every string leaf — so `t('nav.articles')` is checked and a typo is a compile error. */
export type MessageKey = LeafPaths<typeof strings>;

type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends Entry ? K : T[K] extends object ? `${K}.${LeafPaths<T[K]>}` : never;
}[keyof T & string];

/** Resolve a dot-path key to the string for the active locale. */
export function translate(locale: Locale, key: MessageKey): string {
  let node: unknown = strings;
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown>)[part];
  }
  return (node as Entry)[locale];
}
