---
title: "Por Que Eu Projeto o Loop, Não Só o Código"
slug: por-que-eu-projeto-o-loop
date: '2026-08-14T12:00:00.000Z'
tag: harness-engineering
track: engenharia
excerpt: "Antes de eu abrir qualquer ferramenta de IA para programar, eu já pensava em termos de pipeline, gate e revisão. Agent Harness Engineering não é uma ideia nova que eu peguei trabalhando com agentes — é uma ideia antiga, mirando num objeto novo."
takeaway: 'por que projetar o loop — não o código dentro dele — é o verdadeiro diferencial, e as três práticas tradicionais de onde ele vem.'
---
A maioria de quem aponta uma ferramenta de IA para o próprio trabalho acaba fazendo a mesma coisa mais rápido, dentro de um processo que nunca muda. Eu segui outro caminho: eu projeto o próprio loop — como uma mudança viaja de uma ideia até algo em produção, e por quais gates e guardas ela passa no caminho. O código que sai disso é o resultado do loop, não o ponto do exercício.

Quero ser preciso sobre de onde isso veio, porque é fácil supor o contrário. **Isso não veio de trabalhar primeiro com IA agêntica e depois generalizar a partir disso.** Veio da minha carreira, de muito antes de "agêntico" ser uma palavra que alguém usava no trabalho. Eu já pensava em termos de pipeline, gate e revisão — isso era raciocínio comum de arquitetura e DevOps, anos antes de um dev-loop com IA ser uma coisa a se construir. Apontar esse mesmo raciocínio para um loop guiado por IA não foi uma ideia nova pra mim. Foi uma ideia antiga, encontrando um objeto novo.

## Três coisas que eu já sabia, aplicadas a um objeto novo

Se você já trabalhou em entrega de software por algum tempo, você já conhece essas três práticas. O que muda aqui é que elas não estão escritas como política que alguém precisa lembrar de seguir — são mecanismos, conferíveis no próprio repositório que os executa.

**Gates obrigatórios de CI/CD antes de um deploy.** Um pipeline que não roda de verdade e barra em caso de falha não é um gate, é decoração. Neste loop, o "pronto" é definido por uma skill (`quality-gates`) e reforçado mecanicamente: um hook (`permission-guard.sh`) recusa o comando de merge vindo de qualquer papel de agente, exceto a única persona cujo trabalho é revisar — `quality-assurance`. Nada sobe pelo autorrelato de uma IA de que terminou. Um check obrigatório precisa realmente rodar e realmente barrar, do mesmo jeito que sempre deveria ter sido.

**Revisão de arquitetura por pares antes de começar a construir.** Muito antes de qualquer código ser escrito nos meus times, um design era olhado por alguém que não o escreveu — é pra isso que existem revisão de design e ADRs. Este loop faz a mesma coisa na entrada do trabalho: duas personas, `product-lead` e `tech-lead`, precisam fechar juntas a descrição de um item de trabalho — reconciliando o que ele precisa entregar e como deve ser construído — antes que uma terceira persona tenha permissão de começar a construir. A discordância acontece de propósito, antes de qualquer coisa ser construída, não depois.

**Acesso de menor privilégio, a mesma disciplina de segregação de funções.** Você não entrega as chaves de tudo pra todo mundo só porque é conveniente. Este loop reforça isso no nível da ferramenta: a persona que constrói não tem como mergear o próprio trabalho — o mesmo hook que recusa o comando de merge para todo mundo, exceto a revisora, recusa para a construtora por construção. A persona que revisa não tem a ferramenta `Edit` de jeito nenhum, então não consegue reescrever silenciosamente aquilo que deveria estar julgando. É a mesma segregação de acesso que qualquer ambiente regulado já exige; aqui ela é reforçada pelo que cada papel literalmente recebe nas mãos, não por uma regra que alguém precisa lembrar de seguir.

## Nenhum incidente pra contar — e essa é a versão honesta

Eu não tenho uma história pontual pra te contar aqui — um deploy ruim, uma revisão que teria pego algo a tempo. Procurei, honestamente, e não existe uma que valha a pena narrar. O que eu tenho, em vez disso, é um padrão que reconheço ao longo de uma carreira: a forma continua aparecendo, e eu continuo recorrendo ao mesmo remédio. Este é esse remédio, mirando num tipo novo de trabalho.

## Onde ver isso de verdade

Tudo acima é conferível, não só afirmado. A `/architecture` deste site é a própria máquina, em aberto — os gates, a pirâmide de revisão, quais partes do loop conseguem de fato te barrar e quais só aconselham. O loop vive num plugin separado e público — [tadeumendonca-skills](https://github.com/tedeuxx/tadeumendonca-skills) — com seis personas (dois leads que discordam por construção na entrada, uma construtora, uma segunda construtora para textos publicados, um gate, e a `agents-lead`, cuja contraparte sou eu, e não outra persona) e treze skills que o próprio modelo aciona sozinho. Nada disso é agente rodando sem supervisão em produção. É um loop de desenvolvimento, projetado do jeito que eu gostaria de ser contratado pra construir.
