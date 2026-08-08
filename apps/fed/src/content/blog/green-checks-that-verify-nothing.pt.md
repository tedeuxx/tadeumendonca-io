---
title: "Os Checks Verdes Que Não Verificaram Nada"
slug: checks-verdes-que-nao-verificam-nada
date: '2026-08-08T21:00:00.000Z'
tag: agentic
track: engenharia
hasVideo: true
excerpt: "Uma sessão de desenvolvimento agentic me deixou sete checks passando que não provavam nada. Cinco estão aqui, cada um com o arquivo que você pode abrir — e o motivo de o loop acumular esse tipo de coisa mais rápido do que remove."
takeaway: 'por que um check que passa pode não valer nada, e o único hábito que encontra isso.'
---
https://www.youtube.com/watch?v=qyPCVqFUyDo

A tese do Boris Cherny nessa conversa, parafraseando em vez de citar: o modelo é o produto, e a camada em volta tem que ser fina o bastante pra sair da frente dele. Está certo, e é por isso que funciona.

A parte que ninguém conta é o que sobra quando ela sai da frente. **Sobram os seus gates — e um loop agentic é excelente em produzir algo que passa.** Um check que não verifica nada é visualmente idêntico a um que verifica tudo. Os dois estão verdes. Numa sessão eu achei sete aqui; cinco estão abaixo, e o primeiro é o pior.

## Quatro, de uma sessão só

**A fila que crescia enquanto o Google não recebia nada.** O analytics aqui só carrega depois que o leitor aceita, e o shim que enfileira comandos pro GA4 foi escrito do jeito que o TypeScript pede — um rest parameter empurrado pro `dataLayer`. Tipagem correta, chamável, e crescia a fila a cada chamada. Só que o `gtag.js` só trata uma entrada da fila como *comando* quando ela é um objeto `arguments`; um Array de verdade é ignorado em silêncio. O teste afirmava que a fila tinha crescido. Tinha. E o GA4 não recebeu absolutamente nada. [O shim](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.ts) carrega o motivo de estar escrito daquele jeito esquisito, e [a proteção](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.test.ts) hoje afirma o *formato* de cada entrada, porque o tamanho da fila era igualmente verdadeiro na versão que funcionava e na que estava quebrada.

**O scanner que não leu nada do tooling de build.** O [`sonar-project.properties`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/sonar-project.properties) dizia `sonar.sources=src`. Ou seja: o quality gate bloqueante analisava zero linha de `scripts/` — o que num site sem backend não é detalhe. É naquele diretório que mora a fonte única de verdade de toda URL pública, o prerender que produz o HTML servido e suas tags sociais, e o gerador de sitemap que o Google lê. O código mais consequente do repositório era o código que análise estática nenhuma tinha olhado, e o gate reportava limpo esse tempo todo.

**O job que passou por não ter rodado.** Todo job de CI aqui filtra por quais arquivos mudaram, o que é correto e é exatamente onde isso se escondeu. Os registros de decisão são compilados num artefato versionado que o site renderiza, e um teste falha quando os dois se separam — uma boa proteção. Só que o filtro não listava `docs/adr/**`. Então um pull request que mexia só em registro de decisão pulava o job de teste inteiro e o check agregado reportava sucesso, tendo verificado nada. A proteção nunca esteve errada; ela só nunca rodava no próprio gatilho dela. O [`app.yml`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/.github/workflows/app.yml) hoje separa os três casos, então um "passou" que pulou tudo diz isso com todas as letras.

**O teste cujo nome dizia todas as URLs e checava uma.** Um teste chamado *toda URL anunciada resolve pra própria página prerenderizada* buscava o sitemap e checava exatamente um endereço. O nome era a especificação; o corpo era um teste de fumaça. A propriedade real — que nenhuma URL anunciada entrega os metadados da home debaixo do endereço de outra página — é outra afirmação, e era essa que precisava ser escrita. O [`seo.spec.ts`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/e2e/seo.spec.ts) carrega as duas hoje: a estreita, renomeada pro que ela de fato faz, e a de todas ao lado.

## O quinto, que leitura nenhuma ia encontrar

Os artigos carregam uma `track`, e o parser mantém um valor conhecido e cai pra `engenharia` em qualquer outro caso. Acontece que toda fixture e todo artigo publicado carregava `track: engenharia` — que é *também* o fallback. Os dois braços daquele ternário devolviam o mesmo valor. Um teste de pertinência que respondesse *false* sempre teria passado na suíte inteira.

Não há o que notar. [O parser](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/content.ts) parece certo, os testes parecem completos, e a cobertura conta o branch como exercitado. E ninguém achou aquilo de propósito: apareceu como efeito colateral de uma arrumação sem relação nenhuma, trocar um array de dois elementos por um Set porque o Set diz na declaração o que o array só insinuava na chamada. O defeito foi o que a mudança expôs, não o que alguém foi procurar. [O teste](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/content.test.ts) hoje fixa o outro valor explicitamente — e foi a mutação que provou que a substituição consegue falhar, nas duas direções, que é o serviço que ela de fato presta aqui.

## Por que o loop facilita acumular isso, e não o contrário

Nenhum dos cinco é erro no sentido comum. Cada um é um artefato competente que satisfaz o objetivo que recebeu, e o objetivo que recebeu era *faça o check passar*. Um agente é ótimo nisso, que é justamente por que a gente usa um — e isso significa que o caminho mais barato até o verde está sempre disponível, inclusive os caminhos em que verde não quer dizer nada.

Eu aprovei os cinco. Nenhum pareceu errado na revisão, e quero ser exato sobre o porquê: revisar um check te diz se ele está bem escrito, não se ele consegue falhar. São perguntas diferentes, e só uma delas é respondível lendo.

Então o formato honesto disso não é "o agente cometeu erros que eu não cometeria". É que o loop mudou meu gargalo de lugar. Produzir verificação ficou quase de graça; decidir se a verificação é real, não — e agora chega muito mais dela por hora do que chegava antes.

## O que eu faço hoje, e o que isso continua não resolvendo

Um hábito, e ele é mecânico em vez de esperto: **quebre o código, não o teste.** Altere a linha que a asserção existe pra proteger, rode, e confirme que fica vermelho. Se continuar verde, a asserção é enfeite. Custa um minuto, e vale ser exato sobre o que ele compra. Descoberta, não — não foi assim que nenhum destes veio à tona. Ele responde a única pergunta que revisão não responde: se a asserção consegue falhar.

Não resolve tudo, e dois dos buracos são estruturais. Só alcança asserção que me ocorre mutar — o quinto ali em cima estava debaixo de uma suíte que ninguém suspeitava. E não encosta num filtro que pula um job, porque não há código pra quebrar: o job não rodou, então não existe nada pra ficar vermelho. Essa classe pede outra resposta, que é o check agregado ter que reportar *o que* ele verificou, e não só que passou. O meu faz isso hoje. Não fazia antes, e eu não sei há quanto tempo estava assim.

Nada disso é argumento contra as ferramentas. Eu não teria construído isto no tempo que tinha sem elas, e já disse isso em outro lugar deste site. A afirmação que eu defendo é mais estreita: quanto mais rápido você consegue produzir algo que passa, menos um "passou" vale sozinho — e mais da sua atenção precisa migrar de escrever o check pra provar que ele consegue falhar.
