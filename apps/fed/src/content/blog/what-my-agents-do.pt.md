---
title: "Registrei o que os meus agentes fazem. A metade que vale escrever é o porquê."
slug: o-que-os-meus-agentes-fazem
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "A palestra do Garry Tan me mandou de volta para um arquivo do meu próprio repositório: 55 comportamentos, cada um com uma linha dizendo por que ele existe. É a coluna que eu manteria se tivesse que jogar o resto fora, e o motivo é que o modelo completa o resto."
takeaway: 'o inventário é a metade que o modelo completa sozinho; o que precisa estar escrito é a ideia central — o propósito, o limite e o motivo de alguma coisa ter sido removida.'
---

O Garry Tan, que toca a Y Combinator, deu uma palestra curta chamada *Every company should have a Brain* ("toda empresa deveria ter um cérebro"). Sem slide nenhum, só ele falando.

https://www.youtube.com/watch?v=eBUyTS7SzV4

Este texto gira em torno da diferença entre um recibo e uma lembrança, então: tudo o que eu atribuo a ele está relatado com as minhas palavras, sem transcrição. Toda passagem que eu cito literalmente é arquivo meu, e dessas eu aponto a linha.

É um pitch — ele mesmo diz isso no meio, e para para testar o próprio pitch pelo argumento de que a plateia faria isso de qualquer jeito. E eu quero ser exato com essa palavra, porque ela normalmente chega como acusação e não é assim que eu estou usando. **Ela descreve o formato. Não diz nada sobre a coisa estar certa.**

Uma ideia dali me mandou de volta para os meus repositórios. É assim que eu venho carregando ela desde então — o argumento é dele, a frase é minha:

> Recuperar é fácil. Valer a consulta é que é o produto.

A objeção óbvia é que a maior parte de quem está assistindo não tem uma empresa. Eu também não tenho. Eu tenho dois repositórios e fins de semana. Ele fecha exatamente nisso, com uma história: um amigo cujo filho tem uma forma rara de epilepsia, que construiu um repositório de oitenta mil arquivos markdown e se empurrou até a borda do que se sabe sobre a condição daquela criança. Um pai, um laptop e uma biblioteca. E aí ele crava o que transforma aquilo em afirmação em vez de anedota — aquilo é a mesma arquitetura que ele passou a palestra inteira descrevendo. Não uma parecida. A mesma.

Ou seja: ela é declarada válida numa escala de um, e eu sou uma escala de um. Então eu fui olhar o que eu tinha construído de verdade, e qual parte daquilo sobreviveria a ser lida por alguém que nunca vai rodar nada daquilo.

## A palavra para isso

O vocabulário da palestra é uma biblioteca: livros, um bibliotecário, três livros abertos na mesa ao mesmo tempo, uma camada de recuperação cujo trabalho inteiro é escolher quais três. A palavra que começou a aparecer em IA para essa mesma ideia — organizar o conhecimento de uma companhia para que alguma coisa consiga trabalhar em cima dele — é **ontology** (ontologia). Não é a palavra dele; ele não usa nenhuma vez e nem precisa.

Ainda assim eu nomeio, porque dar nome a algo que você já tem é o que te deixa ir procurar outras pessoas que construíram um, em vez de achar que você inventou uma mania de arquivar.

## O que eu já tinha, e não chamava de nada

O loop que publica este site é um plugin que eu construí e opero. Oito personas, várias delas ali especificamente para discordar de outra antes de qualquer coisa ser escrita, hooks que recusam certos comandos sem discussão, uma biblioteca de skills, um conjunto de registros de decisão. Tudo rodando, tudo aberto.

O que eu não tinha, até pouco tempo atrás, era um lugar só dizendo o que tudo aquilo **é**. Então eu escrevi um — um registro com uma entrada por comportamento, e não por arquivo, porque um arquivo pode carregar dois comportamentos e um comportamento pode estar espalhado em três arquivos. Hoje ele tem **55 entradas**. Cada uma carrega um id atribuído uma vez e nunca reaproveitado, um tipo de uma lista fechada de cinco, um propósito, o que ela faz — e uma coluna para **o que ela não faz**.

**A coluna com que eu mais me importo é a que diz para que cada comportamento existe**, e o motivo é mecânico, não sentimental. Um modelo é bom em completar o texto depois que a ideia central está capturada. Se alguém lê aquele arquivo e entende para que serve uma peça do meu harness, a maior parte do resto se reconstrói com a ferramenta já aberta na frente. O que não dá para reconstruir é uma decisão que ninguém tomou. Isso precisa existir escrito, porque não tem de onde mais sair.

O meu próprio arquivo define esse campo do jeito mais seco possível — e como o repositório é em inglês, daqui em diante vem o original e a tradução. As três últimas palavras são a regra: *"why the behaviour is wanted — the obligation, stated so a reader on a harness nobody here has measured can decide whether it matters to them. Never a content list."* Por que o comportamento é desejado: a obrigação, escrita para que alguém num harness que ninguém aqui mediu decida se aquilo importa. Nunca uma lista de conteúdo.

Nunca uma lista de conteúdo. A lista é a parte com que eu não preciso tomar cuidado.

A última coluna é da mesma família, e o arquivo diz o porquê melhor do que eu parafrasearia: *"The most transferable cell in the row: a limit is a property of the strategy, so it ports even where the mechanism does not."* A célula mais transferível da linha: um limite é propriedade da estratégia, então viaja até onde o mecanismo não viaja. Quem roda um setup completamente diferente do meu não consegue usar o meu hook. Consegue usar a frase que diz o que aquele hook deixa passar.

Propósito e limite são os dois um motivo. Só a coluna do meio é inventário, e é a única que eu entregaria para uma máquina rascunhar — que é como eu leio o argumento dele agora. Valer a consulta não é sobre quanta coisa tem ali dentro. É sobre o que está ali dentro ser a parte que não daria para derivar.

## Remoção é a parte que ninguém registra

Aqui vem a segunda coisa.

Os meus registros de decisão já emitiram vinte e um números. **Sete estão vivos. Quatorze sumiram** — absorvidos por outros registros quando a decisão que carregavam deixou de ser uma decisão própria. E nenhum dos quatorze está simplesmente faltando: cada um tem uma linha numa tabela dizendo o que decidiu e onde aquela decisão mora agora. A regra, escrita no topo dessa tabela: *"A record leaves this library only as a disposition, never as an absence."* — um registro só sai desta biblioteca como disposição, nunca como ausência. E um teste lê isso nos dois sentidos: um número sem arquivo e sem linha deixa a suíte vermelha, e uma linha para um número que ainda está vivo também.

A mesma disciplina aparece no formato do loop — e os números não só descem. Dezenove personas foram cortadas para seis, e hoje são oito. Sessenta e nove skills foram consolidadas em quatorze, e hoje são quinze. Uma contagem que só cai conta uma história sozinha; uma que cai e depois volta a subir não conta nenhuma — é exatamente o formato que deixa de ser legível quando ninguém escreveu o porquê. Eu não trabalho com a minha lembrança do porquê. Eu leio o porquê.

**O Tan nomeia esse modo de falha, e nomeia como sendo o que mata um cérebro desses:** um cérebro que ninguém cuida vira um lixão com uma busca excelente. E a correção que ele dá é um papel, não uma funcionalidade: um bibliotecário, humano mais agente, cujo trabalho de verdade é podar.

É dessa afirmação que eu tenho recibo. Podar não é a parte que dá sensação de progresso. É a parte que deixou o resto utilizável.

Uma coisa eu estou deixando de fora, de propósito. Tudo aí em cima é a parte que deu certo. O que nada disso consegue conferir, e as duas vezes em que alguma coisa foi registrada e simplesmente não foi lida, é o próximo artigo — o dos recibos de que eu menos gosto. Falar isso custa uma frase; deixar este aqui parecendo pronto teria custado mais.

## Se você quiser começar um

Você não precisa das minhas ferramentas nem das dele. Três hábitos carregaram tudo aí em cima, e nenhum exige repositório:

**Escreva o motivo, não o inventário.** Por que a coisa existe, e o que ela se recusa a fazer. A lista do que ela faz é a parte em que você pode ser preguiçoso — alguma coisa vai completar aquilo para você.

**Quando remover alguma coisa, deixe uma disposição, não um buraco.** Para onde foi aquela decisão. Uma linha basta.

**Declare o que está incompleto em vez de deixar parecer pronto.** Uma base que subdeclara e uma que superdeclara falham do mesmo jeito, e as duas falham em silêncio.

Então: vá olhar o que você vem anotando nos últimos três meses. Não para admirar. Faça uma pergunta só: se alguém lesse só isto, o que teria que adivinhar? Essa é a linha que deveria estar lá.

Boa sorte, e tomara que você encontre o seu em estado melhor do que eu encontrei o meu.
