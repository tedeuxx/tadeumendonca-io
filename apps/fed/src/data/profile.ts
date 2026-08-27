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

// Years of experience are written as `{{years}}` and resolved by `withYears`. The PUBLIC figure is an
// evergreen floor — "18+" — anchored to the formal career start (2008-03). Evergreen so it never drifts
// across surfaces (site vs LinkedIn/CV) and stays true as the count grows (#124). The exact count is
// still DERIVED from the dates below (CAREER_YEARS, currently 18) and kept as the honesty guard: a test
// asserts CAREER_YEARS >= the published floor (18), so the "+" is always true. History: the figure was a
// hardcoded "17" that drifted (issue #82), then a bare derived number that diverged from manual surfaces;
// the evergreen floor fixes both. See lib/experience.ts.
const sourceTemplate: ProfileSource = {
  profile_id: 'me',
  name: 'Luiz Tadeu Mendonça',
  avatar_url: avatar,
  headline: {
    en:
      'AI Engineer — AI-DLC & Agent Harness Engineering | ' +
      'Claude Code · Kiro · Python · Node.js / TypeScript · AWS · Terraform | ' +
      '{{years}} years across SDLC & Distributed Systems',
    pt:
      'AI Engineer — AI-DLC & Agent Harness Engineering | ' +
      'Claude Code · Kiro · Python · Node.js / TypeScript · AWS · Terraform | ' +
      '{{years}} anos em SDLC & Sistemas Distribuídos',
  },
  // THE `applied GenAI` PHRASE IN THIS PARAGRAPH IS THE ONLY STRUCTURED SITE HOME THAT EXACT PHRASE HAS,
  // AND NOTHING PINS IT. Both editions of the block IMMEDIATELY BELOW carry it — en "My lane is applied
  // GenAI and agentic development", pt "Minha faixa é GenAI aplicada e agentic development". No line
  // number is cited on purpose: a citation into the very block this comment sits on top of is falsified
  // by editing this comment, which is the defect that produced this note in the first place. Grep the
  // phrase. The phrase moved here — rather than staying in the headline — when #451 (PR #457) shortened
  // the headline to the owner's string; the compensation for that cut was that this paragraph would
  // carry the term instead. That compensation was recorded in an Issue comment, and an
  // Issue comment is not reachable by the person who would break it: the failure mode is an editor
  // trimming this long paragraph, and that editor is standing HERE, not in the archive of PR #457.
  //
  // WHY NOTHING PINS IT, precisely. `vocabulary.test.ts` guards the PRACTICE NAME
  // (`Agent Harness Engineering`) and does not know this phrase exists — `GenAI` appears in no test file
  // under `apps/fed/src`, so deleting the clause from this paragraph ships GREEN. Verified rather than
  // assumed: `grep -rln GenAI apps/fed/src apps/fed/e2e` returns exactly three files, all of them
  // content/data (this one and `content/rampup.{en,pt}.md`), and no test. A mechanical guard — an
  // assertion pinning the TOKEN, not the sentence, so rewording stays free — is the only real fix and is
  // deliberately NOT made here: it is a test change, and this was a headline slice. It is the owner's to
  // open.
  //
  // WHY THIS IS A NOTE AND NOT AN ALARM — the "only home" claim is about the STRUCTURED surfaces, and the
  // stronger reading of it is false. The exact phrase is unique to this block; the TOKEN is not.
  // `content/rampup.{en,pt}.md` carries `GenAI` at `:1`, `:3`, `:16` and `:20` of each edition, and `:1`
  // is a near-structured target-role line on a crawled page. So if this paragraph lost the term tomorrow,
  // retrieval would degrade, not disappear — the risk is SMALLER than the framing the compensations were
  // ratified against. Written accurately on purpose: an overstated warning is the kind that gets
  // discounted the first time someone checks it.
  //
  // WHERE IT REACHES BESIDES THE SCREEN: `CVSection.tsx` renders this paragraph (`{profile.summary}`)
  // inside its `data-print="cv"` block with no `data-print="hide"` hook, so it is in the ATS artifact —
  // the PDF a recruiter's parser reads — not only on `/me`.
  summary: {
    en:
      'AI Engineer applying AI-native development — Claude Code, Kiro, AI-DLC & Agent Harness Engineering — to design, ' +
      "build and ship production-ready systems. That's the newest layer on {{years}} years of software " +
      'engineering, not a fresh start: I began in enterprise integration and packaged software, moved into ' +
      'modern product engineering building web and native-mobile apps, and spent the last years as a ' +
      'distributed-applications architect — cloud and distributed systems on AWS, across regulated industries ' +
      'like financial services, aerospace and energy. My lane is applied GenAI and agentic development, not ' +
      'machine learning research: I build with agentic patterns — tool-calling, RAG, memory, evaluation loops, ' +
      'MCP — and bring the SDLC rigor that turns AI work into production software. Python for AI, agents and ' +
      'backend; TypeScript for the full-stack and web layer.',
    pt:
      'AI Engineer aplicando desenvolvimento AI-native — Claude Code, Kiro, AI-DLC & Agent Harness Engineering — para ' +
      'projetar, construir e entregar sistemas prontos para produção. Essa é a camada mais recente sobre ' +
      '{{years}} anos de engenharia de software, não um recomeço: comecei em integração de sistemas corporativos ' +
      'e software empacotado, passei para engenharia de produto moderna construindo apps web e mobile nativo, e ' +
      'nos últimos anos atuei como arquiteto de aplicações distribuídas — cloud e sistemas distribuídos na AWS, ' +
      'em setores regulados como serviços financeiros, aeroespacial e energia. Minha faixa é GenAI aplicada e ' +
      'agentic development, não pesquisa em machine learning: construo com padrões agênticos — tool-calling, ' +
      'RAG, memória, loops de avaliação, MCP — e trago o rigor de SDLC que transforma trabalho de IA em software ' +
      'de produção. Python para IA, agentes e backend; TypeScript para a camada full-stack e web.',
  },
  location: { en: 'São Paulo — Brazil', pt: 'São Paulo — Brasil' },
  experience: [
    {
      company: 'Amazon Web Services — Professional Services',
      title: 'Senior Delivery Consultant — App Modernization',
      start_date: '2023-04',
      end_date: null,
      description: {
        en:
          'New-platform launch programs — full-stack web and native mobile. Leading the implementation: ' +
          'solution architecture, AWS infrastructure and the technical direction of the build. The ' +
          'launches: a custom cloud-native replacement for a SaaS streaming platform, native across six ' +
          "platforms, and — as tech lead — an oil & gas operator's landing zone with the upstream " +
          'operational-monitoring platform on it. ' +
          'Embedded in enterprise engineering teams delivering cloud-native, distributed systems end-to-end — ' +
          'from application code to infrastructure as code — while moving delivery into an AI-native loop with ' +
          'Claude Code, Kiro and AI-DLC & Agent Harness Engineering practices.',
        pt:
          'Programas de launch de novas plataformas — web full-stack e mobile nativo. Liderando a ' +
          'implementação: arquitetura de solução, infraestrutura AWS e a direção técnica da construção. Os ' +
          'launches: uma substituição custom e cloud-native para uma plataforma de streaming SaaS, nativa ' +
          'em seis plataformas, e — como tech lead — a landing zone de uma operadora de óleo & gás com a ' +
          'plataforma upstream de acompanhamento operacional sobre ela. ' +
          'Alocado dentro de times de engenharia corporativos entregando sistemas distribuídos cloud-native de ' +
          'ponta a ponta — do código da aplicação à infraestrutura como código — enquanto movia a entrega para um ' +
          'loop AI-native com Claude Code, Kiro e práticas de AI-DLC & Agent Harness Engineering.',
      },
      highlights: {
        en: [
          'Adopted AI-native development (Claude Code, Kiro, AI-DLC & Agent Harness Engineering) in 2026 to design, ' +
            'build and ship production-ready systems, and structured the practice for team-scale adoption.',
          'Architected a custom, cloud-native replacement for a SaaS streaming platform — native apps across five ' +
            'platforms (iOS, Android, Tizen, webOS, Apple TV) plus Web, on a BFF + microservices backend, designed ' +
            'for future B2B enablement — from envisioning and team setup through to steering multi-vendor delivery.',
          "As tech lead, stood up an oil & gas operator's AWS landing zone and delivered its first modernized " +
            'workload — an upstream operational-monitoring platform — owning the infrastructure and coordinating ' +
            "a separate consultancy's development across a ~2-year engagement the client renewed on the strength " +
            'of the deliveries.',
          'Built, hands-on, the serverless data integration for an aerospace manufacturer after its ' +
            'Heroku-to-AWS migration — Salesforce into a modernized custom backend, on Terraform, ' +
            'Amazon AppFlow and Python.',
          'Conceived and kicked off an internal knowledge platform — a bidirectional MCP server and semantic ' +
            'search — embeddings on Amazon Bedrock, stored and queried on Amazon S3 Vectors — so AI agents can ' +
            'both search and create knowledge; MVP in progress.',
          'Led engagements across LATAM, presenting architecture and delivery strategy to C-level and ' +
            'technical stakeholders in English, Spanish and Portuguese.',
        ],
        pt: [
          'Adotei desenvolvimento AI-native (Claude Code, Kiro, AI-DLC & Agent Harness Engineering) em 2026 para ' +
            'projetar, construir e entregar sistemas prontos para produção, e estruturei a prática para ' +
            'adoção em escala de time.',
          'Arquitetei uma substituição custom e cloud-native para uma plataforma de streaming SaaS — apps ' +
            'nativos em cinco plataformas (iOS, Android, Tizen, webOS, Apple TV) mais Web, sobre um backend BFF + ' +
            'microserviços, desenhada para habilitar B2B no futuro — do envisioning e montagem do time à ' +
            'condução da entrega multi-fornecedor.',
          'Como tech lead, levantei a landing zone AWS de uma operadora de óleo & gás e entreguei seu primeiro ' +
            'workload modernizado — uma plataforma upstream de acompanhamento operacional — sendo dono da ' +
            'infraestrutura e coordenando o desenvolvimento de outra consultoria ao longo de um engajamento de ' +
            '~2 anos que o cliente renovou pela qualidade das entregas.',
          'Construí, hands-on, a integração serverless de dados de um fabricante aeroespacial depois da ' +
            'migração dele de Heroku para AWS — do Salesforce para um backend custom modernizado, em ' +
            'Terraform, Amazon AppFlow e Python.',
          'Idealizei e coloquei pra rodar uma plataforma interna de conhecimento — um servidor MCP bidirecional ' +
            'e busca semântica — embeddings no Amazon Bedrock, armazenados e consultados no Amazon S3 Vectors — ' +
            'para que agentes de IA possam pesquisar e criar conhecimento; MVP em andamento.',
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
          'New-platform launch programs — full-stack web on a cloud-native stack. Hands-on individual ' +
          'contributor into tech lead: I set the platform up and wrote application and infrastructure code. ' +
          'Architected and implemented cloud-native solutions embedded within enterprise client teams, ' +
          'operating under legacy, compliance and data-sovereignty constraints.',
        pt:
          'Programas de launch de novas plataformas — web full-stack sobre uma stack cloud-native. De ' +
          'individual contributor hands-on a tech lead: levantei a plataforma e escrevi código de aplicação e ' +
          'de infraestrutura. ' +
          'Arquitetei e implementei soluções cloud-native alocado dentro de times de clientes corporativos, ' +
          'operando sob restrições de legado, compliance e soberania de dados.',
      },
      highlights: {
        en: [
          "Stood up the cloud-native foundation of a tier-1 bank's mortgage-credit domain, migrating it off " +
            'mainframe and ASPX to a full-stack modern platform — Angular; Kotlin (Micronaut, later Spring ' +
            'Boot); EKS, ArgoCD and Istio; RDS, DynamoDB, SQS and SNS.',
          'Grew from hands-on individual contributor to tech lead of a cross-organization team of up to eight ' +
            'over ~2 years; the open-source foundation kept expanding after my rolloff.',
          'Built reusable Terraform modules and deployment patterns other engineering teams relied on, applying ' +
            'software-engineering rigor to infrastructure as code.',
        ],
        pt: [
          'Levantei a fundação cloud-native do domínio de crédito imobiliário de um banco tier-1, migrando-o de ' +
            'mainframe e ASPX para uma plataforma moderna full-stack — Angular; Kotlin (Micronaut, depois ' +
            'Spring Boot); EKS, ArgoCD e Istio; RDS, DynamoDB, SQS e SNS.',
          'Cresci de individual contributor hands-on a tech lead de um time cross-organização de até oito ' +
            'pessoas ao longo de ~2 anos; a fundação open-source seguiu crescendo após meu rolloff.',
          'Construí módulos Terraform e padrões de deploy reutilizáveis que outros times usaram como base, ' +
            'aplicando rigor de engenharia de software à infraestrutura como código.',
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
          'New-platform launch program — a direct-to-consumer sales and subscription platform. Function: ' +
          'observability and DevOps engineering, instrumenting the web revenue path end to end. ' +
          'Owned observability for the sales / subscription journey of a major direct-to-consumer streaming ' +
          'service and its channels — a business-critical revenue path on Angular, Salesforce and Spring Boot.',
        pt:
          'Programa de launch de nova plataforma — uma plataforma de vendas e assinatura direto ao consumidor. ' +
          'Função: engenharia de observabilidade e DevOps, instrumentando o caminho de receita web de ponta a ' +
          'ponta. ' +
          'Responsável pela observabilidade da jornada de vendas / assinatura de um grande serviço de streaming ' +
          'direto ao consumidor e seus canais — um caminho de receita crítico para o negócio, em Angular, ' +
          'Salesforce e Spring Boot.',
      },
      highlights: {
        en: [
          'Built an end-to-end observability platform integrating AppDynamics, Grafana, Prometheus and Zabbix ' +
            'into a unified monitoring solution.',
          'Instrumented the Angular frontend and the Salesforce / Spring Boot backends so the revenue path had ' +
            'first-class visibility across the stack.',
        ],
        pt: [
          'Construí uma plataforma de observabilidade ponta a ponta integrando AppDynamics, Grafana, Prometheus ' +
            'e Zabbix em uma solução unificada de monitoração.',
          'Instrumentei o frontend Angular e os backends Salesforce / Spring Boot para dar ao caminho de receita ' +
            'visibilidade de primeira classe em toda a stack.',
        ],
      },
    },
    {
      company: 'Accenture',
      title: 'Digital Business Integration Consultant',
      start_date: '2015-01',
      end_date: '2020-06',
      description: {
        en:
          'New-platform launch projects — full-stack web and native mobile — from 2017 at Accenture Digital; ' +
          'enterprise integration architecture before that. Application architect, hands-on across every tier: ' +
          'mobile clients, web front ends, the backends under them and the delivery pipeline — four ' +
          'custom-build engagements across four sectors. ' +
          'Promoted to Consultant, first as an integration architect on enterprise CRM implementation programs, ' +
          'then — the turning point — as an application architect at Accenture Digital, building modern web and ' +
          'native-mobile products. This is where the modern-engineering identity was forged and the ' +
          'distributed-applications architect through-line began.',
        pt:
          'Projetos de launch de novas plataformas — web full-stack e mobile nativo — a partir de 2017 na ' +
          'Accenture Digital; arquitetura de integração corporativa antes disso. Arquiteto de aplicação, ' +
          'hands-on em todas as camadas: clientes mobile, front ends web, os backends embaixo deles e o ' +
          'pipeline de entrega — quatro engajamentos de construção custom em quatro setores. ' +
          'Promovido a Consultant, primeiro como arquiteto de integração em programas corporativos de ' +
          'implantação de CRM, e então — o ponto de virada — como arquiteto de aplicações na Accenture Digital, ' +
          'construindo produtos web e mobile nativos modernos. É aqui que a identidade de engenharia moderna se ' +
          'formou e começou o fio condutor de arquiteto de aplicações distribuídas.',
      },
      highlights: {
        en: [
          'Architected the integration layers for enterprise CRM implementation programs, connecting apps, APIs ' +
            'and heterogeneous enterprise platforms.',
          'Responsible application architect on a telecom field-force programme — three apps built in ' +
            'parallel, one hybrid (Ionic) and two native Android, the front technology fixed per app at ' +
            "requirements time by each user population's devices. Under fronts that were required to " +
            'differ, the backends were much alike in architectural concept, because we traded what ' +
            'worked across the parallel teams. Hands-on at every tier: the Android clients, a React ' +
            'back-office portal, and the Node.js / Express services under them on MongoDB and Redis, ' +
            'offline-first throughout.',
          'The offline-first problem on that programme was solved in the design rather than by adding ' +
            'infrastructure. Two off-the-shelf sync stacks were tried on the hybrid app — RabbitMQ, then ' +
            'CouchDB — and neither held for this workload, so the API contract and the non-relational data ' +
            'model were shaped so that synchronising needed no additional backend component at all: ' +
            'MongoDB on the server, SQLite on the device. That pairing was the big win of the engagement, ' +
            'and the field-salesperson app is where it was proven.',
          "The same delivery then ran end to end on both native Android apps — the field technician's " +
            "first, then the field salesperson's: look-and-feel ideation alongside the UX team, the " +
            'technical architecture, the API and data model above, the open-source private-cloud ' +
            'infrastructure, and offline-first built directly on that model — local persistence, sync and ' +
            'conflict resolution for people working with no connectivity. Auditing every event is what made ' +
            'the apps operable in the field, and it fed the stakeholder-facing analytics the same model had ' +
            'been designed to carry. Running the span twice is what makes it a practice rather than a ' +
            'one-off.',
          'Architected and shipped a Flutter app covering iOS and Android for a bank; built the DevOps ' +
            'and delivery pipeline for a commerce platform; and, in the final Accenture years, guided the ' +
            'reversal of a recurring performance problem in a Java / Spring Boot microservices backend ' +
            'running on AWS, for an education product.',
          'Left packaged software behind for custom, lean-stack product engineering — open source, ' +
            'private-cloud infrastructure, and hands-on distributed-systems design. 2017 is the seam: ' +
            'from there on, the work has been platforms being built rather than packages being ' +
            'implemented.',
          'Grew into the distributed-applications architect role carried through to today — solution design and ' +
            'tech leadership on delivery teams, as a senior individual contributor.',
        ],
        pt: [
          'Arquitetei as camadas de integração de programas corporativos de implantação de CRM, conectando ' +
            'apps, APIs e plataformas corporativas heterogêneas.',
          'Arquiteto de aplicação responsável por um programa de força de campo em telecom — três apps ' +
            'construídos em paralelo, um híbrido (Ionic) e dois Android nativo, com a tecnologia de front ' +
            'fixada por app já nos requisitos pelos dispositivos de cada população de usuários. Sob ' +
            'fronts que precisavam ser diferentes, os backends ficaram muito parecidos em conceito ' +
            'arquitetural, porque trocamos sinergias entre os times em paralelo. Hands-on em todas as ' +
            'camadas: os clientes Android, um portal de back-office em React e os serviços Node.js / ' +
            'Express embaixo deles, sobre MongoDB e Redis, offline-first do começo ao fim.',
          'O problema de offline-first desse programa foi resolvido no desenho, não somando ' +
            'infraestrutura. Duas soluções de sync de prateleira foram tentadas no app híbrido — RabbitMQ, ' +
            'depois CouchDB — e nenhuma se sustentou para essa carga, então o contrato de API e o modelo de ' +
            'dados não relacional foram desenhados de forma que sincronizar não precisasse de nenhum ' +
            'componente de backend adicional: MongoDB no servidor, SQLite no dispositivo. Essa dupla foi o ' +
            'grande acerto do engajamento, e foi no app do vendedor de campo que ela se provou.',
          'A mesma entrega então correu de ponta a ponta nos dois apps Android nativo — primeiro o do ' +
            'técnico de campo, depois o do vendedor de campo: ideação de look and feel junto com o time de ' +
            'UX, a arquitetura técnica, a API e o modelo de dados acima, a infraestrutura open source em ' +
            'private cloud, e o offline-first construído direto sobre esse modelo — persistência local, ' +
            'sync e resolução de conflito para quem trabalhava sem conectividade. Auditar cada evento é o ' +
            'que tornava os apps operáveis em campo, e alimentava a analytics de stakeholders que esse ' +
            'mesmo modelo tinha sido desenhado para carregar. Rodar isso duas vezes é o que faz disso uma ' +
            'prática, e não um caso isolado.',
          'Arquitetei e entreguei um app Flutter cobrindo iOS e Android para um banco; construí o DevOps ' +
            'e o pipeline de entrega de uma plataforma de commerce; e, nos últimos anos de Accenture, ' +
            'orientei a reversão de um problema recorrente de performance em um backend de microsserviços ' +
            'Java / Spring Boot rodando na AWS, para um produto de educação.',
          'Deixei o software de pacote para trás para engenharia de produto custom e lean stack — open ' +
            'source, infraestrutura em private cloud e desenho de sistemas distribuídos hands-on. 2017 é a ' +
            'costura: de lá para cá, o trabalho tem sido plataforma sendo construída, não pacote sendo ' +
            'implantado.',
          'Amadureci no papel de arquiteto de aplicações distribuídas que carrego até hoje — desenho de soluções ' +
            'e liderança técnica em times de entrega, como individual contributor sênior.',
        ],
      },
    },
    {
      company: 'Accenture',
      title: 'Systems Integration Analyst',
      start_date: '2008-03',
      end_date: '2015-01',
      description: {
        en:
          'Enterprise-integration SDLC — packaged implementations, ETL and SOA. Hands-on build and integration ' +
          'of large-scale distributed systems. ' +
          'The root of the career: an enterprise integration factory. Began in web development, then built and ' +
          'integrated large-scale distributed systems — batch (Informatica PowerCenter ETL) and online / ' +
          'real-time (SOA) — growing from junior to senior analyst.',
        pt:
          'SDLC de integração corporativa — implementações de pacote, ETL e SOA. Construção e integração ' +
          'hands-on de sistemas distribuídos de larga escala. ' +
          'A raiz da carreira: uma fábrica de integração corporativa. Comecei em desenvolvimento web, e então ' +
          'construí e integrei sistemas distribuídos de larga escala — batch (Informatica PowerCenter ETL) e ' +
          'online / tempo real (SOA) — crescendo de analista júnior a sênior.',
      },
      highlights: {
        en: [
          'Joined as an intern in 2008 while completing the Information Systems degree; from graduating in 2010, ' +
            'grew from junior to senior analyst building enterprise system integrations.',
          'Built and connected large-scale distributed systems across batch (Informatica PowerCenter ETL) and ' +
            'online / real-time (SOA) integration, wiring heterogeneous enterprise platforms together.',
          'Delivered across the full SDLC for enterprise clients in regulated sectors — financial services, ' +
            'telecom, e-commerce.',
        ],
        pt: [
          'Comecei em desenvolvimento web e, a partir da formatura em 2010, cresci de analista júnior a sênior ' +
            'construindo integrações de sistemas corporativos.',
          'Construí e conectei sistemas distribuídos de larga escala entre integração batch (Informatica ' +
            'PowerCenter ETL) e online / tempo real (SOA), conectando plataformas corporativas heterogêneas.',
          'Entreguei ao longo de todo o SDLC para clientes corporativos em setores regulados — serviços ' +
            'financeiros, telecom, e-commerce.',
        ],
      },
    },
  ],
  education: [
    {
      institution: 'Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)',
      degree: { en: "Bachelor's Degree", pt: 'Bacharelado' },
      field: {
        en: 'Information Systems — electives in Databases and Operating Systems',
        pt: 'Sistemas de Informação — eletivas em Banco de Dados e Sistemas Operacionais',
      },
      start_date: '2006',
      end_date: '2010',
    },
  ],
  // Official AWS/Credly badge PNGs, self-hosted under public/badges/ (no third-party image request at
  // runtime — the CVSection renders <img> from these). badge_label stays as the fallback seal. credential_url
  // (the click-through to Credly verification) is still optional/pending; without it the badge renders but is
  // not a link.
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services (AWS)', badge_label: 'SA\nPRO', badge_image_url: '/badges/aws-certified-solutions-architect-professional.png' },
    { name: 'AWS Certified AI Practitioner', issuer: 'Amazon Web Services (AWS)', badge_label: 'AI\nPRA', badge_image_url: '/badges/aws-certified-ai-practitioner.png' },
    { name: 'AI-DLC Ambassador', issuer: 'Amazon Web Services (AWS)', badge_label: 'DLC\nAMB', badge_image_url: '/badges/aws-ai-driven-development-lifecycle-ai-dlc-ambassad.png' },
    { name: 'AWS Accreditation — AI (L200)', issuer: 'Amazon Web Services (AWS)', badge_label: 'AI\nL200', badge_image_url: '/badges/aws-ai-delivery-intermediate-l200-accreditation.png' },
    { name: 'AWS Accreditation — AI (L100)', issuer: 'Amazon Web Services (AWS)', badge_label: 'AI\nL100', badge_image_url: '/badges/aws-ai-foundational-l100-accreditation.png' },
    { name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services (AWS)', badge_label: 'DEV\nASC', badge_image_url: '/badges/aws-certified-developer-associate.png' },
    { name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services (AWS)', badge_label: 'SA\nASC', badge_image_url: '/badges/aws-certified-solutions-architect-associate.png' },
    { name: 'AWS Well-Architected Proficient', issuer: 'Amazon Web Services (AWS)', badge_label: 'W·A', badge_image_url: '/badges/well-architected-proficient.png' },
    { name: 'AWS Accreditation — Telecom (L100)', issuer: 'Amazon Web Services (AWS)', badge_label: 'TEL\nL100', badge_image_url: '/badges/aws-industry-telecommunications-foundational-l100.png' },
  ],
  // Skills carry a 1–4 proficiency level (AWS L100–L400 model). Honesty is the point: the moat
  // (distributed systems, DevOps, granular AWS services) reaches 4; AI-native TOOLS cap at 3 (nobody is
  // a level-4 expert in a field this new); shallow AI TOPICS sit at 1–2 so they read as keywords, not
  // claimed expertise. Ordered moat-first. Based on the owner's LinkedIn skills (#128).
  skills: [
    {
      label: { en: 'AWS Cloud', pt: 'AWS Cloud' },
      items: [
        { name: 'AWS Lambda', level: 4 },
        { name: 'Amazon API Gateway', level: 4 },
        { name: 'Amazon S3', level: 4 },
        { name: 'Amazon DynamoDB', level: 4 },
        { name: 'Amazon ECS', level: 4 },
        { name: 'Amazon EKS', level: 3 },
        { name: 'Amazon SQS', level: 4 },
        { name: 'Amazon SNS', level: 4 },
        { name: 'AWS WAF', level: 3 },
        { name: 'Amazon Cognito', level: 4 },
        { name: 'AWS KMS', level: 3 },
        { name: 'Amazon RDS', level: 3 },
        { name: 'Amazon CloudFront', level: 3 },
      ],
    },
    {
      label: { en: 'Distributed Systems & DevOps', pt: 'Sistemas Distribuídos & DevOps' },
      items: [
        { name: 'Distributed Systems Architecture', level: 4 },
        { name: 'Microservices', level: 4 },
        { name: 'Serverless Computing', level: 4 },
        { name: 'Event-Driven Architecture', level: 3 },
        { name: 'Terraform', level: 4 },
        { name: 'AWS CloudFormation', level: 3 },
        { name: 'CI/CD', level: 4 },
        { name: 'Security', level: 3 },
        { name: 'Platform Engineering', level: 3 },
      ],
    },
    {
      // Its own group since 2026-07-31 (owner). It was one line — `Observability, level 4` — inside
      // Distributed Systems & DevOps, which said the discipline is a skill rather than a domain with
      // tooling under it.
      //
      // WHAT IS AND IS NOT BACKED BY THE PROSE ABOVE, stated precisely because an earlier version of
      // this comment claimed the whole group was: the experience block asserts an end-to-end
      // observability platform integrating AppDynamics, Grafana, Prometheus and Zabbix. That covers
      // Grafana and Prometheus here. CloudWatch and X-Ray are AWS services the AWS Cloud group already
      // carried. `ELK Stack` and `Splunk` are the owner's own assessment and are backed by nothing
      // else on this page — which is fine, since a levelled skill IS an assessment, but the comment
      // does not get to certify them. Note also that AppDynamics and Zabbix are named in the prose and
      // absent from this list; the owner has not ruled on adding them.
      //
      // CloudWatch and X-Ray MOVED here out of AWS Cloud rather than being duplicated. That group is
      // organised by vendor and this one by domain, so the two genuinely overlap — listing them twice
      // would inflate the AWS count and make a reader scanning for observability depth find it in two
      // places with no relationship.
      label: { en: 'Observability', pt: 'Observabilidade' },
      items: [
        { name: 'Amazon CloudWatch', level: 4 },
        { name: 'AWS X-Ray', level: 3 },
        { name: 'Prometheus', level: 3 },
        { name: 'Grafana', level: 3 },
        { name: 'ELK Stack', level: 3 },
        { name: 'Splunk', level: 2 },
      ],
    },
    {
      label: { en: 'AI-native Engineering', pt: 'Engenharia AI-native' },
      items: [
        { name: 'AI-DLC', level: 2 },
        { name: 'Agent Harness Engineering', level: 2 },
        { name: 'Claude Code', level: 3 },
        { name: 'Kiro', level: 3 },
        { name: 'Context Engineering', level: 3 },
        { name: 'Agents Engineering', level: 2 },
        { name: 'MCP (Model Context Protocol)', level: 2 },
      ],
    },
    {
      label: { en: 'AI Engineering', pt: 'Engenharia de IA' },
      items: [
        { name: 'Large Language Models (LLM)', level: 2 },
        { name: 'Prompt Engineering', level: 3 },
        { name: 'RAG (Retrieval-Augmented Generation)', level: 1 },
        { name: 'Amazon Bedrock', level: 2 },
      ],
    },
    {
      label: { en: 'Languages', pt: 'Linguagens' },
      items: [
        { name: 'Python', level: 3 },
        { name: 'TypeScript', level: 3 },
        { name: 'Node.js', level: 3 },
        { name: 'Java', level: 2 },
        { name: 'Spring Boot', level: 3 },
      ],
    },
    {
      // On the same 100–400 meter as everything else since 2026-07-31 (owner). It used to encode the
      // level IN the name — "Português (nativo)" — which made it the one category on the page with no
      // proficiency bar. The names localise, which is why `SkillItemSource.name` now accepts a
      // localized value; see the type.
      label: { en: 'Languages (spoken)', pt: 'Idiomas' },
      items: [
        { name: { en: 'Portuguese', pt: 'Português' }, level: 4 },
        { name: { en: 'English', pt: 'Inglês' }, level: 3 },
        { name: { en: 'Spanish', pt: 'Espanhol' }, level: 2 },
      ],
    },
  ],
  metadata: {
    github: 'https://github.com/tedeuxx',
    linkedin: 'https://www.linkedin.com/in/luiz-tadeu-mendonca-83a16530',
    x: 'https://x.com/tedeuxx',
  },
  updated_at: '2026-07-21',
};

/** Career length, derived from the earliest `start_date` above — the single source for the figure. */
export const CAREER_YEARS = careerYears(sourceTemplate.experience);

/**
 * Resolve `{{years}}` in any authored prose. Exported because the ramp-up page states the same figure
 * and must resolve it from the same constant — two substitution helpers would be two things to drift.
 */
/** The evergreen public figure (#124) — a floor, not the bare derived count (see the header note). */
export const CAREER_YEARS_PUBLIC = '18+';
export const withYears = (text: string) => text.split(YEARS_TOKEN).join(CAREER_YEARS_PUBLIC);

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
