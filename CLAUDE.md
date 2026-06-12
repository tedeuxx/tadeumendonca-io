# tadeumendonca-fed

SPA pública de **tadeumendonca.io** — feed, blog, perfil/CV e as telas de compose (admin).
Parte do platform `tadeumendonca` (repos irmãos: `-api` = BFF, `-iac` = infra, `-skills` = guias).

## Stack
- **React 18 + Vite + TypeScript**, **Tailwind v3** (preflight on).
- **NÃO há shadcn/ui** — componentes Tailwind próprios em `src/components/`, com tokens HSL no estilo shadcn (`src/styles/index.css` + `tailwind.config.js`). Util de classes: `cn()` em `src/lib/cn.ts` (clsx + tailwind-merge). Sem `cva`.
- React Query (server state), Zustand (`src/auth/authStore.ts`), react-router v6, lucide-react (ícones), aws-amplify (Cognito hosted-UI PKCE).
- Testes: **Vitest + React Testing Library** (queries por role/texto; sem snapshot/visual).

## Arquitetura (SPA + BFF)
- A SPA fala **só com o BFF** (`-api`) via API Gateway; auth externa (Cognito). O SDK guarda o JWT → manda como Bearer; o authorizer do API GW valida. **Nenhuma lógica de auth de servidor aqui.**
- Config de build (`VITE_*`) vem de SSM no deploy. Feed é a home (`/`); CV é página interna (`/profile`).

## Identidade visual (decisões NÃO-óbvias — confirmar antes de mudar)
- **Tema único, SEM dark/light toggle.** Não existe `ThemeProvider`. Paleta **Borussia Dortmund**: preto/grafite + **ouro `#E8A613`** (`--primary: 43 90% 48%`). Tokens em `src/styles/index.css` (único `:root`) e `tailwind.config.js`.
- Tipografia: **Archivo** nos títulos (`font-display`), **Inter** no corpo.
- Forma: escala de raio arquitetônica (sem pills `rounded-full`, exceto círculos reais/botões de ícone). Sem glassmorphism (headers sólidos).
- Layout (`src/components/AppShell.tsx`): **header global** (título à esquerda, conta/config à direita) + **nav horizontal** abaixo + **conteúdo** (protagonista, `max-w-3xl`) + **zona de componentes** (direita, xl+, placeholder p/ futuro). Sem rail esquerda, sem bottom-bar.
- `PostCard` é estilo **entrada de artigo** (sem `@handle`/avatar de tweet).

## Idioma
- **Todo o portal é pt-BR** (funcionalidades + UX/UI). Sem framework de i18n — strings inline; datas com locale `pt-BR`. Ao adicionar texto de UI, escrever em pt-BR.

## Convenções
- **snake_case** em dados/JSON (espelha o BFF; sem camada de mapeamento).
- Estados de UI explícitos (loading/empty/error) via primitivas em `src/components/Column.tsx`; formulários via `src/components/Form.tsx`.
- "Blog" é a funcionalidade de artigos (rota canônica `/blog`; `/articles*` mantido por compat de deep-links).

## Comandos
```bash
npm run dev        # vite dev server (localhost:5173)
npm test           # vitest run --coverage — cobertura ≥85% (lines/funcs/branches/stmts) é gate
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # tsc + vite build
```

## Workflow (ver platform)
- **GitFlow**: branch a partir de `develop`; PR obrigatório (0 approvals). Merge em `develop` → **deploy automático em staging** (`https://staging.tadeumendonca.io`). `main` → produção (com aprovação).
- CI (`ci.yml`): lint + typecheck + test + **SonarCloud quality gate** (check `build-test` é obrigatório). SemVer numérico automático.
