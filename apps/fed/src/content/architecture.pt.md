_Este site é o argumento. Esta página é a planta — como ele é construído, e como você construiria o seu._

## Comecei o ano perdido

Um projeto que não estava indo bem, um monte de obrigações de catch-up nas ferramentas de IA, e a coisa foi degradando até o fim do ano. O **Kiro** já estava à mão fazia um tempo, e eu comecei o ano disposto a aprender a usar a ferramenta. E tem um detalhe que eu suspeito que muita gente sênior está vivendo e não diz em voz alta: **eu tinha a ferramenta de desenvolvimento agêntico na mão — e mesmo assim me sentia de fora do hype.**

Porque o problema não era a ferramenta; era onde eu ia usá-la. Naquele começo de ano, todo trabalho com IA de que eu estava perto se dividia em duas metades: a modelagem, que é forte, e o resto — systems integration, legado que não dá pra trocar, as complicações comuns de TI corporativa. É nessa segunda metade que eu passei dezoito anos, e é ela que não tem use case pronto pra você aprender — o caso tem que aparecer sozinho, no trabalho de verdade.

O caso que virou o jogo não foi este site. **No início do ano, em janeiro**, comecei a construir por fora um mecanismo de autenticação e autorização com regras de negócio densas, custom em Spring Boot e Spring Security, integrando sistemas legados. **Eu jamais teria conseguido desenvolver aquilo sem uma agentic development tool** — e não era só o prazo: eu dividia as responsabilidades de tech lead naquele projeto **ao mesmo tempo**. É essa a parte que a ferramenta comprou. Não velocidade de digitação: as duas coisas caberem na mesma semana. E nada me diverte mais que ver uma aplicação funcionando bonito — numa escala que sozinho eu não alcançava. Foi ali que eu vi uma coisa que não via fazia tempo: se o requisito é onde eu fico e o código é trabalhado por AI-DLC, projeto de software engineering pode ser mais audacioso. Não como previsão — como o que eu enxerguei naquele momento, com aquilo rodando na minha frente.

> "Computer programming is an art, because it applies accumulated knowledge to the world,
> because it requires skill and ingenuity, and especially because it produces objects of beauty."
>
> — Donald Knuth, 1974

![Letras serifadas brancas em relevo sobre uma parede clara de museu, vista de ângulo, com o nome de Donald Knuth e o ano de 1974 abaixo, à direita.](/photos/knuth-cv-museum.jpg "Cinquenta anos antes de mim, alguém já tinha nomeado a parte de que eu mais gosto — e a parede fica no museu que existe pra registrar isso.")

**As férias foram em maio, em São Francisco e no Vale, e é dali que sai o resto desta página.** Não teve lugar por onde eu passei sem alguma oferta de IA — no trem, na rua, na vitrine, no crachá de quem estava do lado. Voltei com a ideia do que fazer, e desde então toco isso em duas frentes: uma interna, no trabalho, com **Kiro**, e esta, pública, com **Claude Code**. Dois harness rodando o mesmo tipo de trabalho é o que me deixa separar o que é do modelo do que é do setup em volta dele.

Numa manhã eu peguei o Caltrain para sul — 8h57, próxima parada Palo Alto. O vagão era laptop aberto de ponta a ponta, loop rodando, gente trocando ideia em voz alta a caminho do trabalho. Não era evento, não era comunidade, não era nada combinado. O que eu concluí dali, e não o que eu vi: um monte de gente fazendo o mesmo tipo de trabalho, no mesmo lugar, na mesma hora — perto o suficiente para ouvir sem pedir e para responder sem marcar. Eu estive dentro disso por uma semana, em maio. No resto do ano, não estou.

![Montagem de três fotos da mesma semana: à esquerda, eu e minha companheira numa calçada de pedra ao lado de uma fileira de bicicletas vermelhas, amarelas e verde-água, com árvores e céu limpo atrás; no alto à direita, o painel de bordo de um vagão do Caltrain, com "Southbound · 510 EXPRESS · 8:57a" e, abaixo, "NEXT STOP Palo Alto"; embaixo à direita, uma vitrine de museu com um iPhone de 2007 desmontado atrás de acrílico, suas peças etiquetadas — câmera, sensor de luz, microfone, alto-falante, SIM, vibracall — sob a legenda "iPhone · INTRODUCED IN JUN 2007".](/photos/may-week-montage.jpg "Uma semana, em maio: o visitor center do Google em Mountain View, o Caltrain para sul das 8h57, a vitrine do Computer History Museum. Um trem, uma manhã, nenhuma medição. Não é dado; é o que eu vi.")

Fora daquela semana o vagão não existe, e é ele que a frente pública substitui — tem uma razão para ela existir em vez de um caderno. Há opções de configuração demais — qual harness, quais hooks, que persona, que gate, qual modelo — e ninguém tem sessões suficientes para testar todas sozinho. **Trocar a experiência de cada um usando IA é o que vai acelerar esse aprendizado**, e por isso o que está aqui é o setup inteiro, não só a conclusão a que ele chegou.

## O que o requisito exigia, e a arquitetura que ele justificou

O requisito desta frente pública é curto: **publicar conteúdo, em dois idiomas, com a construção inteira em aberto.** É ele que decide a arquitetura, a conta, e o resto desta página.

E ela **não foi construída enxuta**. Foi construída inteira e depois cortada: havia uma plataforma com backend — BFF em Lambda, DynamoDB, Cognito, SES —, um Lambda@Edge renderizando imagens OG a cada requisição, um serviço de unfurl de links, GitFlow com staging e produção, e um PWA offline-first. Um banco sem nada para guardar. Auth sem ninguém para autenticar. Um staging para um site cujo revert é um merge. Cada uma era defensável quando foi decidida, e nenhuma sobreviveu à pergunta *"para que isso serve, aqui"* — e cada reversão está registrada junto com a decisão que a substituiu: [0025](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0025-superseded-backend-platform.md), [0026](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0026-superseded-lambda-edge-og.md), [0027](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0027-superseded-backend-link-unfurl.md), [0028](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0028-superseded-gitflow-two-env.md), [0029](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0029-superseded-offline-first-pwa.md).

**O corte não é o assunto desta página; ele é a consequência.** O que sobrou são três coisas — um site estático, um plugin de dev-loop e um runtime de agente — e elas não são camadas de um mesmo sistema: **cada uma existe sem as outras duas.** O site roda sem o plugin. O plugin instala em qualquer repositório. O runtime não é meu. O que fica no meio é a única coisa que nenhuma das três entrega sozinha — e é ali que mora o jeito como eu construo isto, que é o jeito como eu quero ser contratado pra construir: desenvolvimento AI-native com o rigor de SDLC que a maior parte do trabalho com IA dispensa, num loop construído sobre AI-DLC & **(Agent) Harness Engineering**.

```venn
accTitle: Os três pilares, e o que fica na interseção
accDescr: Três círculos do mesmo tamanho, sobrepostos, com uma interseção comum no centro. O primeiro círculo é a solução, o repositório tadeumendonca-io, e dentro dele estão a SPA em React com Vite e TypeScript, o Terraform que provisiona CloudFront e S3, o pipeline com os gates e o deploy, e o conteúdo em markdown no próprio repositório. O segundo é a customização do harness, o repositório tadeumendonca-skills, e dentro dele estão as personas no diretório agents, os hooks registrados em hooks.json, a biblioteca de skills no diretório skills, os três comandos que uma pessoa digita no diretório commands — autonomy-off, autonomy-on e new-issue — e os ADRs de metodologia. O terceiro é o runtime do harness, o Claude Code, e dentro dele estão o orquestrador e os subagentes, os eventos PreToolUse e SessionStart, a política de permissões e as ferramentas com o MCP. No centro, onde os três se sobrepõem, está escrito Agent Harness Engineering, com a palavra Agent entre parênteses. A afirmação do desenho é essa: nenhum dos três círculos sozinho é a disciplina, ela é o que existe onde os três se encontram.
centre: (Agent) Harness | Engineering
pillar: A solução | tadeumendonca-io
- SPA React · Vite · TS
- Terraform: CloudFront, S3
- Pipeline: gates, deploy
- Markdown no repositório
pillar: A customização | tadeumendonca-skills
- Personas em agents/
- Hooks em hooks.json
- A biblioteca de skills
- Comandos que você digita
- ADRs de metodologia
pillar: O runtime | Claude Code
- Orquestrador, subagentes
- PreToolUse · SessionStart
- Política de permissões
- Ferramentas e MCP
```

O que fica na interseção é o trabalho de verdade: decidir o que o harness **barra**, o que ele **aconselha** e o que ele só **documenta** — e depois provar que o inventário disso continua verdadeiro. O `Agent` fica entre parênteses de propósito: um rótulo precisa ser curto e uma afirmação precisa ser exata, e o parêntese deixa uma forma só fazer as duas coisas.

**O lançamento mostrou o resultado. A vitrine mostra a máquina.**

## Pilar 1 · a solução

Uma SPA totalmente estática — React + Vite + TypeScript — servida a partir de **S3 atrás do CloudFront**, com uma pequena CloudFront Function reescrevendo URLs limpas. Sem servidor, sem banco, sem auth. O conteúdo é markdown no próprio repositório, e cada rota é **prerenderizada** no build, nos dois idiomas.

*(→ [ADR-0002](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0002-fully-static-spa-no-backend.md) totalmente estático / sem backend · [ADR-0013](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0013-s3-cloudfront-hosting.md) S3 + CloudFront)*

De ponta a ponta, com os bastidores junto — e **o que interessa nesse desenho é o que não está nele**:

```mermaid
flowchart LR
  accTitle: As raias e os tiers — o que o leitor encontra, e o que mantém isso de pé
  accDescr: Uma grade que se lê da esquerda para a direita, com quatro colunas — público, dispositivos, frontend e infra cloud — e três raias empilhadas dentro delas. A raia de cima é a audiência, o que o leitor encontra no site: o público chega por um link, o dispositivo pede uma URL, e o que volta é HTML pré-renderizado nos dois idiomas, com a SPA React assumindo depois e nenhum terceiro carregado antes de o leitor autorizar — GA4 só com consentimento, YouTube só no clique. Essa página vem inteira da coluna de infra cloud: Route 53, ACM, CloudFront com a função de reescrita, e um bucket S3 privado que só responde àquela distribuição. Entre o frontend e a infra não existe coluna de backend, e essa ausência é a afirmação do desenho: não há tier de aplicação, porque o requisito nunca pediu um, e nada meu roda a cada requisição. As duas raias de baixo são os bastidores, o que ninguém vê e que mantém a operação de pé. A raia de produção: eu abro a Issue e ratifico o irreversível; o GitHub é o console, de qualquer dispositivo, e uma menção a claude dispara o agente dentro do CI sem nenhuma máquina minha ligada; o repositório e o build carregam as personas e os hooks que negam a chamada, e produzem os dois idiomas e o PDF do CV; o Terraform aplica a infraestrutura só pelo pipeline, com estado no Terraform Cloud. A raia de operação é a mais fina, e é fina por constatação e não por desenho: o que eu meço é GA4 depois do consentimento, então quem recusa não entra na conta; nada observa o dispositivo do leitor, sem RUM, sem log de acesso e sem monitor de disponibilidade; depois de cada deploy um smoke roda contra o apex vivo e confere que a função publicada é a deste repositório; e sobre a conta inteira há um orçamento que avisa por e-mail, que é o único vigia contínuo que existe.
  subgraph T1["PÚBLICO"]
    A1["AUDIÊNCIA<br/>leitores, recrutadores<br/>quem chegou por um link"]
    B1["BASTIDORES · produção<br/>eu — abro a Issue<br/>e ratifico o irreversível"]
    C1["BASTIDORES · operação<br/>o que eu meço:<br/>GA4 só depois do consentimento<br/>quem recusa não é medido"]
  end
  subgraph T2["DISPOSITIVOS"]
    A2["navegador, celular<br/>e os scrapers de LinkedIn e X<br/>pedindo a mesma URL"]
    B2["GitHub, de qualquer dispositivo<br/>Issue, comentário, PR<br/>uma menção a claude roda o agente no CI"]
    C2["nada observa o dispositivo<br/>sem RUM, sem log de acesso<br/>sem monitor de disponibilidade"]
  end
  subgraph T3["FRONTEND"]
    A3["HTML pré-renderizado nos dois idiomas<br/>a SPA React assume depois<br/>terceiro nenhum<br/>antes de o leitor autorizar"]
    B3["o repositório e o build<br/>personas em agents<br/>e hooks que negam a chamada<br/>os dois idiomas e o PDF do CV"]
    C3["depois de cada deploy<br/>smoke contra o apex vivo<br/>e a função no ar conferida contra este repo"]
  end
  subgraph T4["INFRA CLOUD"]
    A4["Route 53 · ACM<br/>CloudFront com a função de reescrita<br/>S3 privado, só por OAC"]
    B4["Terraform só pelo pipeline<br/>plan no PR, apply no merge, via OIDC<br/>estado no Terraform Cloud"]
    C4["sobre a conta inteira<br/>um orçamento avisa por e-mail<br/>o único vigia contínuo"]
  end
  A1 -- "abre um link" --> A2
  A2 -- "pede uma URL" --> A3
  A3 -- "vem inteira daqui —<br/>e entre as duas<br/>não há backend nenhum" --> A4
  B1 -- "abre o trabalho" --> B2
  B2 -- "dispara o loop de agentes" --> B3
  B3 -- "publica na origem" --> B4
  C1 ~~~ C2
  C2 ~~~ C3
  C3 ~~~ C4
  linkStyle 2 stroke-dasharray:6 4
```

**A ausência é deliberada, não uma lacuna.** Um desenho desses, para um sistema assim, costuma ter uma coluna de aplicação, um banco e integrações internas entre o frontend e a infra; aqui não há coluna nenhuma ali, e o que o leitor pede vem inteiro de um bucket. O único terceiro em tempo de execução é a analytics, e ela depende de consentimento. E "sem backend" levanta uma pergunta antes das outras — como um crawler enxerga isto —, cuja resposta é que nada precisa ser **renderizado** para ele enxergar: o que ele pede vem como HTML completo, com as tags OG dentro, direto de um arquivo estático. Sem SSR, sem renderização na borda — a função de reescrita da borda roda a cada requisição de página e mexe na URL, nada mais.

O limite viaja junto com a afirmação, porque é a parte que um leitor consegue derrubar: **uma URL que não existe responde 200, não 404 — e o que volta é a landing page**, com as tags OG da própria landing, sob um endereço que nunca existiu. O CloudFront mapeia `403` e `404` para `/index.html`, que é o que deixa uma SPA funcionar em rotas profundas e é uma troca real, não um detalhe. Já mordeu aqui uma vez: um desvio de caminho jogou as imagens de OG por artigo nesse mesmo fallback, e cada uma respondeu `200 text/html` a todo scraper que a pediu.

A única lógica que roda entre um leitor e um arquivo é essa função: [dez linhas executáveis](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/cloudfront-functions/spa-rewrite.js), com [testes unitários próprios](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/scripts/spa-rewrite.test.mjs) e uma [verificação pós-deploy](https://github.com/tedeuxx/tadeumendonca-io/blob/main/.github/workflows/deploy.yml) de que a função no ar continua sendo a deste repositório. E o bucket **não é público em nenhum sentido**: só responde a `s3:GetObject` vindo desta distribuição.

*(→ [ADR-0004](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0004-build-time-render-not-ssr-or-edge.md) render no build, sem SSR · [ADR-0005](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0005-og-coverage-every-public-url.md) toda URL OG-completa · [ADR-0033](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0033-ga4-consent-gated-analytics.md) analytics dependente de consentimento · [`iac/frontend.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/frontend.tf) a distribuição e as policies)*

### R$ 34,31 por mês

Esse número mede o que este site **acrescentou**, não aquilo de que ele **depende**, e mede aquilo **em que** ele roda, não aquilo com que eu o **construo**. Dizer "custo quase zero" é a coisa mais fácil desta página, e a mais fácil de ninguém conferir — então segue a conta, com as linhas de hospedagem lidas do custo diário da conta no **fim de julho de 2026** e o registro lido da tabela do registrador. Nenhuma estimada. A fatura da AWS é em dólar, e o câmbio usado aqui é **R$ 5,222/USD**, o fechamento de **14 de agosto de 2026** — fixo no texto, não buscado a cada build, para que o número publicado só mude quando alguém decidir mudá-lo. É com ele que você desfaz qualquer linha abaixo de volta ao valor da fatura:

- **O domínio** — R$ 370,76/ano pelo `.io`, uma cobrança anual que cai num mês só. **R$ 30,91/mês** amortizado. Escolhi o `.io` por branding, não por custo: é a razão honesta, e a única linha daqui que você pode recusar.
- **Route 53** — R$ 2,61/mês, fixo. A hosted zone, com ou sem visitante.
- **S3** — cerca de R$ 0,78/mês, e são *escritas* de deploy, não leituras.
- **CloudFront** — na prática R$ 0,00 com esse volume: o tráfego deste site não chega a arranhar o piso do serviço.

Some as linhas e você chega a R$ 34,30, um centavo abaixo do título. Cada linha é arredondada por conta própria, e o total lá em cima é a conversão dos **USD 6,57** — que não são uma fatura só: USD 0,65 saem do custo diário da AWS e USD 5,92 são o `.io` amortizado, da tabela do registrador. Os dois nascem em dólar, e o real desta seção inteira é derivado deles.

Fora da AWS o critério é o mesmo. GitHub Team e Claude Max são pagos e ficam **fora** do total — a assinatura do GitHub Team é anterior ao site, embora a carga de CI em cima dela seja inteiramente dele; GitHub Actions e SonarCloud são zero **porque os repositórios são públicos** — propriedade dos repositórios, não do plano — e Terraform Cloud é zero **porque a infraestrutura é pequena**. E o **iCloud+** é a linha que mostra o critério sendo aplicado em vez de anunciado: ele é anterior ao site, mas carrega o e-mail com domínio próprio no apex e o [`iac/email.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/email.tf) provisiona os registros MX, DKIM e SPF dele — então não é adjacente a esta infraestrutura, está dentro dela. *(→ [ADR-0016](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0016-custom-email-via-icloud.md))*

Fora do total ficam também todas as minhas horas: **R$ 34,31 por mês é o que custa manter isto no ar, não o que custou construir.** Em pessoas, custou uma — fins de semana, em paralelo com consultoria. E a mesma leitura mostrou cerca de **R$ 66,84 por mês** que o site não estava usando: web ACLs de WAF e IPv4 públicos ociosos, esquecidos quando o backend foi aposentado. Descobri lendo a fatura, o que é tarde — **infraestrutura que você para de usar não para de cobrar** —, e quem vigia agora é um orçamento em [`iac/budget.tf`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/iac/budget.tf) deliberadamente **não** escopado às tags deste projeto: se fosse, só enxergaria gasto que este repo criou, e este era justamente do tipo que ele não criou.

## Pilar 2 · a customização

A parte interessante não é a stack — é como ela é construída: **agent-led verification, human-residual**. O agente prova o "pronto" com gates mecânicos e evidência real (lint, tipos, testes ≥85%, build verde, SonarCloud, E2E funcional, um revisor de contexto fresco); o humano fica com as decisões irreversíveis e arquiteturais. Esse loop vive num plugin à parte — **[tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)** —, então é uma metodologia que você pode adotar, não algo sob medida só pra este site.

```mermaid
flowchart TB
  accTitle: Como o trabalho atravessa os tiers de agente — e onde eu entro
  accDescr: Um fluxo de cima para baixo em três tiers, com o dono nas duas pontas e uma caixa grande no meio que roda sem ele. No topo estou eu: sou o único que gera demanda, e abro a Issue. O tier 1 é a admissão, e não é uma caixa só: são três raias, e o tipo da issue decide em qual ela entra. Uma issue de produto fecha pelas duas lideranças que discordam por construção, product-lead e tech-lead. Uma de conteúdo fecha pela lente que segura a minha voz, product-lead sozinha. Uma de loop, que é a maquinaria em si, fecha por agents-lead e tech-lead juntos, porque é o tipo de mudança que mais costuma exigir um ADR. As três raias desembocam no mesmo rótulo ready, que é o artefato que diz que a descrição foi fechada — e numa issue de loop esse rótulo é meu, só eu ponho. Do ready para baixo começa o trecho AFK, o que roda sem perguntar quando eu mando drenar a fila: tudo ali dentro passa pelo orquestrador, que é a sessão principal e o eixo por onde toda persona é acionada, que commita e empurra, e que nunca faz merge nem decide o irreversível. Ele aciona o tier 2, o build, também dividido por tipo: developer no produto, writer no conteúdo, agents-lead no loop, construindo o que ele mesmo acabou de estressar. Sai dali uma merge request por story, que chega ao tier 3 — contexto fresco, sem viés de autoria — onde quality-assurance verifica a Definition of Done e, à parte, se aquilo pode quebrar a produção; é o único que pode fazer merge. O que é classe segura ele mesmo mergeia, e o merge é o deploy. O que é classe de fronteira — infraestrutura, as regras do próprio loop, publicar na minha voz — sai do trecho AFK e volta para mim, e só depois do meu go é que sobe. Recusa é um canal só: o gate pedindo mudanças e o meu no-go caem na mesma caixa de devolvido, e ela volta pelo orquestrador, nunca direto para quem construiu. Nove caixas de persona, seis nomes: product-lead, tech-lead e agents-lead aparecem em mais de uma raia porque o mesmo perfil é acionado em momentos diferentes. E há um canal tracejado meu com o orquestrador, para quando algo trava — existe o tempo todo e não fica no caminho. A afirmação do desenho é essa: entre o rótulo ready e o merge não há nenhum humano no caminho, e eu apareço só nas duas pontas — o que atravessa aquele trecho sozinho é apenas a classe segura.
  H(["HITL · EU<br/>o único que gera demanda<br/>abro a Issue"])
  subgraph L3["TIER 1 · loop"]
    LM["agents-lead"]
    LT["tech-lead<br/>a maquinaria em si"]
  end
  subgraph L1["TIER 1 · produto"]
    PL["product-lead"]
    TL["tech-lead<br/>discordam por construção"]
  end
  subgraph L2["TIER 1 · conteúdo"]
    PC["product-lead<br/>a lente que segura a minha voz"]
  end
  RQ{{"O TIER 1 FECHA AQUI · o rótulo ready<br/>a descrição fechada — e numa issue de loop,<br/>só eu ponho"}}
  subgraph AFK["AFK · do ready ao merge, nada no caminho é humano"]
    ORCH["ORQUESTRADOR ·<br/>a sessão principal<br/>aciona toda persona, commita, empurra<br/>nunca faz merge, nunca decide o irreversível"]
    DEV["TIER 2 · BUILD<br/>developer — produto"]
    WRT["TIER 2 · BUILD<br/>writer — conteúdo"]
    LB["TIER 2 · BUILD<br/>agents-lead — loop<br/>constrói o que estressou"]
    MR{{"MERGE REQUEST · uma por story"}}
    QA["TIER 3 · GATE<br/>— contexto fresco, sem viés de autoria<br/>quality-assurance<br/>a Definition of Done, e se isso quebra a produção<br/>o único que pode fazer merge"]
    V["devolvido — um canal de volta só"]
    M{{"merge em main = o deploy"}}
  end
  HO(["HITL · EU<br/>classe de fronteira: irreversível, arquitetural<br/>go / no-go"])
  H -- "produto" --> PL
  H -- "produto" --> TL
  H -- "conteúdo" --> PC
  H -- "loop" --> LM
  H -- "loop" --> LT
  PL --> RQ
  TL --> RQ
  PC --> RQ
  LM --> RQ
  LT --> RQ
  RQ --> ORCH
  ORCH -- "produto" --> DEV
  ORCH -- "conteúdo" --> WRT
  ORCH -- "loop" --> LB
  DEV --> MR
  WRT --> MR
  LB --> MR
  MR -- "acionada pelo orquestrador" --> QA
  QA -- "classe segura" --> M
  QA -- "classe de fronteira" --> HO
  HO -- "go" --> M
  QA -- "mudanças" --> V
  HO -- "no-go" --> V
  V --> ORCH
  H <-.-> ORCH
```

Eu apareço nas duas pontas, e são trabalhos diferentes: no começo abrindo a Issue, e no fim, só no que é classe de fronteira, decidindo se aquilo sobe. Entre uma ponta e outra não há humano nenhum no caminho. E o desenho afirma uma coisa mais estrita do que "no plano": eu sou a **única origem de demanda** — nada entra na fila por conta própria —, e quem fecha a admissão é o rótulo `ready`, que é o artefato que diz que a descrição foi fechada; do `ready` para baixo, só a classe segura atravessa sozinha. E o custo disso, já que o resto desta página assume os seus: quem decide que uma mudança é segura é o mesmo tipo de coisa que escreveu a mudança. Classifique uma errado e ela pega o caminho vazio. O que torna isso aceitável aqui é raio de impacto, não confiança — é um site estático, e reverter é um merge.

*(→ [ADR-0003](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0003-trunk-based-single-environment.md) trunk-based, ambiente único · [ADR-0018](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0018-ci-gates-e2e-on-pr-coverage.md) os gates de CI)*

### Do que o harness é feito

```mermaid
flowchart LR
  accTitle: Do que o harness é feito
  accDescr: Uma grade: quatro raias, uma por tipo de componente que o plugin exporta, cruzadas com três colunas, uma por classe de força. As raias são os 7 hooks registrados no hooks.json, as 6 personas do diretório agents, as 13 skills do diretório skills e os 3 comandos do diretório commands. Das doze células, cinco têm conteúdo e sete estão vazias — e as vazias são a afirmação do desenho. Na coluna que nega há uma célula só: permission-guard e wip-guard, os 2 hooks do evento PreToolUse com o matcher Bash, que RECUSAM uma chamada de ferramenta antes dela rodar; persona, skill e comando não têm célula nenhuma ali. Na coluna do meio também há uma só: as personas agents-lead, developer, product-lead, quality-assurance, tech-lead e writer apenas ACONSELHAM, e isso é uma afirmação sobre o JULGAMENTO delas, não sobre a cadeira. quality-assurance é o caso mais agudo nas duas direções: a regra 7b do permission-guard recusa o comando de merge vindo de qualquer agent type que não seja esse, então QUEM faz o merge é forçado por mecanismo — e nada em lugar nenhum verifica se a revisão foi feita, ou feita bem. agents-lead é mais fraca ainda, e não pode ser lida como a mesma coisa: roda antes de qualquer coisa ser construída, não barra nada, e nada obriga que ela seja acionada — uma lente que não é acionada falha em silêncio. product-lead é o caso espelhado: BARRA um merge diante de uma afirmação publicada que não é verdade, mas por convenção e não por hook, então nada recusa o comando de merge em nome dela; e writer, que redige texto publicado, é contida pelo mesmo mecanismo que contém product-lead — uma regra do permission-guard nega a ela postar diretamente, já que ela lê material privado pra redigir. Na coluna dos que DOCUMENTAM ficam três células: as 13 skills, que é o que o modelo aciona sozinho, os 3 comandos, que é o que uma pessoa digita, e os outros 5 hooks — session-wip e session-plugin-version no SessionStart, dispatch-metrics-start e dispatch-metrics-stop no SubagentStart e no SubagentStop, e zombie-loop-detect no Stop. Esses cinco não estão nessa coluna pelo mesmo motivo, e dizer qual motivo vale pra qual é a afirmação mais afiada. Três deles não conseguem recusar nada: o SessionStart e o SubagentStart não entregam chamada nenhuma de ferramenta pra negar, então pro session-wip, pro session-plugin-version e pro dispatch-metrics-start a coluna diz um limite do EVENTO — um hook em qualquer um dos dois roda e pode agir, só não tem nada na frente pra barrar. Os outros dois conseguiriam e não conseguem por escolha. O Stop e o SubagentStop CONSEGUEM recusar — o Claude Code deixa um hook no primeiro barrar o fim do turno e um hook no segundo barrar a parada do subagente — e nenhum dos dois scripts aqui aceita isso. O dispatch-metrics-stop escreve as métricas do acionamento na Issue dele e sai com sucesso em toda saída, inclusive nas que desistem cedo. O zombie-loop-detect roda no fim de todo turno meu e lê uma coisa só: o branch atual tem uma pull request aberta cujo último veredito do gate, conferido contra o head atual daquela pull request, pede mudanças ou espera o meu go? Se tem, o aviso abre o turno seguinte uma vez pra aquele head e não se repete enquanto nada se mexe, rearmando só quando entram commits novos; toda saída dele é de sucesso e nada nunca é barrado. Então esses dois estão na coluna dos que DOCUMENTAM por ESCOLHA deles, e não por limite do evento, e o que o zombie-loop-detect compra é detecção um turno atrasada, não prevenção: um acionamento que foi narrado e nunca aconteceu deixa o loop parado sem nenhum artefato dizendo isso, e é ele o artefato que diz. Os cinco só reportam — três porque o evento não permite outra coisa, dois porque o script decidiu assim, e a coluna carrega os dois casos sem fingir que são um só. Lida de ponta a ponta, a grade é quase toda vazia, e é isso que ela afirma: de tudo que o plugin exporta, exatamente um tipo — um hook no PreToolUse — consegue recusar; todo o resto aconselha ou documenta.
  subgraph LANE["tipo · o que o -skills exporta"]
    direction TB
    LH["hooks · 7<br/>hooks.json"]
    LP["personas · 6<br/>agents/"]
    LS["skills · 13<br/>skills/"]
    LC["comandos · 3<br/>commands/"]
    LH ~~~ LP ~~~ LS ~~~ LC
  end
  subgraph COLD["NEGA"]
    direction TB
    HKD["2 hooks · PreToolUse<br/>matcher Bash<br/>permission-guard<br/>wip-guard"]
    PSD["— nenhuma persona"]
    SKD["— nenhuma skill"]
    CMD["— nenhum comando"]
    HKD ~~~ PSD ~~~ SKD ~~~ CMD
  end
  subgraph COLA["ACONSELHA"]
    direction TB
    HKA["— nenhum hook"]
    PS["6 personas · agents/<br/>agents-lead<br/>developer<br/>product-lead<br/>quality-assurance<br/>tech-lead<br/>writer"]
    SKA["— nenhuma skill"]
    CMA["— nenhum comando"]
    HKA ~~~ PS ~~~ SKA ~~~ CMA
  end
  subgraph COLO["DOCUMENTA"]
    direction TB
    HKR["5 hooks · nenhum deles recusa<br/>2 hooks · SessionStart<br/>session-wip<br/>session-plugin-version<br/>2 hooks · SubagentStart e SubagentStop<br/>dispatch-metrics-start<br/>dispatch-metrics-stop<br/>1 hook · Stop<br/>zombie-loop-detect<br/>Stop e SubagentStop poderiam barrar — nenhum barra"]
    PSO["— nenhuma persona"]
    SK["13 skills · skills/<br/>o que o modelo aciona"]
    CM["3 comandos · commands/<br/>o que você digita<br/>autonomy-off<br/>autonomy-on<br/>new-issue"]
    HKR ~~~ PSO ~~~ SK ~~~ CM
  end
  LANE ~~~ COLD ~~~ COLA ~~~ COLO
  classDef mechanism stroke:#FF5A00,stroke-width:3px
  classDef convention stroke-dasharray:6 4
  %% `vazia` nunca pode usar #FF5A00 nem stroke-dasharray: o teste conta exatamente uma caixa na cor de
  %% destaque (o mecanismo) e exatamente uma tracejada (a convenção) no SVG compilado, e qualquer um dos
  %% dois aqui faria sete células vazias afirmarem uma força que elas não têm. E tem de ficar dentro das
  %% três cores do ADR-0008 — o primeiro rascunho apagava essas células com #555555/#888888 e o gate de
  %% paleta pegou isso nas duas edições. Aqui uma célula recua por opacidade; um quarto cinza não existe.
  classDef vazia fill:none,stroke:#F5F4EF,color:#F5F4EF,opacity:0.45
  class HKD mechanism
  class PS convention
  class PSD,SKD,CMD,HKA,SKA,CMA,PSO vazia
```

**Dos componentes do próprio plugin, exatamente um tipo consegue te barrar**, e essa é a versão honesta do convite a adotar: os dois hooks de `PreToolUse` devolvem uma negativa *antes* da ferramenta rodar, e o comando não acontece. Os outros cinco só reportam, e não pelo mesmo motivo — e essa distinção esta página te deve, não dá pra arredondar. Três deles estão em eventos que não recusam nada: o `SessionStart` e o `SubagentStart` não têm chamada de ferramenta na frente, então esses três não conseguiriam barrar nem se quisessem. Os outros dois conseguiriam. O `Stop` *consegue* barrar o fim do turno e o `SubagentStop` *consegue* barrar a parada de um subagente, e os dois scripts escolhem não barrar: toda saída dos dois é de sucesso. O `zombie-loop-detect` percebe, um turno atrasado e uma vez por head, que tem branch parado em cima de um veredito do gate que ninguém tratou; o `dispatch-metrics-stop` registra os números do acionamento e sai da frente. Dois hooks escolhendo não ser mecanismo dizem mais sobre este harness do que um dizia. E as personas **aconselham** — o julgamento delas não é verificado por nada, e o guia deste repositório diz com todas as letras que uma lente que ninguém aciona *falha em silêncio*. Essa é a garantia que o loop dá — e ela vale exatamente o que valer o inventário do desenho acima.

**E o inventário desse desenho é conferível — é essa a segunda garantia, e ela é de outra natureza.** Renomeie uma persona no plugin e o build deste repositório fica vermelho. O diagrama acima é escrito à mão: um teste compara o desenho, nó a nó e contagem a contagem, com um [manifesto versionado](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/content/generated/harness.json), nas duas edições; e um [job de CI](https://github.com/tedeuxx/tadeumendonca-io/blob/main/.github/workflows/app.yml) compara esse manifesto com a árvore viva do plugin. A diferença entre desenhar um harness e provar que o desenho ainda é ele é exatamente essa, e ela é mecânica. E ela tem duas pernas, com limites diferentes, ditos aqui e não depois. Do desenho para o manifesto, a comparação inclui a **classe de força** de cada uma das doze células, nas duas edições: dar `denies` a uma persona no manifesto deixa isto vermelho, e é essa a afirmação central da grade. Do manifesto para a árvore viva do plugin, a checagem chega **tarde**, porque nada deste lado enxerga um merge de lá, e a classe de cada componente sai de uma regra sobre o formato dele — em que evento um hook está registrado —, não de uma leitura do que o script faz: relendo o manifesto, o que se confere é que a classe é um valor **legal**, não que ela é verdadeira daquele componente.

**E é por isso que eu chamo isto de uma coisa, e não de outra.** **AI-DLC** não é meu — é o nome que a AWS deu a um ciclo de entrega cujas etapas são executadas e verificadas por agentes; eu adoto, não inventei. **Agent Harness Engineering** é a afirmação que eu faço: construir, versionar e provar o harness em volta desse ciclo. Adotar uma metodologia não custa nada dizer — e é justamente por isso que dizer não vale nada. Essa aqui é paga, e o pagamento está no parágrafo acima: um build que quebra quando o inventário deixa de ser verdade. É a mesma régua de **agent-led verification** que o resto desta página aplica ao código, virada para a metodologia: quem afirma é quem produz a evidência.

*(→ [ADR-0043](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0043-harness-inventory-derived-from-plugin-repo.md) o inventário ancorado no plugin)*

**Seis personas, contra quem cada uma argumenta — e o que cada uma carrega ao ser acionada.** A última coluna é o preload de cada brief: as skills que entram na sessão da persona antes de ela ler a primeira linha da tarefa.

| quem | o que é dele | contra quem argumenta | que skills carrega ao ser acionada |
|---|---|---|---|
| `product-lead` | o leitor, valor, ordem, tamanho da fatia — e posicionamento, voz, e a verdade de qualquer coisa publicada | o `tech-lead`; e é a única lente que **barra** em vez de aconselhar, diante de uma afirmação publicada que não é verdade | `harness-engineering` · `definition-of-ready` · `command-hygiene` |
| `tech-lead` | arquitetura, medição, sequenciamento — e é ele que escreve os ADRs | o `product-lead`, de propósito: produto-e-mercado e sistema são otimizações genuinamente diferentes | `harness-engineering` · `definition-of-ready` · `documentation-standard` · `devops` · `command-hygiene` |
| `developer` | a fatia inteira — aplicação, infraestrutura, pipeline, e os testes escritos junto | ninguém. Ele constrói, e é pra ele que o gate está apontado | `harness-engineering` · `code-review` · `quality-gates` · `devops` · `command-hygiene` |
| `quality-assurance` | a entrega contra a Definition of Done, e, à parte, se a mudança pode quebrar a produção | o `developer`, nos dois eixos numa passada só — e é o único que o hook de permissão deixa fazer merge | `harness-engineering` · `quality-gates` · `devops` · `command-hygiene` |
| `writer` | redige artigos, texto do site e a linguagem dos posts de rede social na voz do dono — molda, corta, estrutura e traduz uma experiência que ele já tem, nunca origina uma | o `product-lead`, que segura o veto bloqueante sobre qualquer coisa que ela redige e chega a uma superfície pública | `harness-engineering` · `command-hygiene` |
| `agents-lead` | a maquinaria em si: hooks, permissões, instruções das personas, skills e comandos, o plugin | **eu** — e esse é o caso interessante: o contraponto dele não é outra persona, é a única cadeira deste loop que não tinha com quem discutir | `harness-engineering` · `documentation-standard` · `devops` · `command-hygiene` |

Duas coisas dessa última coluna valem ser ditas. **`harness-engineering` e `command-hygiene` estão nas seis** — é o preload universal: entender o próprio loop e a disciplina de arquivo e comando não é assunto de especialidade nenhuma. E **só 7 das 13 skills da biblioteca são pré-carregadas por alguém**, ou seja, mais da metade da biblioteca só chega numa sessão se o modelo a encontrar sozinho, pela descrição dela.

**E esta tabela é escrita à mão — a coluna nova inclusive.** Os nomes de persona do desenho lá em cima são comparados com o manifesto e com a árvore viva do plugin, então aposentar uma persona deixa um build daqui vermelho. Aqui, nada compara coisa nenhuma: o `check-harness-drift` confere nomes e contagem de personas, e **não** confere quais skills cada uma carrega. Basta alguém mudar o bloco `skills:` de um brief para esta coluna passar a mentir no dia seguinte, sem nenhum sinal. Se um papel mudar de mãos, o desenho fica vermelho e estas linhas caladamente não.

## Pilar 3 · o runtime

O orquestrador é a parte do harness que você **não consegue instalar**. Ele não está em nada do inventário acima — nem na grade de componentes, nem no manifesto, embora o fluxo dos tiers o desenhe bem no meio do trecho AFK — e é a sessão principal: o contexto que lê uma Issue, decide qual persona acionar e pesa o que volta. O **ator** não é componente do plugin, a **política** dele em parte é, e o que você põe é o contexto que roda aquilo. É também a parte *contra* a qual as fronteiras acima foram desenhadas: o título da coluna *aconselha · se acionada* nomeia o acionamento como o modo de falha sem nomear quem aciona. Quem aciona é ele, e uma lente que ele esquece é uma lente que ninguém rodou.

**E o contexto dele acaba.** É isso que um subagente compra: ele lê, roda, erra e refaz **dentro da sessão dele**, e o que chega ao orquestrador é a conclusão. Uma tarefa custa ao orquestrador **o veredito, não a execução**, e por isso a única alavanca real deste harness é o tamanho do veredito, girada escrevendo as instruções de cada persona. Medi uma vez, na sessão deste repositório, em 7–8 de agosto de 2026, lendo as transcrições: o que ficou dentro dos subagentes foi mais de uma ordem de grandeza maior do que o que voltou. E a economia tem teto — mesmo assim, os vereditos que voltaram foram uma fatia grande de tudo que o orquestrador consumiu vindo de uma ferramenta. Não é fuga: aquela sessão compactou duas vezes de qualquer jeito. **O número não é publicado porque a fonte é uma transcrição de sessão privada, que gate nenhum alcança.**

**E o chão embaixo dele se mexe.** Esta é a parte que o resto desta página não tem: o site eu controlo, o plugin eu controlo, o runtime não. Quem o produz publica mudança o tempo todo, e cada modelo novo muda qual configuração ainda faz sentido — não porque a configuração tenha ficado errada, mas porque ela estava compensando uma fraqueza que sumiu.

Não é dedução minha. Quando o Opus 5 saiu, o time do Claude Code **apagou mais de 80% do próprio system prompt** — o do produto deles, não a configuração pessoal de alguém — e o modelo ficou **melhor** sem o andaime. E não como evento único: a cada upgrade grande de modelo é menos andaime necessário, então se apaga regra e se recoloca só onde o modelo ainda erra. Isso é um ciclo, não uma faxina.

A tese que vem junto é a que me interessa, e ela é dura: modelos de fronteira estão sendo **limitados** por produtos construídos para os modelos fracos de ontem, e a vantagem fica com quem põe esforço de engenharia em **verificação, e não em instrução**. É a pessoa que construiu a ferramenta dizendo isso — e o nome que eu dou a esse movimento, **agent-led verification**, é meu, não dele. Não estou citando isso de enfeite: é corroboração independente de uma escolha que eu já tinha feito, vinda de quem tem o dado que eu não tenho.

E é por isso que este loop é feito de hooks e de gates, e não de um prompt gigante explicando ao agente como se comportar. Instrução envelhece a cada modelo novo, e envelhece calada. Um gate, não: ele confere o resultado, e o resultado é a mesma coisa antes e depois do upgrade. Se o argumento acima estiver certo, a parte do meu harness que vai sobreviver é a que verifica — e a que manda é a que eu vou apagar.

Boris Cherny, que construiu o Claude Code, no canal do Y Combinator:

https://www.youtube.com/watch?v=qyPCVqFUyDo

## O registro de decisões É a documentação

O argumento clássico para ADRs é o humano do futuro: registre por que a decisão foi tomada, para que daqui a dois anos alguém não a desfaça sem saber o que estava em jogo. Aqui o argumento é outro, e é ele que decide o formato.

**Num repositório onde quem desenvolve são agentes, o registro é contexto de inferência.** O agente não tem memória do que foi discutido — ele tem o repositório, e é dali que infere o que fazer. Se a arquitetura que se formou ao longo do tempo não estiver ancorada em algum lugar do próprio código, cada mudança nova é decidida sem ela, e o resultado não é uma decisão errada isolada: é uma decisão nova que contradiz uma decisão que ninguém lembra de ter tomado. Por isso uma decisão revertida continua aqui e **diz** que foi revertida. Sem essa marca, o registro de uma arquitetura aposentada lê como instrução — que é a forma mais barata que existe de fazer um agente reconstruir aquilo que foi cortado de propósito. Com uma exceção, e é a única que existe: havia **duas** web ACLs de WAF e só a regional tem ADR — a da borda do CloudFront foi construída, foi cortada, e o registro dela é esta frase e não um arquivo.

É esse propósito que escolhe o formato, e não o contrário. **MADR**: contexto, as opções que estavam na mesa, a decidida, e a consequência. Um documento curto por decisão, um arquivo por decisão, tudo no mesmo repositório que o agente já lê — nada de wiki, nada de ferramenta à parte. O que um formato assim entrega para um leitor humano é rastreabilidade; o que ele entrega para um agente é o que ele precisa para não contradizer.

**São 48 decisões — e o que é mecânico aqui é o índice, não este número.** O índice é **gerado** a partir de `docs/adr/`, commitado como artefato e conferido no CI: acrescentar ou substituir uma decisão sem regenerar o índice deixa o pipeline vermelho, então o artefato e o diretório não têm como se separar. O `48` desta frase é digitado à mão: enquanto a tabela era renderizada aqui, ele vinha conferido de graça; cortá-la tirou essa amarração, e o que sustenta o número agora é o link abaixo, a um clique de você contar. As linhas não estão impressas aqui de propósito — esta página **aponta** o detalhe canônico em vez de repeti-lo, e uma cópia de 48 linhas seria a própria regra sendo quebrada na única seção que existe para defendê-la.

*(→ [a biblioteca de decisões](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/README.md) · [ADR-0001](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0001-lean-by-design-calibrated-to-strategy.md) enxuto por design)*

## Replique para o seu contexto

Está tudo público — dois repos, sem segredos.

[https://github.com/tedeuxx/tadeumendonca-io](https://github.com/tedeuxx/tadeumendonca-io)

[https://github.com/tedeuxx/tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills)

Os passos de "do fork até no ar" estão nos READMEs, não nesta página: [o deste repo](https://github.com/tedeuxx/tadeumendonca-io#fork-to-live) traz o caminho de nuvem inteiro, do domínio até o primeiro merge, e [o do plugin](https://github.com/tedeuxx/tadeumendonca-skills#run-it) traz a metade do loop, que se instala sem nenhuma conta em nuvem. E a régua que um projeto precisa passar pra entrar no portfólio daqui também é pública, em [docs/catalog-ready.md](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/catalog-ready.md) — o gate de prova de engenharia.

**Uma coisa eu recomendaria copiar sem pensar duas vezes.** O deploy entra na AWS por OIDC, então **não há segredo guardado**: uma chave vazada é acesso até alguém revogar, e um token vazado é acesso até expirar — e só se quem o pegou também satisfizer a condição do trust, que aqui é o subject *imutável* daquele repositório, por ID numérico e não por nome, porque nome pode ser transferido pra outra pessoa e os IDs não. A troca é que a raiz dessa confiança precisa nascer fora: **o Terraform daqui não cria o provedor OIDC, nem a role que roda o próprio Terraform.** É um buraco documentado num piso, e nenhum `plan` vai te avisar que ela saiu do lugar.

*(→ [ADR-0042](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0042-trust-root-bootstrapped-out-of-band.md) raiz de confiança fora do Terraform · [ADR-0015](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0015-oidc-immutable-subject-least-privilege.md) subject imutável)*

O que eu ficaria nervoso de ver alguém copiar sem o resto é **o merge direto pra produção**. Trunk-based com ambiente único é rápido e implacável na mesma medida; sem os gates na frente, sobra só a segunda metade.

Isto está em aberto porque há mais escolhas de configuração do que sessões que uma pessoa sozinha consegue rodar. Se você rodou alguma dessas escolhas de outro jeito, é você que tem a metade que falta nesta página: **me conte o contra-exemplo, ou compartilhe dizendo o que faria diferente.**
