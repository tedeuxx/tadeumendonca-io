_Este site é o argumento. Esta página é a planta — como ele é construído, e como você construiria o seu._

## A tese

Para um site de prova de engenharia, o código é o pitch — então o honesto é mostrar a máquina, não só o resultado dela. Esta é a construção inteira, em aberto: a arquitetura abaixo, as decisões que a moldaram (cada uma registrada como um ADR), e a camada reutilizável que te deixa replicar. Eu construo isto do jeito que quero ser contratado pra construir — desenvolvimento AI-native (Claude Code, Kiro, um loop AI-DLC / Loop Engineering) com o rigor de SDLC que a maior parte do trabalho com IA pula. O site é a saída pública desse loop.

## O formato

Uma SPA totalmente estática — React + Vite + TypeScript — servida a partir de **S3 atrás do CloudFront**, com uma pequena CloudFront Function reescrevendo URLs limpas. Sem backend: sem servidor, sem banco, sem auth. Custo quase zero, superfície de ataque mínima, nada rodando às 3 da manhã. *(→ [ADR-0002](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-fully-static-spa-no-backend.md) totalmente estático / sem backend · [ADR-0013](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0013-s3-cloudfront-hosting.md) S3 + CloudFront)*

## Quanto custa de verdade: cerca de USD 0,65 por mês

"Custo quase zero" é a afirmação mais fácil desta página de fazer e a mais fácil de deixar sem conferir. Então segue a conta, lida da AWS e não estimada:

- **Route 53** — USD 0,50/mês, fixo. A hosted zone, com ou sem visitante.
- **S3** — cerca de USD 0,15/mês, e são *escritas* de deploy, não leituras.
- **CloudFront** — na prática USD 0,00 neste tráfego.

Repare no formato, porque ele é o honesto para um site estático: **o domínio custa mais do que servir o site.** Não existe linha de computação nenhuma — é isso que "sem backend" compra, e é por isso que o número quase não se mexe com dez ou dez mil visitantes. CloudFront em `PriceClass_100` e objetos no S3 não têm custo ocioso a pagar.

O guarda-corpo é um orçamento no nível da conta, em `iac/budget.tf`, de propósito **não** escopado às tags deste projeto — assim ele pega gasto que este repo não criou. Isso não é paranoia: a conta carregava cerca de **USD 12,80 por mês** de sobras da era com backend — web ACLs de WAF e endereços IPv4 públicos ociosos, anexados a nada — vinte vezes o custo do próprio site. Infraestrutura que você para de usar não para de cobrar, e nada te avisa além da fatura. *(→ [`iac/budget.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/budget.tf))*

## O conteúdo é markdown no repo, resolvido no build

O conteúdo de cada página — o CV, esta página, os artigos — é markdown ou dado tipado no repo. Cada rota é **prerenderizada** no build (um snapshot headless) pra que as tags de OG/SEO e o HTML rastreável cheguem nos arquivos servidos — sem SSR, sem edge rendering. O PDF do CV para download é impresso a partir do `/me` ao vivo pela mesma etapa. *(→ [ADR-0004](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0004-build-time-render-not-ssr-or-edge.md) render no build · [ADR-0005](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0005-og-coverage-every-public-url.md) toda URL OG-completa · [ADR-0034](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0034-build-time-cv-pdf-static-artifact.md) o PDF do CV)*

## O dev-loop é o produto

A parte interessante não é a stack — é como ele é construído: **agent-led verification, human-residual** (verificação liderada pelo agente, humano no resíduo). O agente prova o "pronto" com gates mecânicos e evidência real (lint, tipos, testes ≥85%, um build verde, SonarCloud, E2E funcional, um revisor de contexto fresco); o humano fica com as decisões irreversíveis e arquiteturais. Esse loop vive num plugin reutilizável à parte — **[tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)** — então é uma metodologia que você pode adotar, não algo sob medida só pra este site. *(→ [ADR-0003](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0003-trunk-based-single-environment.md) trunk-based single-environment · [ADR-0018](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0018-ci-gates-e2e-on-pr-coverage.md) os gates de CI)*

## O registro de decisões É a documentação

Nada de doc de arquitetura separado que descola da realidade. Toda decisão que sustenta peso — e as revertidas, mantidas como histórico — é um **[Architecture Decision Record](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/README.md)**, lido através do keystone [ADR-0001](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0001-lean-by-design-calibrated-to-strategy.md): *enxuto por design, calibrado pela estratégia.* O "porquê" de verdade por trás de qualquer coisa acima está lá, datado, com seu trade-off.

## Replique para o seu contexto

Está tudo público — dois repos, sem segredos:

- **[tadeumendonca-io](https://github.com/tedeuxx/tadeumendonca-io)** — este site e sua infraestrutura (`iac/`: Terraform para S3/CloudFront/OIDC).
- **[tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)** — o plugin reutilizável do dev-loop: os princípios, as personas dos agentes, os guardas de permissão.

**A régua:** um projeto só entra no portfólio quando **cumpre** a **[docs/catalog-ready.md](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md)** — o gate de prova de engenharia. Este site é a única entrada que não veio por ela, porque ele *é* a prateleira; o que o sustenta está nesta página — os ADRs acima, os gates, e a limitação que ele assume logo abaixo. Meça o seu próprio trabalho por essa régua.

### O passo a passo

Umas quatro horas, e a maior parte é esperar DNS e certificado.

1. **Faça fork dos dois repos.** Leia os ADRs antes, começando no 0001 — as decisões são a parte que vale levar, e várias delas não vão servir pro seu contexto.
2. **Registre o domínio e crie a hosted zone dele no Route 53.** Aqueles USD 0,50 viram seu piso de custo a partir desse instante, antes de qualquer visitante. Peça um certificado no ACM **em `us-east-1`** — o CloudFront só lê certificado dessa região, onde quer que o resto da sua stack viva.
3. **Crie uma organização e um workspace no Terraform Cloud**, modo de execução **Local**, e aponte o `iac/versions.tf` pros seus nomes. O estado mora lá; o plan roda no CI.
4. **Faça o bootstrap dos papéis OIDC uma vez, com as suas credenciais.** Esta é a única exceção honesta ao *apply é só de pipeline*, e é um ovo-e-galinha de verdade: o CI assume papéis que o Terraform cria, então o primeiro apply não tem como vir do CI. Depois que ele entra, tire as credenciais locais e nunca mais dê apply de um laptop.
5. **Configure os secrets do GitHub, e repare em qual escopo cada um vai.** Os ARNs dos papéis — `AWS_FED_OIDC_ROLE_ARN`, `AWS_INFRA_OIDC_ROLE_ARN` — são secrets de **environment**; os tokens de ferramenta — `TFC_API_TOKEN`, `SONAR_TOKEN`, `VERSION_BUMP_TOKEN`, `BUDGET_ALERT_EMAIL` — são secrets de **repositório**. Essa separação é o que impede um token que roda o lint de conseguir encostar na sua conta.
6. **Acerte o subject da trust policy — e conte com esse aqui te morder.** Os papéis confiam num subject *imutável*: `repo:<org>@<org_id>/<repo>@<repo_id>:*`, por ID numérico, não por nome. A forma simples `repo:<org>/<repo>:*` é um nome, e nome pode ser transferido pra outra pessoa; os IDs não. O preço da forma segura é que ela não é copiável — você tem que ir buscar os seus IDs.
7. **Troque o conteúdo e o posicionamento.** `src/content/` pro texto longo, `src/data/profile.ts` pro CV, `src/data/catalog.ts` pro portfólio, `src/i18n/messages.ts` pra chrome. Todo módulo que o leitor vê é tipado de modo que uma tradução faltando é **erro de compilação**, não uma página servindo o idioma errado em silêncio.
8. **Faça merge na `main`.** O merge **é** o deploy — não existe passo de promoção nem um segundo ambiente pra pegar o que o pull request deixou passar. É essa a troca que este formato inteiro faz, e ela só é segura porque os gates rodam no PR.

**Se for levar uma coisa só, leve o passo 8 com os gates junto.** Trunk-based com ambiente único é rápido e implacável na mesma medida; sem as verificações na frente, ele é só a segunda coisa.

## Uma limitação honesta

Este é um site de autor único, afinado ao posicionamento de uma pessoa — não é um template de propósito geral, e ainda não foi testado no campo por muitas mãos. Pegue o padrão, não os detalhes. O que vem a seguir, adiado de propósito: uma planta visual mais rica — o passo a passo acima já está escrito, mas ainda é texto descrevendo um sistema, não um desenho dele.
