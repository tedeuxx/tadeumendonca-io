_Este site é o argumento. Esta página é a planta — como ele é construído, e como você construiria o seu._

## A tese

Para um site de prova de engenharia, o código é o pitch — então o honesto é mostrar a máquina, não só o resultado dela. Esta é a construção inteira, em aberto: a arquitetura abaixo, as decisões que a moldaram (cada uma registrada como um ADR), e a camada reutilizável que te deixa replicar. Eu construo isto do jeito que quero ser contratado pra construir — desenvolvimento AI-native (Claude Code, Kiro, um loop AI-DLC / Loop Engineering) com o rigor de SDLC que a maior parte do trabalho com IA pula. O site é a saída pública desse loop.

## O formato

Uma SPA totalmente estática — React + Vite + TypeScript — servida a partir de **S3 atrás do CloudFront**, com uma pequena CloudFront Function reescrevendo URLs limpas. Sem backend: sem servidor, sem banco, sem auth. Custo quase zero, superfície de ataque mínima, nada rodando às 3 da manhã. *(→ [ADR-0002](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-fully-static-spa-no-backend.md) totalmente estático / sem backend · [ADR-0013](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0013-s3-cloudfront-hosting.md) S3 + CloudFront)*

## Quanto custa de verdade: USD 6,57 por mês — e USD 6,42 disso é o nome

Dizer "custo quase zero" é a coisa mais fácil desta página — e a mais fácil de ninguém conferir. Então segue a conta inteira: as linhas de servir lidas do custo diário da conta no **fim de julho de 2026**, o registro lido da tabela de preço do registrador. Nenhuma das duas estimada:

- **O domínio** — USD 71,00/ano pelo `.io`, uma cobrança anual que cai num mês só. **USD 5,92/mês** amortizado.
- **Route 53** — USD 0,50/mês, fixo. A hosted zone, com ou sem visitante.
- **S3** — cerca de USD 0,15/mês, e são *escritas* de deploy, não leituras.
- **CloudFront** — na prática USD 0,00 neste tráfego.

Repare no desenho disso, porque não é um efeito pequeno e é uma divisão em três, não uma razão: **o nome são 6,42, publicar são 0,15, e responder requisição é zero.** Registro e DNS custam mais que todo o resto desta página somado, quarenta vezes mais; os 0,15 são o build empurrando arquivo pro S3, não leitor puxando; e a parte que de fato atende um visitante arredonda pra nada.

As linhas de servir são medição com data, não fato permanente — nenhuma fatura fechou nesse ritmo ainda. E repare *por que* a fonte é dividida, porque esse foi o erro que esta seção já cometeu uma vez: a série de custo diário é uma janela, e **uma cobrança que se repete menos vezes do que a sua janela é longa fica invisível pra ela.** A renovação é anual e cai em outubro, então ler a conta estava certo e respondia uma pergunta diferente da que eu tinha feito. "Medido, não estimado" não protege de medir o intervalo errado. Não existe linha de computação nenhuma, e é isso que "sem backend" compra: um **piso** de zero, nada cobrando enquanto ninguém visita. O que ele não compra é indiferença a tráfego — S3 e CloudFront são cobrados puramente por uso, então a parte variável é zero aqui por causa do free tier e de payloads pequenos, não porque não haja o que escalar.

### Pra que serve o guardrail, na prática

A mesma leitura mostrou cerca de **USD 12,80 por mês** que o site não estava usando: web ACLs de WAF e endereços IPv4 públicos ociosos, anexados a nada, esquecidos quando o backend foi aposentado. O dobro do que o site inteiro custa, e mais de oitenta vezes o que custa publicá-lo. **Esses já saíram** — removidos em julho de 2026, e é a série diária de custo que confirma as cobranças pararem, não um console vazio dando a entender isso. Não é tudo: sobrou um resíduo da mesma época, **abaixo de um dólar por mês**, ainda cobrando enquanto eu descubro o que ele guarda — linha da conta, não do site, e o estado honesto disto na hora em que escrevo.

Eu descobri lendo a fatura, o que é tarde. Então quem vigia agora é um orçamento no nível da conta, em `iac/budget.tf`, e duas coisas nele são deliberadas. Ele **não** é escopado às tags deste projeto — se fosse, só enxergaria gasto que este repo criou, e este era justamente do tipo que ele não criou. E a sensibilidade mora nos **limiares**, não no teto: um teto precisa caber o pior mês legítimo, que aqui é o mês da renovação, então ele é surdo por construção a qualquer coisa menor que ele mesmo. O alarme que importa dispara em 15% — perto de USD 12, quieto no ritmo normal, e acordado pra qualquer novo custo recorrente de uns USD 8/mês. Um par convencional de 50/80 só falaria em USD 40, várias vezes o gasto real, e ficaria um ano calado sobre um serviço novo de USD 30/mês.

É essa a parte que se leva embora, e ela tem dois lados: infraestrutura que você para de usar não para de cobrar, e quem deveria pegar isso precisa olhar mais **largo** do que aquilo que você está construindo e mais **baixo** do que aquilo que te dá medo. *(→ [`iac/budget.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/budget.tf))*

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

Uma noite, e a maior parte dela é esperar DNS e certificado.

1. **Faça fork dos dois repos.** Leia os ADRs antes, começando no 0001 — as decisões são a parte que vale levar, e várias delas não vão servir pro seu contexto.
2. **Registre o domínio e crie a hosted zone dele no Route 53.** Seu piso de custo começa aqui e é quase todo o nome, não a hospedagem — confira o preço de **renovação** do TLD que você escolheu, não só o do primeiro ano. Depois peça um certificado no ACM **em `us-east-1`** — o CloudFront só lê certificado dessa região, onde quer que o resto da sua stack viva — e **coloque os CNAMEs de validação na zona**, que é a parte que de fato te faz esperar.
3. **Crie uma organização e um workspace no Terraform Cloud**, modo de execução **Local**, e aponte o `iac/versions.tf` pros seus nomes — **e o `TF_WORKSPACE` nos dois workflows de infra**, que é onde o workspace é de fato selecionado. Mude só o primeiro e o CI continua falando com o meu. É o que este repo usa, não uma recomendação: o estado mora lá, mas o plan e o apply rodam no meu CI, onde as credenciais são papéis OIDC de vida curta. Modo Remoto guardaria credencial no workspace — e aí passa a existir um segundo lugar de onde a infraestrutura pode mudar.
4. **Faça na mão o que o CI não consegue fazer por si**, e seja preciso sobre quais peças são essas, porque "roda uma vez local" não conta a história toda. O Terraform daqui cria o papel de **deploy**, que publica o site. Ele **não** cria o provedor OIDC do GitHub, e **não** cria o papel de infra que roda o próprio Terraform — não porque gerenciar seja impossível, mas porque a primeira execução dele precisaria da credencial que ele ainda não criou, e porque um papel capaz de reescrever a própria trust policy é um papel sem teto; o runbook é o [`docs/iac-deploy-policy.md`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/iac-deploy-policy.md). Coloque esses dois de pé antes, ou a sua primeira execução no CI não tem o que assumir. Esta é a única exceção honesta ao *apply é só de pipeline* — e, depois dela, tire as credenciais locais e nunca mais dê apply de um laptop.
5. **Configure os secrets do GitHub, e repare em qual escopo cada um vai.** Tudo que nomeia a AWS — `AWS_FED_OIDC_ROLE_ARN`, `AWS_INFRA_OIDC_ROLE_ARN` e o e-mail de alerta do orçamento, `BUDGET_ALERT_EMAIL` — é secret de **environment**; os tokens de ferramenta — `TFC_API_TOKEN`, `SONAR_TOKEN`, `VERSION_BUMP_TOKEN` — são secrets de **repositório**. Essa separação é o que impede um token que roda o lint de alcançar qualquer coisa na sua conta.
6. **Acerte o subject da trust policy — e é esse que vai te custar tempo.** Os papéis confiam num subject *imutável*: `repo:<org>@<org_id>/<repo>@<repo_id>:*`, por ID numérico, não por nome. A forma simples `repo:<org>/<repo>:*` é um nome, e nome pode ser transferido pra outra pessoa; os IDs não. O preço da forma segura é que ela não sai por copiar e colar — você tem que ir buscar os seus IDs.
7. **Troque o conteúdo e o posicionamento.** `src/content/` pro texto longo, `src/data/profile.ts` pro CV, `src/data/catalog.ts` pro portfólio, `src/i18n/messages.ts` pros textos de interface. Todo módulo que o leitor vê é tipado de modo que uma tradução faltando é **erro de compilação**, não uma página servindo o idioma errado em silêncio.
8. **Faça merge na `main`.** O merge **é** o deploy — não existe passo de promoção nem um segundo ambiente pra pegar o que o pull request deixou passar. É essa a troca que a arquitetura inteira faz, e ela só é segura porque os gates rodam no PR.

O que eu ficaria nervoso de ver alguém copiar sem o resto é **o merge direto pra produção**. Trunk-based com ambiente único é rápido e implacável na mesma medida; sem os gates na frente, sobra só a segunda metade.

## Uma limitação honesta

Este é um site de autor único, afinado ao posicionamento de uma pessoa — não é um template de propósito geral, e nunca passou pela mão de mais ninguém. Pegue o padrão, não os detalhes. O que vem a seguir, adiado de propósito: uma planta visual mais rica — o passo a passo acima é texto descrevendo um sistema, e texto não é desenho.
