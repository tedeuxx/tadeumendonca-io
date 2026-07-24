// The CV, authored in BOTH locales (see `types/profile.ts` for why the source shape differs from the
// one components read). English is the canonical edition — it is what LinkedIn carries and what the
// prerender baseline serves (ADR-0024); the pt-BR edition is a translation of it, not an independent
// CV, so the two can never disagree on facts: dates, employers, official job titles and certification
// names are written ONCE and shared.
//
// Translation policy: prose, category labels and spoken languages localize. Technical terms, product
// names and official job titles stay English in both — that is how a Brazilian senior engineering CV
// actually reads, and translating the positioning terms ("agentic development", "AI-native") would
// weaken the market match they exist to win.
//
// Positioning: AI Engineer (agentic development / applied GenAI), anchored in SDLC + distributed
// systems. Client names are never used — sectors only.
import type { Profile, ProfileSource } from '../types/profile';
import { resolveProfile } from './resolveProfile';
import { careerYears, YEARS_TOKEN } from '../lib/experience';
import avatar from '../assets/avatar.jpg';

// Years of experience are written as `{{years}}` and DERIVED from the dates below — never typed out.
// The figure was hardcoded as "17" here and in the ramp-up page, and had drifted by more than a year
// (the earliest role starts 2008-03); nothing recomputed it. See lib/experience.ts and issue #82.
const sourceTemplate: ProfileSource = {
  profile_id: 'me',
  name: 'Luiz Tadeu Mendonça',
  avatar_url: avatar,
  headline: {
    en:
      'AI Engineer — Agentic Development & GenAI Apps | AI-DLC / Loop Engineering with Claude Code & Kiro | ' +
      'Python · TypeScript · AWS · Terraform | {{years}}y across SDLC & Distributed Systems',
    pt:
      'AI Engineer — Agentic Development & GenAI Apps | AI-DLC / Loop Engineering com Claude Code & Kiro | ' +
      'Python · TypeScript · AWS · Terraform | {{years}} anos em SDLC & Sistemas Distribuídos',
  },
  summary: {
    en:
      'AI Engineer applying AI-native development — Claude Code, Kiro, and AI-DLC / Loop Engineering — to ' +
      'design, build and ship production-ready systems, anchored in {{years}} years of software engineering across ' +
      'enterprise SDLC and distributed systems. My lane is applied GenAI and agentic development, not machine ' +
      'learning research: I build with agentic patterns — tool-calling, RAG, memory, evaluation loops, MCP — ' +
      'and bring the SDLC rigor that turns AI work into production software. Python for AI, agents and backend; ' +
      'TypeScript for the full-stack and web layer.',
    pt:
      'AI Engineer aplicando desenvolvimento AI-native — Claude Code, Kiro e AI-DLC / Loop Engineering — para ' +
      'projetar, construir e entregar sistemas prontos para produção, ancorado em {{years}} anos de engenharia de ' +
      'software em SDLC corporativo e sistemas distribuídos. Minha faixa é GenAI aplicada e agentic development, ' +
      'não pesquisa em machine learning: construo com padrões agênticos — tool-calling, RAG, memória, loops de ' +
      'avaliação, MCP — e trago o rigor de SDLC que transforma trabalho de IA em software de produção. Python ' +
      'para IA, agentes e backend; TypeScript para a camada full-stack e web.',
  },
  location: { en: 'São Paulo — Brazil', pt: 'São Paulo — Brasil' },
  experience: [
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Senior Cloud Application Architect',
      start_date: '2023-04',
      end_date: null,
      description: {
        en:
          'Embedded in enterprise engineering teams delivering cloud-native, distributed systems end-to-end — ' +
          'from application code to infrastructure as code — while moving delivery into an AI-native loop with ' +
          'Claude Code, Kiro and AI-DLC / Loop Engineering practices.',
        pt:
          'Alocado dentro de times de engenharia corporativos entregando sistemas distribuídos cloud-native de ' +
          'ponta a ponta — do código da aplicação à infraestrutura como código — enquanto movia a entrega para um ' +
          'loop AI-native com Claude Code, Kiro e práticas de AI-DLC / Loop Engineering.',
      },
      highlights: {
        en: [
          'Adopted AI-native development (Claude Code, Kiro, AI-DLC / Loop Engineering) to design, build and ' +
            'ship production-ready systems, and matured these practices for how engineering teams adopt them.',
          'Built an internal knowledge platform with a bidirectional MCP server and semantic search (vector ' +
            'embeddings on Amazon Bedrock), enabling AI agents to both search and create knowledge.',
          'Architected cloud-native distributed systems for enterprise programs in regulated industries — ' +
            'financial services, aerospace, energy — navigating compliance and data-sovereignty constraints.',
          'Developed reusable Terraform modules, deployment patterns and internal tooling that other ' +
            'engineering teams build on.',
          'Led engagements across LATAM, presenting architecture and delivery strategy to C-level and ' +
            'technical stakeholders in English, Spanish and Portuguese.',
        ],
        pt: [
          'Adotei desenvolvimento AI-native (Claude Code, Kiro, AI-DLC / Loop Engineering) para projetar, ' +
            'construir e entregar sistemas prontos para produção, e amadureci essas práticas para a forma como ' +
            'times de engenharia as adotam.',
          'Construí uma plataforma interna de conhecimento com um servidor MCP bidirecional e busca semântica ' +
            '(vector embeddings no Amazon Bedrock), permitindo que agentes de IA pesquisassem e criassem conhecimento.',
          'Arquitetei sistemas distribuídos cloud-native para programas corporativos em setores regulados — ' +
            'serviços financeiros, aeroespacial, energia — navegando restrições de compliance e soberania de dados.',
          'Desenvolvi módulos Terraform reutilizáveis, padrões de deployment e ferramentas internas que outros ' +
            'times de engenharia usam como base.',
          'Conduzi engajamentos na América Latina, apresentando arquitetura e estratégia de entrega para ' +
            'stakeholders técnicos e C-level em inglês, espanhol e português.',
        ],
      },
    },
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Cloud Application Architect',
      start_date: '2021-01',
      end_date: '2023-03',
      description: {
        en:
          'Architected and implemented cloud-native solutions embedded within enterprise client teams, ' +
          'operating under legacy, compliance and data-sovereignty constraints.',
        pt:
          'Arquitetei e implementei soluções cloud-native alocado dentro de times de clientes corporativos, ' +
          'operando sob restrições de legado, compliance e soberania de dados.',
      },
      highlights: {
        en: [
          'Designed and shipped cloud-native applications end-to-end, from ideation through production.',
          'Developed Terraform modules across basic and advanced infrastructure patterns for application ' +
            'deployments on AWS.',
          'Applied software engineering practices to infrastructure as code to standardize and accelerate ' +
            'cloud adoption across client development teams.',
          'Worked hands-on with serverless and container stacks: Lambda, ECS/EKS, API Gateway, DynamoDB, S3, SQS/SNS.',
        ],
        pt: [
          'Projetei e entreguei aplicações cloud-native de ponta a ponta, da concepção à produção.',
          'Desenvolvi módulos Terraform cobrindo padrões de infraestrutura básicos e avançados para deploy de ' +
            'aplicações na AWS.',
          'Apliquei práticas de engenharia de software à infraestrutura como código para padronizar e acelerar a ' +
            'adoção de cloud nos times de desenvolvimento dos clientes.',
          'Trabalhei hands-on com stacks serverless e de containers: Lambda, ECS/EKS, API Gateway, DynamoDB, S3, SQS/SNS.',
        ],
      },
    },
    {
      company: 'Globo.com',
      title: 'Senior DevOps Engineer',
      start_date: '2020-06',
      end_date: '2021-01',
      description: {
        en:
          'Owned the observability foundation for a large-scale direct-to-consumer streaming launch, spanning ' +
          'frontend, backend and infrastructure layers.',
        pt:
          'Responsável pela fundação de observabilidade de um lançamento de streaming direto ao consumidor em ' +
          'larga escala, cobrindo as camadas de frontend, backend e infraestrutura.',
      },
      highlights: {
        en: [
          'Built an end-to-end observability platform integrating AppDynamics, Grafana, Prometheus and Zabbix ' +
            'into a unified monitoring solution.',
          'Instrumented frontend (Angular) and backend (Spring Boot) services alongside infrastructure to ' +
            'support a high-traffic launch.',
        ],
        pt: [
          'Construí uma plataforma de observabilidade ponta a ponta integrando AppDynamics, Grafana, Prometheus ' +
            'e Zabbix em uma solução unificada de monitoração.',
          'Instrumentei serviços de frontend (Angular) e backend (Spring Boot) junto com a infraestrutura para ' +
            'suportar um lançamento de alto tráfego.',
        ],
      },
    },
    {
      company: 'Accenture',
      title: 'Digital Business Integration Consultant',
      start_date: '2008-03',
      end_date: '2020-06',
      description: {
        en:
          'Application architect for web and mobile products, designing distributed systems and integration ' +
          'layers across large enterprise programs.',
        pt:
          'Arquiteto de aplicações para produtos web e mobile, projetando sistemas distribuídos e camadas de ' +
          'integração em grandes programas corporativos.',
      },
      highlights: {
        en: [
          'Architected web and mobile products (React, Angular, Android, iOS, Flutter frontends with Node.js ' +
            'backends), designing the integration layers connecting apps, APIs and enterprise platforms.',
          'Built and integrated large-scale distributed systems across batch and real-time processing, ' +
            'connecting enterprise platforms in retail, telecom and e-commerce.',
          'Delivered across the full SDLC for enterprise clients, from requirements through production.',
        ],
        pt: [
          'Arquitetei produtos web e mobile (frontends em React, Angular, Android, iOS e Flutter com backends ' +
            'Node.js), projetando as camadas de integração que conectam apps, APIs e plataformas corporativas.',
          'Construí e integrei sistemas distribuídos de larga escala entre processamento batch e tempo real, ' +
            'conectando plataformas corporativas em varejo, telecom e e-commerce.',
          'Entreguei ao longo de todo o SDLC para clientes corporativos, de requisitos à produção.',
        ],
      },
    },
  ],
  education: [
    {
      institution: 'Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)',
      degree: { en: "Bachelor's Degree", pt: 'Bacharelado' },
      field: {
        en: 'Information Technology / Systems Analysis',
        pt: 'Tecnologia da Informação / Análise de Sistemas',
      },
      start_date: '2006',
      end_date: '2010',
    },
  ],
  // badge_image_url (the official Credly image) and credential_url are still missing; until they are
  // filled in, the CV falls back to the typographic seal built from badge_label.
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services (AWS)', badge_label: 'SA\nPRO' },
    { name: 'AWS Certified AI Practitioner', issuer: 'Amazon Web Services (AWS)', badge_label: 'AI\nPRA' },
    { name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services (AWS)', badge_label: 'DEV\nASC' },
    { name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services (AWS)', badge_label: 'SA\nASC' },
    { name: 'AWS Well-Architected Proficient', issuer: 'Amazon Web Services (AWS)', badge_label: 'W·A' },
  ],
  skills: [
    {
      label: { en: 'AI & Agentic', pt: 'IA & Agentes' },
      items: [
        'Agentic AI Development',
        'Applied Generative AI',
        'Large Language Models (LLM)',
        'AI Agents & Tool-Calling',
        'RAG (Retrieval-Augmented Generation)',
        'MCP (Model Context Protocol)',
        'Context & Prompt Engineering',
        'Agent Evaluation (LLM-as-judge)',
      ],
    },
    {
      label: { en: 'Languages', pt: 'Linguagens' },
      items: ['Python', 'TypeScript', 'JavaScript', 'Node.js', 'Java'],
    },
    {
      label: { en: 'Backend & Distributed Systems', pt: 'Backend & Sistemas Distribuídos' },
      items: [
        'Distributed Systems Architecture',
        'Microservices',
        'Event-Driven Architecture',
        'Backend-for-Frontend (BFF)',
        'API Design',
      ],
    },
    {
      label: { en: 'Cloud & Infra', pt: 'Cloud & Infra' },
      items: [
        'AWS (Bedrock, Lambda, ECS, EKS, S3, DynamoDB, API Gateway)',
        'Terraform',
        'Infrastructure as Code',
        'CloudFormation',
      ],
    },
    {
      label: { en: 'Practices & Tooling', pt: 'Práticas & Ferramentas' },
      items: ['AI-DLC / Loop Engineering', 'Claude Code', 'Kiro', 'CI/CD', 'Automated Testing', 'Observability'],
    },
    {
      label: { en: 'Languages (spoken)', pt: 'Idiomas' },
      items: {
        en: ['Portuguese (Native)', 'English (Advanced)', 'Spanish (Intermediate)'],
        pt: ['Português (nativo)', 'Inglês (avançado)', 'Espanhol (intermediário)'],
      },
    },
  ],
  metadata: {
    github: 'https://github.com/tedeuxx',
    linkedin: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530',
  },
  updated_at: '2026-07-21',
};

/** Career length, derived from the earliest `start_date` above — the single source for the figure. */
export const CAREER_YEARS = careerYears(sourceTemplate.experience);

/**
 * Resolve `{{years}}` in any authored prose. Exported because the ramp-up page states the same figure
 * and must resolve it from the same constant — two substitution helpers would be two things to drift.
 */
export const withYears = (text: string) => text.split(YEARS_TOKEN).join(String(CAREER_YEARS));

/**
 * The CV with `{{years}}` resolved. Only the two prose fields carry the token; everything else is
 * passed through untouched, so this cannot accidentally rewrite a job title or a date.
 */
export const profileSource: ProfileSource = {
  ...sourceTemplate,
  headline: { en: withYears(sourceTemplate.headline.en), pt: withYears(sourceTemplate.headline.pt) },
  summary: sourceTemplate.summary && {
    en: withYears(sourceTemplate.summary.en),
    pt: withYears(sourceTemplate.summary.pt),
  },
};

/**
 * The CANONICAL edition — English, resolved once (ADR-0024: English is what LinkedIn carries and what
 * the prerender baseline serves). The live SPA resolves per active locale via `useProfile`; this
 * constant is the fixed reference for anything that must be canonical regardless of the visitor.
 */
export const profile: Profile = resolveProfile(profileSource, 'en');
