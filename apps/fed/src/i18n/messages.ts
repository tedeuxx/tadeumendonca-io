// The typed message catalog — EVERY UI-chrome string in both locales. The CV *content*
// (src/data/profile.ts, ADR-0024 canonical) stays English and is NOT here: only the UI chrome
// localizes. In EN mode chrome + content are English; in PT mode pt-BR chrome wraps the English CV.
import type { Locale } from './config';

/** Nested, fully-typed shape of the catalog. Both locales must satisfy it, so a missing key in
 *  either locale is a compile error. */
export interface Messages {
  nav: {
    articles: string;
    portfolio: string;
    contact: string;
    cv: string;
    openMenu: string;
    closeMenu: string;
  };
  locale: {
    /** aria-label for the PT/EN toggle group. */
    switch: string;
  };
  marquee: {
    subjects: string;
  };
  hero: {
    badge: string;
    badgeAccent: string;
    taglineLead: string;
    taglineAccent: string;
    bodyLead: string;
    bodyStrong1: string;
    bodyConnector: string;
    bodyStrong2: string;
    bodyTail: string;
  };
  tracks: {
    pessoal: string;
    engenharia: string;
  };
  articles: {
    headingBold: string;
    headingRest: string;
    subtitle: string;
    filtersLabel: string;
    filterAll: string;
    takeaway: string;
    hasVideo: string;
    read: string;
    viewOnLinkedin: string;
    empty: string;
  };
  portfolio: {
    heading: string;
    intro: string;
    payoff: string;
    statusLive: string;
    statusWip: string;
    viewGithub: string;
    viewLive: string;
    emptyLead: string;
    emptyLink: string;
    viewAll: string;
    metaDescription: string;
  };
  contact: {
    heading: string;
  };
  contactLinks: {
    defaultTitle: string;
  };
  about: {
    heading: string;
    body: string;
    whoWrites: string;
  };
  cv: {
    experience: string;
    education: string;
    certifications: string;
    skills: string;
    present: string;
    unavailable: string;
  };
  column: {
    loading: string;
    back: string;
  };
  article: {
    notFoundTitle: string;
    notFoundBody: string;
    allArticles: string;
  };
  share: {
    share: string;
    copied: string;
  };
  video: {
    play: string;
    watch: string;
    defaultTitle: string;
  };
}

const pt: Messages = {
  nav: {
    articles: 'Artigos',
    portfolio: 'Portfólio',
    contact: 'Contato',
    cv: 'CV',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
  },
  locale: {
    switch: 'Idioma',
  },
  marquee: {
    subjects: 'Assuntos',
  },
  hero: {
    badge: 'Conteúdo técnico aberto',
    badgeAccent: '▶ Da vida pessoal à produção',
    taglineLead: 'Aprenda a construir com IA —',
    taglineAccent: 'do dia a dia à produção',
    bodyLead: 'Compartilho o que aprendo construindo com IA — de experimentos que automatizam a',
    bodyStrong1: 'vida pessoal com Claude Cowork',
    bodyConnector: 'a',
    bodyStrong2: 'sistemas agentic em produção',
    bodyTail:
      '. Trade-offs reais e código aberto pra você aplicar, seja na sua rotina ou na sua empresa. O objetivo é te fazer construir melhor — quem escreve isso é consequência, não o ponto.',
  },
  tracks: {
    pessoal: 'Vida pessoal',
    engenharia: 'Engenharia',
  },
  articles: {
    headingBold: 'Artigos',
    headingRest: 'pra você aplicar',
    subtitle: 'Escrita técnica com trade-offs explícitos · vídeos embedados no texto',
    filtersLabel: 'Filtrar por trilha',
    filterAll: 'Tudo',
    takeaway: 'Você sai sabendo',
    hasVideo: '▶ vídeo no artigo',
    read: 'Ler artigo',
    viewOnLinkedin: 'Ver no LinkedIn',
    empty: 'Ainda não há artigos nesta trilha.',
  },
  portfolio: {
    heading: 'Portfólio',
    intro: 'Código aberto pra você estudar, clonar e usar. Cresce conforme as automações graduam.',
    payoff: 'O que você tira disso',
    statusLive: 'Live',
    statusWip: 'WIP',
    viewGithub: 'Ver no GitHub',
    viewLive: 'Ver ao vivo',
    emptyLead: 'Catálogo em construção.',
    emptyLink: 'Acompanhe no GitHub',
    viewAll: '→ Ver catálogo completo',
    metaDescription: 'Automações, agentes e projetos — o catálogo no GitHub.',
  },
  contact: {
    heading: 'Algo aqui te ajudou? Me conta',
  },
  contactLinks: {
    defaultTitle: 'Onde me encontrar',
  },
  about: {
    heading: 'Sobre este site',
    body: 'Escrevo e construo em público sobre engenharia de IA. Se algo aqui te ajudou a evoluir, cumpriu o papel.',
    whoWrites: 'Quem escreve',
  },
  cv: {
    experience: 'Experiência',
    education: 'Formação',
    certifications: 'Certificações',
    skills: 'Habilidades',
    present: 'Atual',
    unavailable: 'Perfil ainda não disponível.',
  },
  column: {
    loading: 'Carregando',
    back: 'Voltar',
  },
  article: {
    notFoundTitle: 'Artigo não encontrado',
    notFoundBody: 'Este artigo não existe ou não está publicado.',
    allArticles: '← Todos os artigos',
  },
  share: {
    share: 'Compartilhar',
    copied: 'Copiado',
  },
  video: {
    play: 'Reproduzir vídeo',
    watch: '▶ Assistir',
    defaultTitle: 'Vídeo',
  },
};

const en: Messages = {
  nav: {
    articles: 'Articles',
    portfolio: 'Portfolio',
    contact: 'Contact',
    cv: 'CV',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  locale: {
    switch: 'Language',
  },
  marquee: {
    subjects: 'Subjects',
  },
  hero: {
    badge: 'Open technical content',
    badgeAccent: '▶ From personal life to production',
    taglineLead: 'Learn to build with AI —',
    taglineAccent: 'from everyday life to production',
    bodyLead: 'I share what I learn building with AI — from experiments that automate',
    bodyStrong1: 'personal life with Claude Cowork',
    bodyConnector: 'to',
    bodyStrong2: 'agentic systems in production',
    bodyTail:
      '. Real trade-offs and open source for you to apply, whether in your routine or at your company. The goal is to help you build better — who writes it is a by-product, not the point.',
  },
  tracks: {
    pessoal: 'Personal life',
    engenharia: 'Engineering',
  },
  articles: {
    headingBold: 'Articles',
    headingRest: 'to put to use',
    subtitle: 'Technical writing with explicit trade-offs · videos embedded in the text',
    filtersLabel: 'Filter by track',
    filterAll: 'All',
    takeaway: "What you'll walk away with",
    hasVideo: '▶ video in the article',
    read: 'Read article',
    viewOnLinkedin: 'View on LinkedIn',
    empty: 'No articles in this track yet.',
  },
  portfolio: {
    heading: 'Portfolio',
    intro: 'Open source for you to study, clone and use. It grows as the automations graduate.',
    payoff: 'What you take away',
    statusLive: 'Live',
    statusWip: 'WIP',
    viewGithub: 'View on GitHub',
    viewLive: 'View live',
    emptyLead: 'Catalog under construction.',
    emptyLink: 'Follow on GitHub',
    viewAll: '→ View the full catalog',
    metaDescription: 'Automations, agents and projects — the catalog on GitHub.',
  },
  contact: {
    heading: 'Did something here help you? Tell me',
  },
  contactLinks: {
    defaultTitle: 'Where to find me',
  },
  about: {
    heading: 'About this site',
    body: 'I write and build in public about AI engineering. If something here helped you grow, it did its job.',
    whoWrites: 'Who writes this',
  },
  cv: {
    experience: 'Experience',
    education: 'Education',
    certifications: 'Certifications',
    skills: 'Skills',
    present: 'Present',
    unavailable: 'Profile not available yet.',
  },
  column: {
    loading: 'Loading',
    back: 'Back',
  },
  article: {
    notFoundTitle: 'Article not found',
    notFoundBody: 'This article does not exist or is not published.',
    allArticles: '← All articles',
  },
  share: {
    share: 'Share',
    copied: 'Copied',
  },
  video: {
    play: 'Play video',
    watch: '▶ Watch',
    defaultTitle: 'Video',
  },
};

export const messages: Record<Locale, Messages> = { pt, en };

/** Dot-path union of every string leaf in the catalog — so `t('nav.articles')` is checked and a
 *  typo or missing key is a compile error. */
export type MessageKey = Leaves<Messages>;

type Leaves<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
    }[keyof T & string];

/** Resolve a dot-path key to the string for the active locale. */
export function translate(locale: Locale, key: MessageKey): string {
  let node: unknown = messages[locale];
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown>)[part];
  }
  return node as string;
}
