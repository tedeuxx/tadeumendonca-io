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
    cv: { pt: 'CV', en: 'CV' },
    rampup: { pt: 'Ramp-up', en: 'Ramp-up' },
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
    bodyStrong2: { pt: 'sistemas agentic em produção', en: 'agentic systems in production' },
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
  // The ramp-up page's chrome. Its BODY is markdown-in-repo (content/rampup.md) and English-only for
  // now — long-form content i18n is outside the locale layer's scope (ADR-0032); it joins the article
  // parity slice. So these keys wrap an English body in the visitor's language, which is deliberate.
  rampup: {
    heading: { pt: 'Ramp-Up — Becoming an AI Engineer', en: 'Ramp-Up — Becoming an AI Engineer' },
    // Document title (the site name is appended by useDocumentHead).
    title: { pt: 'Ramp-up para AI Engineer', en: 'Ramp-up to AI Engineer' },
    kicker: { pt: 'Plano aberto · em andamento', en: 'Open plan · in progress' },
    metaDescription: {
      pt: 'O plano que montei para migrar de arquiteto de aplicações cloud para AI Engineer: o raciocínio, os cinco pilares, o roadmap de 6–12 meses e as fontes que estou realmente usando.',
      en: 'The plan I built to move from cloud application architect to AI Engineer: the reasoning, the five pillars, the 6–12 month roadmap, and the sources I am actually using.',
    },
  },
  portfolio: {
    heading: { pt: 'Portfólio', en: 'Portfolio' },
    intro: {
      pt: 'Código aberto pra você estudar, clonar e usar. Cresce conforme as automações graduam.',
      en: 'Open source for you to study, clone and use. It grows as the automations graduate.',
    },
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
