---
title: "Como rodar o seu Claude Code como uma empresa AI-native"
slug: o-que-os-meus-agentes-fazem
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "Garry Tan decompõe uma empresa AI-native em quatro peças que são todas markdown, e uma quinta embaixo: o cérebro. Eu peguei essa decomposição e rodei contra um loop que eu já tinha construído sem ter visto a palestra. Quatro bateram. A que não bateu é a que interessa."
takeaway: 'as quatro peças da empresa dele são arquivos, e é por isso que dá para rearranjar; o cérebro é o que faz o rearranjo te ensinar alguma coisa — e a disciplina que sustenta os dois é nunca fazer trabalho de uma vez só.'
---

https://www.youtube.com/watch?v=eBUyTS7SzV4

Garry Tan, que toca a Y Combinator, deu uma palestra curta chamada *Every company should have a Brain* ("toda empresa deveria ter um cérebro"). Sem slide nenhum, só ele falando. É sobre empresas AI-native — as que já rodam em cima de Claude, de Codex, de harnesses construídos em volta deles.

A conferência publicou a transcrição corrigida, com minutagem. Então o que é dele daqui pra frente vai entre aspas e com o minuto, e você confere. O que é meu também vai entre aspas, e desses eu aponto o arquivo. Um recibo e uma lembrança não são a mesma coisa — e até semana passada eu só tinha a lembrança dessa palestra, o que é uma coisa meio constrangedora de admitir num texto que fala de memória.

O argumento inteiro cabe numa frase, aos 3:17: *"the leverage is not in the weights. It's in how you wire the work."* A alavanca não está nos pesos do modelo. Está em como você liga o trabalho. As pessoas que tiram 2x e as que tiram 100x estão usando o mesmo Claude.

É um pitch, e ele trata como pitch — sobe no palco dizendo que aquela é a sala que vai testar o número dele. Não é acusação: descreve uma abordagem, e não existe somente uma. Os números que ele cita eu não vou repetir aqui, porque só encontrei na própria palestra, e uma fonte só não é fonte.

Ele está falando de empresas com gente dentro. Eu sou uma pessoa com dois repositórios e fins de semana. O que eu fiz foi pegar a decomposição dele e rodar contra uma coisa que eu já tinha construído sem ter visto a palestra — peça por peça, para ver o que batia e o que não batia.

## Uma empresa escrita em arquivos

A parte que me pegou é que ele não fala em "usar IA". Ele descreve funções de uma empresa, e cada função é um arquivo.

Aos 4:31: *"A skill file is an employee. It has one capability, one job, written down clearly enough that someone can execute it."* Um arquivo de skill é um funcionário — uma capacidade, um trabalho, escrito claro o bastante para alguém executar.

Aos 5:02, sobre aquela tabela que você acaba criando quando o `CLAUDE.md` fica grande demais: *"That's an org chart. A task comes in, and the resolver decides who handles it and where it goes."* Aquilo é um organograma. Chega uma tarefa, e a tabela decide quem pega e para onde vai.

Depois vêm as regras de arquivamento, que são o processo interno. E aos 5:23, os testes que verificam se o roteamento realmente funciona — *"When I need to alter a test file, does test.md actually get loaded?"* Quando eu preciso alterar um arquivo de teste, o `test.md` é mesmo carregado? — *"Those are performance reviews."* Isso são avaliações de desempenho.

E aos 5:52 a frase que junta as quatro: *"you're not writing software, you're hiring, training, and managing a workforce made of markdown."* Você não está escrevendo software. Está contratando, treinando e gerindo uma equipe feita de markdown.

Eu fui conferir as quatro contra o meu loop. O interessante não é ter batido — é que eu não tinha escolhido nenhum desses nomes:

- **Arquivo de skill = funcionário.** Quinze skills declaradas, uma por assunto.
- **Tabela de resolução = organograma.** Aqui é uma tabela que decide, por tipo de trabalho, quais revisores entram: `loop`, `product`, `content`.
- **Regras de arquivamento = processo interno.** A regra em que a minha biblioteca de decisões funciona, que eu cito daqui a pouco.
- **Avaliação de gatilho = avaliação de desempenho.** Uma suíte que lê a lista de skills nos dois sentidos: uma skill declarada que não existe deixa vermelho, e uma que existe e não foi declarada também.

Quatro de quatro, e nenhuma delas eu construí por teoria. Essas quatro são a tabela dele. Tem uma quinta coisa embaixo, que não está na tabela — e é a que não bateu.

## Onde fica o julgamento, e onde fica o estado

Antes da quinta, a linha que eu mais queria ter tido por escrito três anos atrás.

Aos 9:02 ele separa dois lugares onde a computação pode morar. *Latent space* (espaço latente) é o modelo: gosto, julgamento, entender o que a pessoa quis dizer quando falou uma coisa vaga — as chamadas não determinísticas, que você guia com markdown. *Deterministic space* (espaço determinístico) é código normal, que executa e guarda estado.

A fonte de bug que ele aponta é botar o trabalho do lado errado dessa linha.

O exemplo é sentar oitocentas pessoas num evento de forma que o vizinho de cada uma seja alguém que vale a pena conhecer. O modelo julga quem combina com quem. Mas onde cada um está sentado, aos 9:56, *"must not live in the context window"* — não pode morar na janela de contexto.

Isso é a arquitetura do meu loop descrita por outra pessoa, e eu nunca tinha tido as palavras. As personas discordam, pesam, opinam: julgamento. Quem pode mergear, o que é irreversível, qual verdict autoriza o quê: isso são hooks, e hook não tem opinião. Eu não cheguei aí por teoria. Cheguei porque botei coisa do lado errado da linha e doeu.

## O cérebro, e o preço dele

Aos 12:55, o cérebro de uma empresa é *"the library plus the librarian"* — a biblioteca mais o bibliotecário. E aos 13:21: *"Retrieval is easy. Being worth retrieving from is the product."* Buscar é fácil. Ser digno de ser buscado é o produto.

Ele é direto sobre o que mata isso, aos 14:27: *"a brain nobody curates becomes a garbage dump with great search."* Um cérebro que ninguém cuida vira um lixão com busca excelente. E a correção que ele dá, aos 14:46, é um papel e não uma funcionalidade — proveniência em cada fato, checagem de contradição, e *"a librarian, human plus agent, whose actual job is pruning"*: um bibliotecário, humano mais agente, cujo trabalho de verdade é podar.

É dessa afirmação que eu tenho recibo.

As decisões aqui são MADRs, e a regra em que essa biblioteca funciona é o título de um dos registros dela — como o repositório é em inglês, vem o original e a tradução: *"An ADR earns its place by explaining the **current** codebase."* Um ADR ganha o lugar dele explicando o código **atual**. Um registro que parou de explicar o código atual não ganha uma tarja em cima dizendo que está velho. O arquivo dele sai do repositório, e o rastro fica numa linha em outro arquivo, debaixo de uma cláusula que eu aponto: *"A record leaves this library only as a disposition, never as an absence."* Um registro só sai desta biblioteca como disposição, nunca como ausência.

Vinte e um números já foram emitidos. Sete estão vivos. Os quatorze que sumiram têm, cada um, uma linha dizendo o que decidiram e onde aquela decisão mora agora. E um teste lê isso nos dois sentidos: um número sem arquivo e sem linha deixa a suíte vermelha, e uma linha para um número que ainda está vivo também.

Podar não é a parte que dá sensação de progresso. É a parte que deixou o resto utilizável.

E aos 16:22 vem a frase que eu não consigo tirar da cabeça: *"The organization that captures what it learns like this gets smarter every single day. The one that doesn't wakes up every morning with amnesia, no matter how good the model is."* A empresa que captura o que aprende fica mais inteligente todo dia. A que não captura acorda todo dia com amnésia, não importa quão bom seja o modelo. E aos 16:35: *"Model quality is rented."* Qualidade de modelo é alugada. O cérebro é seu.

Aqui eu preciso ser honesto sobre escala, porque é onde a analogia dele encosta na minha vida e não cabe. Conhecimento que não vai embora quando as pessoas saem é uma afirmação sobre organizações, e eu não sou uma. O que eu tenho é a versão de uma pessoa só, e ela é menos bonita e igualmente real: o que eu escrevi continua funcionando depois que eu esqueço. Eu já testei isso sem querer, várias vezes, voltando num arquivo meu seis meses depois sem lembrar de nada.

## Nunca faça trabalho de uma vez só

Se você for levar uma coisa só daqui, é esta, e dá para fazer nesta semana.

Aos 15:46 ele descreve o ciclo inteiro: dá a tarefa pro agente, olha o resultado, corrige o que não ficou bom — e aí, quando ficou bom, *"skillify it"*: transforma o fluxo que funcionou numa skill que dá para reusar. A ordem importa. Você captura **depois** de corrigir, para a skill já nascer com a correção dentro.

O padrão que ele usa é ríspido, aos 16:05: *"if you have to ask for something twice, you failed."* Se você teve que pedir duas vezes, você falhou.

Eu li isso e fui olhar o que eu fazia. Sessenta e nove skills viraram quatorze, e hoje são quinze. Dezenove personas viraram seis, e hoje são oito. Uma contagem que só cai conta uma história sozinha; uma que cai e depois volta a subir não conta nenhuma — e é exatamente esse o formato que deixa de ser legível no instante em que ninguém escreveu o porquê. Por isso cada entrada é obrigada a dizer para que aquele comportamento serve, e o que ele **não** faz.

## O que uma coisa tem a ver com a outra

Demorei para ver que as duas ideias são a mesma peça vista de dois lados.

Você só consegue rearranjar os perfis porque o que cada um faz não está dentro de uma pessoa. Organograma de gente não dá para rodar de novo com outro formato; organograma de arquivo dá. E você só aprende alguma coisa com o rearranjo se o registro disser para que cada peça estava ali — senão você mudou o formato, o resultado mudou junto, e você não faz ideia do porquê.

Então escrever para que serve cada peça não é organização. É a única coisa que deixa você mudar o formato e aprender com a mudança.

E aqui vai o limite, antes que você chegue nele sozinho: eu não tenho a medição. Não rodei dois arranjos lado a lado para comparar qual produz mais. O que eu tenho é o registro que torna a comparação possível, e as contagens aí em cima são mudança ao longo do tempo, não experimento.

Uma coisa eu estou deixando de fora, de propósito. Tudo aí em cima é a parte que deu certo. O que nada disso consegue conferir, e as duas vezes em que alguma coisa foi registrada e simplesmente não foi lida, é o próximo artigo — o dos recibos de que eu menos gosto. Falar isso me custa uma frase; deixar este aqui parecendo pronto teria custado mais.

Ele fecha listando, aos 18:15, o que é portátil: *"Use skill files as employees. The library and the librarian. Never do one-off work. Those travel with you to any stack."* Isso viaja com você para qualquer stack. O meu viaja num plugin, no outro repositório — a única coisa aqui feita para alguém pegar e levar embora. Poder ser levado não é o motivo de eu ter escrito: eu escrevi os motivos para mim mesmo, e só depois descobri que os motivos eram justamente a parte que conseguia sair dali.

O que este texto não carrega é o desenho. As camadas, o que cada uma **não** pode fazer, e como uma mudança atravessa elas estão na [página de arquitetura](/architecture) — o mesmo loop, montado para ser inspecionado, não lido.

Boa sorte, e tomara que você encontre o seu em estado melhor do que eu encontrei o meu.
