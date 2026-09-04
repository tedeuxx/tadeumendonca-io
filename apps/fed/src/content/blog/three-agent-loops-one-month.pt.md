---
title: "Rodei três loops de agentes por um mês. O caro foi decidir."
slug: tres-loops-de-agentes-um-mes
date: '2026-09-02T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 577
excerpt: "Três projetos agênticos em paralelo, em cima de uma agenda de projeto cheia, e uma conta de USD 4.207 cobrindo dois deles. O dinheiro é o número menos interessante disso: o que agosto custou de verdade foi decidir a mesma coisa várias vezes sem perceber."
takeaway: 'como perceber que você está queimando horas e dinheiro na coisa errada — três sinais que não dependem de nenhuma ferramenta minha — e o que fazer no minuto em que você percebe.'
---

Três projetos agênticos, rodando ao mesmo tempo, agosto inteiro, em cima de uma agenda de projeto cheia que não ficou mais leve para abrir espaço.

Um deles é esta plataforma — você consegue ler cada linha dela: o repositório, o loop que a constrói, os registros de decisão onde eu mudei de ideia. Um deles é uma plataforma interna de conhecimento que eu estou construindo para a prática de modernização dentro da AWS Professional Services - LATAM, para acelerar a troca de conhecimento de IA entre os colegas — a minha tese, e construí-la também foi decisão minha. E um deles era um projeto de cliente, que chega aqui sem cliente, sem domínio e sem stack — um buraco deliberado, não um esquecimento.

Três loops, três quantidades diferentes de coisa que eu posso te contar.

Dentro da AWS era o **Agentic August** — um programa promovendo uso e experimentação de IA, com algumas metas de treinamento e um hackathon com as suas próprias regras.

Eu preferi fazer diferente, do meu jeito. É daí que vieram os três loops.

Na segunda semana eu já estava trabalhando bem além do horário. Na terceira eu estava deixando loop rodando de madrugada. No fim do mês eu estava dormindo com o laptop na cama e acompanhando os agentes pelo celular, às três da manhã, do jeito que a gente acompanha uma coisa no fogo.

A conta de agosto foi de **USD 4.207,13** — e ela cobre dois daqueles três loops. O desta plataforma roda na minha assinatura Claude Max 10x: dois loops medidos em créditos, um fixo.

Quero ser cuidadoso com esse número, porque é a única coisa aqui que alguém vai printar. São **créditos**, não tokens — a unidade em que o meu plano cobra. O plano cobre 10.000. Eu passei **105.178,21 créditos** disso, a quatro centavos o crédito, que é de onde saem os 4.207,13; a conta fecha no centavo. Total naquela conta no mês, plano incluído, uns **115.000 créditos**.

E aqui vem a parte que eu preferia não escrever. **Eu não consigo te dizer qual dos dois que estão nela gastou mais.** Uma conta, dois loops, nenhuma divisão.

Eu sei o que você vai perguntar, porque é a pergunta que eu faria, então deixa eu responder antes de qualquer outra coisa: **eu gastei. Foi decisão minha.** Cada um daqueles créditos foi consumido por uma escolha que eu fiz — qual loop começar, quando deixar rodar, quando aceitar uma resposta e quando devolver. De quem era o dinheiro não é a parte interessante dessa história. As escolhas são.

Porque este não é um texto sobre quanto custa um mês de desenvolvimento agêntico. É sobre uma coisa mais estreita e, eu acho, mais útil para você: **como você percebe que está queimando hora e dinheiro na coisa errada, e o que você faz no minuto em que percebe.**

## Eu abri agosto sem âncora

Comecei o mês ainda resolvendo os meus próprios sentimentos sobre o que é bom trabalho e o que é trabalho ruim quando são agentes que estão construindo.

Isso soa subjetivo. Não era. Era um problema completamente prático, e estava me travando: **eu não conseguia decidir qual âncora de expectativa usar.** Quanto tempo isso deveria ter levado? Uma rodada de revisão é bom ou é ruim? Três é? Aquilo foi rápido, ou eu só vi muito token passar e me senti ocupado?

Você toma essas decisões o tempo inteiro e normalmente toma contra uma base histórica racional — você já entregou coisa parecida, o seu time já, a sua indústria já. Aqui não tem nenhuma. Nenhuma base histórica minha, e nenhum benchmark claro na indústria também. Atividades individuais, observações individuais. **É como se fôssemos homens das cavernas descobrindo o mundo pela primeira vez**, cada um na sua caverna, nenhum conseguindo conferir com o outro.

E tem uma segunda coisa embaixo disso que eu levei quase o mês inteiro para enxergar. **O meu viés como humano estava me fazendo acreditar que a gente acertava de primeira muito mais do que realmente acertava.** Não de vez em quando. Sistematicamente. O loop produzia alguma coisa, parecia certo, eu aceitava, e o defeito aparecia dois slices depois.

## A premissa que eu peguei emprestada, e ela mudou o formato de tudo o que veio depois

O que reorganizou isso para mim não foi uma ferramenta. Foi o *Co-Intelligence*, do Ethan Mollick, e depois a palestra dele, que eu assisti depois de terminar o livro.

https://www.youtube.com/watch?v=9YMYVb1ASCg

A ideia que eu tirei dali cabe em uma frase: **trate como se fosse uma pessoa.** Uma máquina muito grande de imitar comportamento humano médio.

Eu vinha tratando a coisa como um compilador que de vez em quando alucinava. No momento em que você passa a tratar como um imitador de comportamento humano médio, algumas consequências de design bem concretas caem no colo — e elas são o motivo do resto deste texto ter o formato que tem:

- **Humanos médios concordam fácil demais.** Então dois agentes lendo o mesmo pedido vão te entregar uma resposta duas vezes, e você vai confundir aquilo com corroboração. Se você quer discordância, tem que **projetar** a discordância. Ela não acontece sozinha.
- **Humanos numa sala não conseguem desouvir um número.** Então se uma estimativa é dita antes das outras, as outras ficam ancoradas nela. Mesma máquina, mesmo problema.
- **Humanos superestimam com que frequência acertaram de primeira.** Que é *exatamente o viés que eu tinha acabado de pegar em mim* — e é uma propriedade da ferramenta também, porque imitar a gente é o que a ferramenta faz.

Esse último é o afiado, e eu demorei para sentar com ele. **Eu não era um humano falível trabalhando com uma máquina confiável. Eu era o mesmo viés, aparecendo dos dois lados da mesa, concordando consigo mesmo.** Isso é um problema materialmente diferente de resolver, e quase tudo o que eu construí em agosto foi construído para ele.

## O mês de outra pessoa parecia com o meu

Em algum ponto no meio disso tudo eu assisti ao vídeo do Matt Pocock sobre o workflow dele.

https://www.youtube.com/watch?v=-QFHIoCo-Ko

Estou colocando ele aqui, antes do custo, de propósito — por causa do que ele fez por mim naquele momento. **Ele me fez ver que eu estava no caminho certo.** Muitas das conclusões a que ele tinha chegado eu já tinha experimentado de alguma forma, na minha própria caverna, sem as palavras para elas.

Se você nunca teve essa experiência aprendendo alguma coisa sem mapa, não sei se consigo transmitir o quanto ela vale. Não é "alguém concorda comigo". É a primeira evidência de que o chão embaixo de você é real.

E não foi só reconhecimento. Eu peguei quatro coisas com ele e as quatro estão nos repositórios hoje. **A UX de invocar um comando** — o que a pessoa digita, o que a dica diz enquanto ela digita, o que uma invocação vazia faz quando ela erra. **O fluxo de um documento de intenção para itens rastreados** antes de qualquer coisa ser construída; o meu cai numa issue com a descrição fechada em vez de num PRD, mas o movimento é dele. **A prática de escrever registros de decisão** como MADRs, com a opção rejeitada e o trade-off dela na página, e não só a escolha. E **como gerenciar contextos**, que é a segunda das quatro decisões de design mais para baixo.

## O que tornou decidir tão caro

Então: para onde foi?

**Eu não consigo te mostrar a divisão**, e uma fatura não teria me contado de qualquer jeito — ela não sabe quais decisões dentro de um mês foram as desperdiçadas.

O que eu consigo te contar é o desenho que fez decidir custar tanto, porque esse eu aprendi a duras penas. **Eu coloquei atores demais no mesmo nível, todos tendo que concordar.** Parecia rigor. O que aquilo produziu foi nada sendo entregue — o loop ágil que eu estava tentando implementar parou de entregar, e não porque alguém ali estivesse errado. É que todo mundo tinha que convergir antes de qualquer coisa andar.

Conflito não é bom de forma uniforme, e essa é a parte que eu tinha invertido. **Algumas camadas querem conflito. Algumas camadas não podem ter.** Pares no mesmo nível que precisam todos concordar não é mais escrutínio; é um loop que não consegue fechar.

Essa é a causa. O que vem abaixo é como aquilo parecia por dentro, no único loop cujas rodadas são todas públicas — este, que nem sequer está naquela fatura. Mesmo mês, mesma pessoa, mesmo hábito. O que muda é que este aqui você consegue abrir.

O exemplo mais claro que eu tenho é público, datado, e aconteceu no último dia do mês — que é como eu sei que não estou reconstruindo isso com carinho. Um pull request no repositório do meu loop passou por **oito rodadas de revisão e nove commits de correção**, e cada uma das rodadas encontrou *mais uma instância da mesma classe de defeito*.

A classe nunca esteve errada. O diagnóstico estava certo na rodada um. O que estava errado é que eu ficava corrigindo instâncias em vez de varrer o conjunto.

Repara no formato disso, porque o formato é a lição:

- **Rodada 1** — dois arquivos, um identificador. Corrigido.
- **Rodada 2** — um padrão mais largo. 42 ocorrências. Corrigido.
- **Rodada 3** — um padrão tolerante a lacunas, seis identificadores, 49 arquivos, 369 ocorrências. Corrigido.
- Alargar mais uma vez levou o mesmo escopo a **1.055 ocorrências**.

E a instância que importava de verdade **não foi encontrada por nenhuma dessas varreduras.** Foi encontrada por uma pessoa lendo a seção, porque a palavra atrás da qual ela estava escondida não estava no vocabulário do meu padrão.

Tem uma correção no meio dessa sequência em que eu penso bastante. Ela publicou um comando que devolvia o conjunto inteiro — e depois conferiu três membros dele na mão. **Eu verifiquei os membros em vez de verificar o conjunto**, que é precisamente por que a instância seguinte sobreviveu e custou mais uma rodada.

Mais duas coisas do mesmo mês, as duas baratas de descrever e as duas caras de ter vivido:

**Uma verificação que falhava aberta.** Eu publiquei um comando de verificação com um erro de escape dentro. Ele devolvia zero linhas. Zero linhas *se lê como limpo*. Sobreviveu quatro rodadas parecendo prova.

**Um instrumento que mentia.** O loop mantém o próprio registro do que cada agente custa para ser despachado. Quando eu finalmente auditei, ele estava **errado sobre cinco dos sete perfis** — inflado para uns, deflacionado para outros. A coisa que deveria me dizer quanto o meu próprio loop estava me custando não conseguia me dizer.

## Então — como você percebe?

Essa é a parte que eu ia querer se eu fosse você, então aqui está do jeito mais direto que eu consigo colocar. **Três sinais — e você lê eles do mesmo jeito que leria um time humano.** Nenhum deles exige a minha configuração, as minhas ferramentas ou um repositório:

**1. A mesma classe de achado continua voltando depois que você já alargou a busca.** Isso não é minúcia. É você verificando membros em vez de verificar o conjunto. Alargar o mesmo método pela quarta vez não vai achar — o método é o que está errado.

**2. A sua verificação voltou vazia e você sentiu alívio.** Vazio e limpo são idênticos de olhar e não são a mesma coisa. Antes de confiar num verde, quebre ele de propósito e confirme que ele consegue ficar vermelho. Se não consegue falhar, não é uma verificação.

**3. O seu instrumento discorda da sua memória e você acredita na sua memória.** Esse é o momento. Sempre.

E o que você faz nesse minuto é o mesmo nos três casos, e não é "se esforçar mais": **pare a rodada e troque a régua.** Não mais esforço contra o mesmo método — um método diferente, ou um leitor diferente. No meu caso o leitor diferente era literal, e eu volto nisso.

## Não é só comigo, e isso tem nome

O mês acabou e eu descobri que a condição que eu vinha descrevendo como caverna já tem um termo. A Clare, na AWS, chama de **frontier development** (desenvolvimento de fronteira).

https://www.youtube.com/watch?v=pqlWNihgdjI

Uma fronteira é exatamente isso: território sem mapa, onde a única evidência é o que você mesmo andou. É uma palavra só para quatro coisas que eu vinha tratando como quatro problemas separados — sem âncora de expectativa, sem benchmark da indústria, sem arte prévia, só observações individuais. Não são quatro problemas. **É uma condição só, e ela tem nome.**

Eu chamei de caverna. Ela chama de fronteira. Os dois estamos descrevendo a ausência de mapa, e eu acho genuinamente reconfortante que a gente tenha chegado lá separado.

## As quatro coisas que eu mudei

Tudo acima é o que agosto me custou. Isso aqui é o que eu comprei com aquilo. Quatro decisões de design, na ordem em que eu cheguei nelas.

**1 · Força bruta, mais loops de feedback que realmente devolvem feedback.**

Eu não conseguia achar a âncora de expectativa, então parei de procurar por uma e troquei por um processo: definir um objetivo, desenhar como o trabalho acontece, melhorar, continuamente, e deixar o volume fazer o que a certeza não fazia. É menos elegante do que saber. Funciona, e saber não estava na mesa.

**2 · Modelar as janelas de contexto, deliberadamente frescas.**

Subagentes, e uma biblioteca de skills especializada por perfil. O motivo é a premissa do Mollick aplicada direto: **um revisor que já carrega o raciocínio do autor não está te dando feedback. Está concordando com você, com passos a mais.**

Desse eu tenho recibo. A minha última iteração fechou consultando sete perfis isolados, cada um alimentado só com os próprios artefatos. **O sétimo demoliu, com evidência, uma decisão que o processo já tinha tomado** — um perfil tinha sido tirado daquele conjunto de consulta porque uma métrica marcava zero para ele, e ele tinha lido seis textos ao longo de doze rodadas. Nenhum dos seis anteriores pegou isso, porque nenhum deles conseguia ver nada além do próprio registro.

E o contraexemplo, da mesma semana, dito por um contexto fresco sobre ele mesmo. Chegando depois de oito rodadas de revisão, ele abriu o parecer com: *"a convergência independente acabou — nada abaixo está corroborado por ela, inclusive onde concordamos."* Um leitor contando nove revisões teria contado nove confirmações. E aí ele achou um bloqueador que os oito tinham passado por cima.

**Aqui vem a metade honesta, porque isolamento não é de graça.** Um contexto fresco não herda nada, então ele precisa ser briefado, e **um briefing errado se propaga mais rápido que uma resposta errada.** Três vezes em um único dia um agente teve que corrigir o que eu tinha entregado a ele — uma referência de commit que não resolvia, um "denominador" numa frase que não declarava nenhum, um "o marcador anterior enumerava dois" que eram três. Contextos frescos pegam o que a continuidade não pega. E acreditam em tudo o que você diz, na hora.

**3 · Modelar as camadas — e decidir quais delas devem discutir.**

Quais camadas existem; em quais eu *quero* conflito; quais precisam ser objetivas.

Lá em cima, na ideação, eu quero conflito. Dois especialistas lendo um pedido a partir de dois mandatos diferentes devolvem duas respostas diferentes, e **a discordância é o produto.** Eles definem e refinam o backlog, que é o artefato que todo o resto lê depois — erre ali e está errado em tudo o que vem depois, em silêncio.

Lá embaixo — revisão, QA, o merge — eu quero o oposto. Objetivo, contra uma Definition of Done escrita.

A assimetria é o design inteiro, e ela se resume a quanto custa estar errado em cada ponta. **Errar na ideação custa um item descrito que ninguém constrói. Errar no merge custa um deploy** — nesta plataforma, mergear *é* deployar. Então: discuta onde a correção é barata, seja chato onde ela não é.

Eu aprendi isso errando primeiro. Montei um roster como organograma — dezenove perfis, um por preocupação — e ele desabou para seis. **Tudo o que não gerava discordância era um handoff, e o handoff era o motivo de nunca rodar.** Três especialistas existiam e nenhum deles foi despachado uma vez sequer.

Se você levar uma coisa testável deste texto inteiro, leve essa: **um perfil sem contraparte é um handoff. Um mandato sem gatilho é um documento.**

**4 · A sessão principal é a interface com o humano. Ela não é a gerente.**

Esse é o erro que mais me interessa, porque não foi preguiça — foi o design *óbvio*, e ele estava errado.

Eu dei o trabalho de gestão para a sessão orquestradora justamente porque parecia o lugar mais seguro para ele. Ela vê tudo, então deixa ela garantir tudo. Aí eu contei: em uma sessão, aquela sessão executou **120 ações de escrita** — abrindo itens, comentando, editando labels, arquivando. **Nenhuma delas era interface comigo.** O único contexto cujo trabalho inteiro é falar com o humano tinha se gastado em burocracia, e as minhas perguntas estavam na fila atrás de trabalho de cartório.

O equilíbrio veio com um perfil novo que faz a decisão — e o formato que ele tomou é o ponto. **Ele não carrega ferramenta nenhuma.** Não despacha, não edita, não roda comando. Ele decide quem age em seguida e escreve isso; a sessão principal executa e recupera o propósito dela.

E esse perfil quase subiu como o oposto exato dele mesmo. Eu construí ele primeiro simplesmente *omitindo* a declaração de ferramentas, na suposição razoável de que omitir uma concessão não concede nada. **Medido através do loader, com um efeito colateral em disco em vez de perguntando a ele — porque um agente sem ferramenta vai te dizer alegremente que rodou o comando —, a omissão herda todas as ferramentas do pai.** O perfil cuja justificativa inteira era não carregar nada estava carregando tudo.

Essa eu guardo perto. **A ausência era a maior concessão do sistema, não a menor**, e nada do que eu tinha escrito teria me contado isso.

## Onde tudo foi parar, e eu não planejei essa parte

Relendo o mês, cada uma daquelas correções estava empurrando na mesma direção, e eu só vi no fim.

**O loop tinha ido virando o Scrum que eu sempre quis ver implementado numa empresa de verdade e nunca vi funcionar tão bem.** Iterações com começo real e condição de esgotamento real. Ritos que acontecem de fato — a retrospectiva aconteceu, inteira, e ninguém pulou por estar ocupado. Estimativa sem ancoragem, porque os estimadores nunca se ouvem. Retrospectiva sem política, porque não tem ninguém na sala protegendo uma relação. E uma Definition of Done que realmente barra, porque quem recusa o merge é uma máquina.

**O que os agentes tiraram é exatamente o que eu nunca tinha conseguido segurar de pé com gente** — o rito que é pulado porque todo mundo está ocupado, a estimativa que ancora porque alguém falou um número primeiro, a retrospectiva que emudece porque tem uma relação na sala.

Tem uma segunda convergência aqui que eu acho mais difícil de descartar que a primeira. Eu rodo um outro harness, em outro runtime, para outro tipo de trabalho. Quando finalmente exportei um e comparei com o outro, **24 de uns 36 mecanismos já estavam presentes nos dois, e cinco dos perfis de agente batiam quase exatamente** — construídos separado, com meses de diferença, por mim, sem nenhum dos dois olhar para o outro.

Eu disse lá atrás que a resposta para *"como você decide sem benchmark"* não é "você chuta". Aqui vai direito: **você mantém um registro bom o suficiente para que a convergência fique visível quando ela aparecer.** Um campo ganha a sua linha de base quando gente suficiente descreve a mesma coisa separadamente e alguém escreve aquilo. É para isso que serve escrever.

E mais um pedaço, que é a resolução de verdade do problema com que eu abri agosto. Os agentes estimam o trabalho — eu não, o que remove o meu viés removendo a mim. O que eles produzem sai em **story points**, e story point não é unidade de agente. É a unidade que o ágil corporativo vem registrando no Jira há quinze anos, em milhares de projetos. **A âncora que eu não achava no futuro estava sentada na linha de base que já existe.**

**Agora os limites, porque um texto que para na parte boa te vendeu a versão fácil:**

- **Isso é uma pessoa, não um time.** Parte disso funciona *porque* não tem ninguém com quem negociar, e essa é precisamente a restrição que o Scrum de verdade tem e eu não tenho. Se você ler isso como "o Scrum finalmente funciona", você levou a coisa errada. O que funciona é o formato: cadência fixa, entradas isoladas, uma régua explícita na saída, e um humano na fronteira.
- **Dois dos ritos ainda não existem.** Foram desenhados no fim do mês e não estão construídos.
- **O perfil que eu acabei de chamar de equilíbrio final nunca rodou.** Foi desenhado dois dias atrás.
- **A comparação de story points não foi feita.** Comparável em princípio não é comparado. Ninguém colocou um registro de velocidade corporativo ao lado do meu, e até alguém colocar, aquele parágrafo é uma hipótese com bons motivos.

Então a frase honesta é: **o loop hoje espelha o modelo. Ele ainda não rodou uma iteração inteira nesse formato.** Isso não custa nada ao final, e é a única versão que eu ia querer ler.

## Para onde isso vai, e eu já bati na parede

Vou terminar onde o mês terminou, que é num limite e não numa conclusão.

https://www.youtube.com/watch?v=vJEy3nP2_C8

O Ryan Carson, no canal do Greg, fala sobre escalar trabalho de agentes para máquinas na nuvem — sair dos limites do seu ambiente local. Eu não fui atrás daquele vídeo. **Eu bati no teto que ele descreve fazendo trabalho comum, e aí assisti.**

O teto, concretamente. A minha última retrospectiva consultou sete perfis **um depois do outro**, e o único motivo é que existe uma árvore de trabalho e um índice do git, e dois agentes commitando na mesma árvore corrompem o estado um do outro. Eu dividi um pedaço de trabalho num segundo checkout para rodar duas coisas de uma vez, e um dos checkouts que o próprio harness criou para mim **não era gravável por nenhum perfil do harness**, por causa de onde ele coloca esses checkouts.

E a parte incômoda: **um segundo checkout não resolve o que realmente bloqueia o paralelismo.** Quatro slices editando o mesmo arquivo conflitam em qualquer topologia. O meu portão de revisão é um perfil só e revisa em fila. E mergear é deployar, então dois merges em paralelo são dois deploys em paralelo sem nenhum lugar para olhar antes.

**Que é o motivo real de o texto parar aqui.** A restrição deixou de ser o modelo, e deixou de ser o dinheiro também. É uma máquina e um de mim, e um celular no escuro às três da manhã não é uma estação de trabalho — é o sintoma.

---

Se você está mais ou menos no mesmo ponto — experiência suficiente para saber como é o bom no formato antigo, e nenhuma ideia de como ele é neste — eu queria que você levasse três coisas, e nenhuma delas precisa da minha configuração.

**Projete a discordância.** Ela não vai acontecer sozinha, de nenhum dos dois lados da mesa.

**Discuta onde errar é barato, e seja chato onde não é.** Lá em cima é onde as opiniões cabem. O portão não é.

**Escreva o que você fez e por quê, mesmo que ninguém esteja pedindo.** Não pelo registro. Para que, no dia em que alguém do outro lado do mundo descrever a sua caverna e chamar aquilo de fronteira, você consiga conferir se essa pessoa está falando da mesma coisa que você.

Tem uma coisa que eu já sei sobre setembro: **não fazer mudança estrutural de loop ao mesmo tempo em mais de um projeto.** É isso que mais causa a sensação de desânimo, quando as coisas começam a dar errado ao mesmo tempo.

E ao fazer uma mudança de loop, seja muito pontual, e observe com toda a atenção e foco a mudança de comportamento do loop.

https://www.youtube.com/watch?v=S-sYlFiGFv8

Um dos engenheiros ali fala que queria saber programar para fazer um videogame, e que hoje cada ideia que ele tem, ele consegue colocar em prática.

É assim que eu me sinto fazendo este site.

Vá olhar o que os seus loops fizeram no mês passado — não a saída, as *rodadas*. Conte quantas delas acharam a mesma coisa duas vezes.

Grande abraço, e até a próxima.

Isso é o que eu penso.
