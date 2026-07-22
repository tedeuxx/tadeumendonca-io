# Redesign brutalista moderno — tadeumendonca.io (`apps/fed`)

## Context
O site é a prova pública do reposicionamento do Tadeu de *Cloud Application Architect* → **AI Engineer (agentic development)**. A identidade atual (Borussia Dortmund: preto/grafite + ouro `#E8A613`, Archivo/Inter, layout de feed multi-rota, PWA offline-first) não expressa esse posicionamento. O brief aprovado pede uma **estética brutalista moderna** — monocromática, grid exposto, alto contraste, "engenharia à mostra". Este plano cobre a fase design-to-code; a alta-fi visual **foi aprovada** via comp HTML (ver Fase 0).

**Missão / voz (decisão de posicionamento):** o produto primário é **fazer o leitor aprender / evoluir** com o conteúdo — a auto-promoção do Tadeu é **subproduto**. Toda a copy é reader-first (ex.: hero "Aprenda a construir com IA agentic"; artigos com "Você sai sabendo…"; portfólio com "O que você tira disso"; CTA "Algo aqui te ajudou? Me conta."). Nome/bio pessoal só no `/cv`.

**Arquitetura de informação (aprovada na comp v4):** a home é vitrine do *conteúdo*: **Hero = marca `tadeumendonca.io`** + missão reader-first + links (Ler artigos / GitHub / Medium) + marquee de assuntos → região de duas colunas com **Artigos = pane principal** + **aside** slim ("Sobre → CV", "Onde me encontrar" com GitHub/Medium/LinkedIn/**WhatsApp**) → **Portfólio full-width** (ocupa o espaço que era de vídeos) → **Contato** (CTA + WhatsApp). **Vídeos NÃO são seção** — são **embedados dentro dos artigos** (markdown). **CV → rota `/cv`** (nome, experiência, formação, skills).

## Decisões aprovadas (fecham o escopo)
- **Identidade visual:** brutalismo moderno **aprovado** (near-black/off-white + safety orange, grid 12 visível, raio-0/sem-sombra).
- **Acento único:** safety orange **`#FF5A00`** (`--primary: 21 100% 50%`). Um só acento, comprometido.
- **Home = vitrine do conteúdo (reader-first):** Hero = **marca `tadeumendonca.io`** + missão (ensinar vem primeiro; nome só no `/cv`); **Artigos = pane principal**; aside slim ("Sobre→CV" + "Onde me encontrar" com GitHub/Medium/LinkedIn/**WhatsApp**); **Portfólio = seção full-width**; **Contato** (CTA + WhatsApp). **Vídeos embedados nos artigos** (sem seção/rota própria).
- **Duas audiências / duas trilhas:** (1) **pessoa física / vida pessoal** — experimentos com **Claude Cowork** (automação do dia a dia, sem-código); (2) **empresa / engenharia** — IA agentic em produção. Cada artigo tem `track: 'pessoal' | 'engenharia'` (frontmatter); a `ArticlesSection` tem **filtro de trilha** (Tudo / Vida pessoal / Engenharia, estado local, sem router param) e tag por artigo (chip acento = pessoal, contorno = engenharia). Hero fala com as duas ("do dia a dia à produção").
- **Templates (Fase 1 — validados na comp):** `/blog/:slug` (leitura: meta+trilha+tempo, título grande, corpo markdown com vídeo embedado, rodapé Ver-no-LinkedIn/voltar/share) e `/cv` (nome + experiência + formação/skills). Ambos brutalistas, medida de leitura ~72ch.
- **Conteúdo escrito:** o **MD-no-repo continua a fonte única** (autor escreve na IDE com Claude Code). O **site hospeda o canônico** (reaproveita o pipeline de prerender/OG); a seção Artigos lê `getAllPosts()` de `src/lib/content.ts` (NÃO criar `articles.ts`) e mostra deep-link opcional "Ver no LinkedIn" via frontmatter. **Automação do LinkedIn é adiada** (Fase LinkedIn — ver fim).
- **Bilíngue EN/PT:** o portal deve ser visualizável nos dois idiomas de forma transparente. **Reverte a decisão fixa "portal 100% pt-BR, sem i18n".** Escopo: paridade UI + CV + artigos. Construído como **fase própria DEPOIS** do redesign brutalista (ver Fase i18n). Reconcilia também a inconsistência atual (UI pt-BR × dados de perfil em inglês).
- **PWA:** remover agora (service worker, manifest, install/offline).
- **Rotas mantidas (SEO):** `/` (home), `/cv`, `/portfolio` (catálogo completo, restilizado), `/blog/:slug` (artigo canônico + OG). O aside de portfólio na home linka para `/portfolio`; nav usa âncoras (`#artigos`,`#videos`,`#contato`) na home + links reais p/ `/cv` e `/portfolio`.

## Fase 0 — Alta-fi visual (CONCLUÍDA)
Seat do Figma é View-only → a alta-fi foi entregue como **comp HTML self-contained** (Artifact), iterada com o Tadeu até aprovação: identidade + nova arquitetura de informação (home output-first, CV em `/cv`). A comp é a referência visual para as slices de código; fontes reais (Space Grotesk + JetBrains Mono) entram no código (a comp usa fallback de sistema).

## §1 — Tokens (`src/styles/index.css` + `tailwind.config.js`)
Manter o consumo em `hsl(var(--x))` (não trocar para hex). Novo `:root` (tema único, sem dark/light):

| Token | Novo | Intenção |
|---|---|---|
| `--background` | `0 0% 4%` | #0A0A0A near-black |
| `--foreground` | `48 20% 95%` | #F5F4EF off-white quente |
| `--card` | `0 0% 4%` | = bg (brutalismo sem superfície elevada) |
| `--border` | `0 0% 24%` | linha de grid visível |
| `--border-strong` (novo) | `48 20% 95%` | régua pesada (moldura de seção) |
| `--muted` / `--muted-foreground` | `0 0% 10%` / `0 0% 55%` | texto secundário mudo |
| `--primary` / `--primary-foreground` / `--ring` | `21 100% 50%` / `0 0% 4%` / `21 100% 50%` | **orange** / texto near-black / foco |
| `--radius` | `0` | raio 0 |

Extras no `:root`: `--rule: 1px`, `--rule-strong: 2px`, `--container: 1440px`, `--gutter: clamp(1rem,4vw,4rem)`, `--header-h`.

`tailwind.config.js`:
- `colors`: adicionar `'border-strong'`; resto herda os novos HSL.
- `fontFamily`: `sans`/`display` → **Space Grotesk**; `mono` → **JetBrains Mono** (manter `display` como alias p/ não reescrever todos os `font-display` de uma vez).
- `borderRadius`: colapsar toda a escala para `0` (inclusive `full`) → qualquer `rounded-*` remanescente renderiza quadrado (de-risk).
- `boxShadow`: tudo `none` (impõe "sem sombra" no token).
- `maxWidth`: `{ screen: '1440px', prose: '72ch' }`.
- `fontSize`: `hero: clamp(3rem,10vw,12rem)` (lh .95, ls -.04em); `display-2: clamp(2rem,5vw,4rem)`. `letterSpacing`/`lineHeight` tight.
- `.markdown` (linhas 37-107): zerar todos os `border-radius`, mono novo, links laranja; manter `github-dark`.
- Helpers `@layer components`: `.invert-hover` (`transition-colors hover:bg-foreground hover:text-background`), `.label-mono` (`font-mono text-xs uppercase tracking-widest text-muted-foreground`), `.rule`/`.rule-heavy`.
- **Grid 12-col visível:** seções em `grid grid-cols-12` com `border-l border-border` nas células + container `border-x border-border-strong`; componente opcional `GridLines.tsx` (`aria-hidden`, overlay decorativo).

## §2 — Fontes (`package.json` + `src/main.tsx`)
Remover `@fontsource/archivo` e `@fontsource/inter`; adicionar `@fontsource/space-grotesk` e `@fontsource/jetbrains-mono` (self-hosted). Trocar os 5 imports em `main.tsx` (space-grotesk 400/500/700, jetbrains-mono 400/500/700). `body` font em `index.css` → Space Grotesk.

## §3 — Rotas & layout (`src/App.tsx` + `LandingPage` + `CvPage`)
Rotas: `/` → `LandingPage` (output-first); **`/cv` → `CvPage`** (nova, hospeda o CV); `/portfolio` → `PortfolioPage` (catálogo completo, restilizado); `/blog/:slug` e `/articles/:slug` → `ArticlePage`. Redirects: `/profile`→`/cv`, `/blog`→`/#artigos`, `/articles`→`/#artigos`, `*`→`/`. Manter `QueryClientProvider`+`BrowserRouter`+`AppShell`.
`LandingPage.tsx` compõe: `Hero` (marca + missão reader-first) → região de duas colunas **`ArticlesSection` (main) + aside slim (`AboutCard`→`/cv`, `ContactLinks` com GitHub/Medium/LinkedIn/WhatsApp)** → **`PortfolioSection` full-width** (mesmos cards de `/portfolio`) → `ContactFooter`. Detém `useDocumentHead` + Person JSON-LD. Âncoras `#artigos`/`#portfolio`/`#contato`; `scroll-behavior: smooth` **gated** por `prefers-reduced-motion`; `scroll-margin-top` = altura do header. `useActiveSection.ts` opcional. **Sem seção de vídeos** — vídeos são embedados no markdown dos artigos.
`CvPage.tsx` = `CVSection` (nome + experiência + formação/certs + skills) com `useDocumentHead` próprio (title/OG "CV — Luiz Tadeu Mendonça") — é onde o nome/bio pessoal vivem.

## §4 — Componentes (restilizar / substituir / deletar)
- **`AppShell.tsx`** — reescrever: container `max-w-[1440px]` com `border-x border-border-strong`, nav sticky (marca `tadeumendonca.io` à esquerda; links âncora + `/cv`/`/portfolio` reais à direita; menu colapsável no mobile), sem `OfflineBanner`/`InstallPrompt`/`ComponentsPanel`. Mantém a estrutura main+aside **por página** (a `LandingPage` usa; `CvPage`/`ArticlePage` usam largura de leitura).
- **`Hero.tsx` (novo)** — **título = marca `tadeumendonca.io`** (`.io` no acento, **linha única, `white-space:nowrap`, escala reduzida ~clamp(1.9→7rem)**), tagline reader-first ("do dia a dia à produção"), tese não-pessoal, **CTAs = Artigos (`#artigos`) + Portfólio (`#portfolio`)**, `Marquee` de assuntos, overlay `GridLines`. **Nada de nome/bio pessoal aqui.**
- **`ArticlesSection.tsx` (pane principal)** — de `ArticlesPage`; lê `getAllPosts()`; **filtro de trilha** (Tudo/Vida pessoal/Engenharia, estado local via `useState`, substitui o antigo `?tag=`); linhas de artigo: data/tag mono + **chip de trilha**, título oversized (hover laranja), excerpt, linha reader-first "você sai sabendo…", selo "▶ vídeo no artigo" se `hasVideo`, link primário `/blog/:slug` + "Ver no LinkedIn" opcional.
- **Aside (novos, componentes pequenos):** `AboutCard.tsx` (resumo curto reader-first + "→ CV completo" para `/cv`; **sem nome**), `ContactLinks.tsx` ("Onde me encontrar": GitHub, LinkedIn, **WhatsApp** click-to-chat). **Sem Medium** (artigos são in-place/hospedados). WhatsApp com **ícone de marca** (glifo oficial, verde `#25D366` — única exceção de cor, contida). Reusar `WHATSAPP_NUMBER='5521986619954'` + msg pré-preenchida do `SocialLinksWidget`.
- **`ProfileView.tsx` → `CVSection`** (usado só em `/cv`) — remover cover-gradient e avatar circular; **nome grande no topo** + papel; timeline com ticks quadrados laranja 2px; labels mono sticky; **Formação e Certificações são seções SEPARADAS**; **certificações = badges** (grid de selos; no site, **imagens oficiais do Credly** + link pra credencial, não chips de texto); skills como chips mono bordados. Preservar strings visíveis ("Experiência/Formação/Certificações/Habilidades") p/ reduzir churn de teste.
- **`PortfolioSection` (full-width na home) + `PortfolioPage` (`/portfolio`, catálogo completo)** — mesmo `ProjectCard`: `border p-6 invert-hover` (sem `rounded-xl`/`bg-card`); 4ª linha **"o que você tira disso"** (reader-first; novo `proof?` em `catalog.ts`); `StatusBadge` quadrado mono; grid 2-col/12-col. Home mostra top N + "→ ver catálogo completo".
- **`ArticlePage.tsx`** — restilizar (rota mantida): back-link mono, título oversized, `.markdown` via §1, "Ver no LinkedIn" se houver. **Vídeos embedados no artigo:** habilitar embed de YouTube no markdown via component override do `react-markdown` (ex.: link YouTube isolado → facade lazy `VideoEmbed`), mantendo o sanitize (sem `rehype-raw`/iframe cru). `ArticlesSection` mostra um selo "▶ vídeo no artigo" quando o post tem vídeo.
- **`VideoEmbed.tsx` (novo)** — facade lazy YouTube (thumbnail → iframe on click/IO), usado **dentro do markdown** dos artigos (não como seção). **`ContactFooter.tsx` (novo)** — CTA reader-first grande + links (incl. WhatsApp) + colophon mono (absorve `SocialLinksWidget`).
- **`Marquee.tsx` (novo)** — ticker CSS motion-gated (assuntos, não auto-promo).
- **Deletar:** `InstallPrompt`, `useInstallPrompt`, `useOnline` (+tests), `OfflineBanner`, `HomePage`, `SocialLinksWidget` (após folding). Verificar `LinkPreviewCard`/`Form`/`framer-motion` com grep e remover se mortos.

## §5 — Dados
- **`src/lib/content.ts`**: estender `BlogPost` + `parse()` com `track: 'pessoal' | 'engenharia'` (default `'engenharia'`), `linkedinUrl?`, `hasVideo?` e `cover?` (frontmatter). Helper `getAllPosts({track})` filtra por trilha. Casos novos em `content.test.ts`.
- **`src/data/catalog.ts`**: adicionar `proof?` (rótulo "o que você tira disso"); **corrigir a seed** (hoje diz "offline-first PWA / Hono BFF on Lambda" — desatualizado; é estático S3+CloudFront).
- **Vídeos:** NÃO criar `videos.ts` nem seção. Vídeos são embedados no markdown dos artigos (YouTube id no corpo → `VideoEmbed` via component override). Opcional: flag `hasVideo`/frontmatter para o selo "▶ vídeo no artigo" no card.

## §6 — Remover PWA
`vite.config.ts`: remover bloco `VitePWA({...})` + import. `package.json`: remover `vite-plugin-pwa`. Deletar `InstallPrompt`/`useInstallPrompt`/`useOnline` (+tests) e usos no `AppShell`. `index.html`: remover metas PWA-only (manter `theme-color #0A0A0A`, favicon, OG). Ícones PWA em `public/` viram órfãos (deixar ou remover).

## §7 — Prerender/OG (`scripts/prerender.mjs`)
Lista de rotas: `['/', '/cv', '/portfolio', ...slugs.map(s => '/blog/'+s)]` (dropar só `/blog` de listagem). Cada rota real com seu `useDocumentHead`/canonical próprio. Não snapshotar redirects. Regenerar `gen-og-default.mjs` na paleta nova (laranja no near-black).

## §8 — Testes & cobertura (gate ≥85%)
Reescrever em lockstep com cada slice (nenhuma slice fecha vermelha). Deleções de PWA *ajudam* a cobertura. Preservar strings visíveis em CV/Artigos limita o churn. Testar (ou `exclude` explícito) a lógica nova de IntersectionObserver/marquee. Atualizar: `AppShell.test` (nav marca + âncoras + `/cv`/`/portfolio`, sem offline), `HomePage.test`→`LandingPage.test` (Hero=marca, Artigos main, aside), `ProfileView.test`→`CvPage.test`/`CVSection.test` (nome presente na rota `/cv`), `ArticlesPage.test`→`ArticlesSection.test`, e2e `feed.spec.ts` (home output-first + navegar p/ `/cv`), `content.spec.ts` (rota `/blog/:slug` mantida). Novos: `Hero`, `AboutCard`, `PortfolioWidget`, `VideoEmbed`, `Marquee`, parsing de `videos.ts`/`content.ts`.

## §9 — Movimento & a11y (tudo `prefers-reduced-motion`-gated)
CSS puro (sem framer-motion): `.invert-hover` (swap fg/bg mecânico), labels de seção `sticky`, **1 marquee** (skills, 30s linear, duplicado c/ `aria-hidden`, estático sob reduced-motion). Global reduced-motion reset em `index.css`. `:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px }` (laranja no near-black).

## §10 — Docs a atualizar (na mesma mudança — guard de decisão-fixa)
- **`apps/fed/CLAUDE.md`** — reescrever "Identidade visual" (está totalmente desatualizada: BVB/gold/Archivo/Inter/feed/BFF/Zustand/Cognito). Novo: mono brutalista + `#FF5A00`, Space Grotesk + JetBrains Mono, single-page âncora, raio-0/sem-sombra/sem-gradiente, grid 12 visível, sem PWA/auth/BFF. Remover parágrafos SPA+BFF/auth/Amplify (mortos).
- **Root `CLAUDE.md`** — "Fixed decisions" + "Architecture" + "Structure": trocar `BVB identity: black/graphite/gold` → `brutalist mono: near-black/off-white + safety orange #FF5A00`; remover `offline-first PWA` → `no PWA (static SPA)`.
- **`package.json` description** ("…Cloudscape") e `index.html` (`<title>`/`meta description` "Software Engineer") → "AI Engineer".

## Slicing (WIP=1, cada slice fecha verde: lint+typecheck+`vitest --coverage ≥85%`+`vite build`)
1. **Tokens + fontes** (§1,§2) — paleta/type novos, layout antigo ainda.
2. **Remover PWA + docs de decisão-fixa** (§6,§10).
3. **Rotas + AppShell** (§3) — `App.tsx` (rotas `/`,`/cv`,`/portfolio`,`/blog/:slug` + redirects), `AppShell` reescrito (nav marca/âncoras), `LandingPage`/`CvPage` com shells, prerender routes, deletar `HomePage`.
4. **Hero + Marquee** (§4,§9) — Hero = marca `tadeumendonca.io` (linha única, não quebrar) + missão reader-first; superfície-assinatura.
5. **Artigos (pane principal) + aside** (§4,§5,§7) — `ArticlesSection` (reader-first, "você sai sabendo") + `AboutCard`→`/cv` + `ContactLinks` (WhatsApp/Medium); `linkedinUrl`/`hasVideo` no frontmatter; `ArticlePage` restilizado + `VideoEmbed` no markdown. (Prioriza o conteúdo.)
6. **CV em `/cv`** (§4,§5) — `ProfileView`→`CVSection` em `CvPage` (nome/bio aqui).
7. **Portfólio** (§4,§5) — `PortfolioSection` full-width na home + `PortfolioPage` `/portfolio`: `ProjectCard` invert-hover + `proof`("o que você tira disso") + seed corrigida.
8. **Footer/contato** (§4) — `ContactFooter` (CTA reader-first + WhatsApp), folding de `SocialLinksWidget`.
9. **Polish/a11y/OG** — `useActiveSection`, OG default novo, responsivo (1440→768→375), reduced-motion QA, contraste, varredura de código morto.

## Verificação (end-to-end)
- `npm --prefix apps/fed run lint && npm --prefix apps/fed run typecheck`
- `npm --prefix apps/fed test` (cobertura ≥85% — gate)
- `npm --prefix apps/fed run build` (verde) + prerender: rotas renderizam, OG presente no HTML servido
- `npm --prefix apps/fed run dev` — inspeção visual: home output-first (Hero=marca, Artigos main, Portfólio aside, Vídeos, Contato) + `/cv` + `/portfolio`, hover-invert, marquee, foco laranja
- E2E Playwright (`feed.spec.ts`/`content.spec.ts`) verdes
- Critérios de aceite do brief: fiel ao spec brutalista · 1 acento só · zero raio/sombra/gradiente · responsivo desktop-first · **zero XHR em runtime** · deep-links/embeds funcionando · nome só em `/cv`

## Fase i18n — Bilíngue EN/PT (fase própria, DEPOIS do redesign)
Reverte a decisão fixa pt-BR-only. Escopo aprovado: paridade **UI + CV + artigos**. Abordagem (SEO-correta, "transparente"):
- **Camada i18n leve** (sem framework pesado): dicionário de strings `src/i18n/{pt,en}.ts` + hook `useLang()`/`useT()`; idioma no contexto React. Dados de perfil bilíngues (`profile.pt.ts`/`profile.en.ts` ou campo `{pt,en}`). Artigos: markdown por idioma (`slug.pt.md`/`slug.en.md`), `content.ts` agrupando por `slug`+`lang`.
- **URLs por idioma:** `/` (pt padrão) + `/en/*` espelho de todas as rotas; **hreflang** (`<link rel="alternate" hreflang>`) em `useDocumentHead`; **prerender dos dois idiomas** (dobra a lista de rotas em `prerender.mjs`).
- **Detecção transparente:** a **CloudFront Function** viewer-request (já existe p/ URL-rewrite, em `iac/frontend.tf`) passa a ler `Accept-Language` e redirecionar 1ª visita para `/en` quando o navegador prefere inglês; **toggle EN/PT** no nav persiste escolha (cookie/localStorage) e sobrepõe. ⚠️ Editar a CF Function = **fronteira de infra/deploy** (pipeline-only) — confirmar o `plan`.
- **Docs:** atualizar ambos CLAUDE.md (a regra "portal 100% pt-BR, sem i18n" passa a "bilíngue EN/PT, i18n próprio leve").
- Verificação: prerender emite HTML por idioma com hreflang; alternar navegador PT↔EN troca idioma sem ação manual; toggle persiste; `/en/blog/:slug` renderiza o markdown `en`.

## Fase LinkedIn — Adiada (automação de distribuição LinkedIn)
**Não** neste escopo. Realidade confirmada: newsletter/article do LinkedIn **não tem API** (só UI manual) e **não é embedável** (sem oEmbed; embed nativo só p/ feed post). Spike futuro: viabilidade de auto-postar um **feed post** (link pro artigo canônico) via Posts API + `w_member_social` (app + aprovação + token OAuth no CI, refresh ~60d, cruza a fronteira pública) — investigar se o **MCP do LinkedIn** (Cowork) cobre esse pedaço/ciclo de token. Newsletter edition segue manual; URL colada no frontmatter alimenta o "Ver no LinkedIn".
