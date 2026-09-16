---
title: "Sou uma empresa AI-native de uma pessoa só. E eu não lembro como ela funciona — eu leio."
slug: o-que-os-meus-agentes-fazem
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
contentIssue: 259
excerpt: "A palestra do Garry Tan é sobre empresas AI-native — as que rodam em cima de Claude, de Codex, de harnesses. Eu sou uma pessoa com dois repositórios e fins de semana, e rodo a mesma arquitetura. O que sustenta ela não é nenhum desses produtos: é uma modelagem escrita do meu próprio loop, e a disciplina de apagar dela o que deixou de ser verdade."
takeaway: 'os produtos são a parte que dá para trocar; o que precisa estar escrito é a modelagem do seu próprio loop — por que cada peça existe, o que ela se recusa a fazer, e para onde foi a decisão que você jogou fora.'
---

https://www.youtube.com/watch?v=eBUyTS7SzV4

O Garry Tan, que toca a Y Combinator, deu uma palestra curta chamada *Every company should have a Brain* ("toda empresa deveria ter um cérebro"). Sem slide nenhum, só ele falando. É sobre empresas AI-native — as que já rodam em cima de Claude, de Codex, de harnesses construídos em volta deles — e sobre o que essas empresas precisam manter escrito para que qualquer coisa daquilo compense.

Este texto gira em torno da diferença entre um recibo e uma lembrança, então: tudo o que eu atribuo a ele está relatado com as minhas palavras, sem transcrição. Toda passagem que eu cito literalmente é arquivo meu, e dessas eu aponto a linha.

É um pitch — ele mesmo diz isso no meio, e para para testar o próprio pitch pelo argumento de que a plateia faria isso de qualquer jeito. Eu uso essa palavra como descrição. **Ela descreve o formato. Não diz nada sobre a coisa estar certa.**

Ele está falando de empresas. Eu sou uma pessoa com dois repositórios e fins de semana — e mesmo assim uma ideia daquela palestra me mandou olhar o que eu tinha construído de verdade, e qual parte daquilo continuaria de pé se você tirasse os produtos.

## Como isso roda, e as decisões embaixo

O loop que publica este site é um plugin que eu construí e opero. Oito personas, várias delas ali especificamente para discordar de outra antes de qualquer coisa ser escrita; hooks que recusam certos comandos sem discussão; uma biblioteca de skills; um conjunto de registros de decisão. O trabalho entra como uma issue, um lead discute com outro quanto aquilo vale, alguma coisa constrói, e um portão que não escreveu nada daquilo decide se aquilo sobe. Tudo rodando, tudo aberto.

Nada disso responde a pergunta que eu tinha acabado de me fazer. Os produtos são aquilo em cima de que o loop roda, e são também a parte que eu consigo trocar. O que deu trabalho foram as decisões embaixo, e duas delas carregam quase tudo.

A primeira é quem tem direito de existir. Uma persona aqui não é um cargo — ela ganha o lugar dela produzindo uma discordância que alguém precisa ouvir. Um mandato sem gatilho é um documento, e um agente sem contraparte é um repasse. Eu não comecei por aí, e chegar nisso me custou quase tudo o que eu já tinha construído.

A segunda é a que eu menos confio e mais uso: **o loop é uma máquina de moer trabalho até o fim, não de gerar trabalho novo.** Uma revisão que volta com vinte e duas observações transformou, no silêncio, uma fatia em quinze. Então tudo o que um portão enxerga e não é a fatia da frente é dito em voz alta e deixado quieto.

O que essas duas decisões acabaram produzindo é um arquivo — a modelagem do meu próprio loop, escrita em vez de carregada na cabeça. Uma entrada por comportamento, e não por arquivo, porque um arquivo pode carregar dois comportamentos e um comportamento pode estar espalhado em três. Cada entrada é obrigada a dizer para que aquele comportamento serve, e o que ele **não** faz. O resto da linha é inventário, e o inventário é a parte que eu entregaria para uma máquina rascunhar. Que é como eu leio o argumento dele agora: não é sobre quanta coisa tem ali dentro. É sobre o que está ali dentro ser a parte que não daria para derivar.

Essa é a história. A arquitetura em si — as camadas, os portões, os diagramas, as partes com que eu ainda estou brigando — está escrita por inteiro na [página de arquitetura](/architecture), e é para lá que eu iria em seguida.

## Reavalie, e tenha estômago para jogar fora

Já foram dezenove personas. A maior parte nunca rodou.

Elas eram um organograma: um papel por assunto, um especialista para cada substantivo que eu conseguia pensar. Organograma feito de agente produz repasse, e repasse é uma coisa que não acontece. Eu cortei para seis. Hoje são oito, e as que voltaram tiveram que voltar contra uma regra escrita sobre para que serve uma persona — não porque faltava uma caixinha no desenho. A biblioteca de skills foi pelo mesmo caminho e também não ficou parada: sessenta e nove skills consolidadas em quatorze, e hoje são quinze.

Uma contagem que só cai conta uma história sozinha. Uma que cai e depois volta a subir não conta nenhuma — e é exatamente esse o formato que deixa de ser legível no instante em que ninguém escreveu o porquê.

Por isso jogar fora é a parte mais rastreada de todas. As decisões aqui são MADRs, e a regra em que aquela biblioteca funciona é o próprio título dela — como o repositório é em inglês, daqui em diante vem o original e a tradução: *"An ADR earns its place by explaining the **current** codebase."* Um ADR ganha o lugar dele explicando o código **atual**. Um registro que parou de explicar o código atual não ganha uma tarja em cima dizendo que está velho. Ele é apagado — e o apagamento é o evento rastreado. Vinte e um números já foram emitidos. Sete estão vivos. Os quatorze que sumiram têm, cada um, uma linha dizendo o que decidiram e onde aquela decisão mora agora, debaixo de uma cláusula que eu aponto: *"A record leaves this library only as a disposition, never as an absence."* Um registro só sai desta biblioteca como disposição, nunca como ausência. E um teste lê isso nos dois sentidos — um número sem arquivo e sem linha deixa a suíte vermelha, e uma linha para um número que ainda está vivo também.

**O Tan nomeia isso como sendo o que mata um cérebro desses:** um que ninguém cuida vira um lixão com uma busca excelente. E a correção que ele dá é um papel, não uma funcionalidade: um bibliotecário, humano mais agente, cujo trabalho de verdade é podar.

É dessa afirmação que eu tenho recibo. Podar não é a parte que dá sensação de progresso. É a parte que deixou o resto utilizável.

Uma coisa eu estou deixando de fora, de propósito. Tudo aí em cima é a parte que deu certo. O que nada disso consegue conferir, e as duas vezes em que alguma coisa foi registrada e simplesmente não foi lida, é o próximo artigo — o dos recibos de que eu menos gosto. Falar isso me custa uma frase; deixar este aqui parecendo pronto teria custado mais.

## A palavra para isso

O vocabulário dele para tudo isso é uma biblioteca: livros, um bibliotecário, três livros abertos na mesa ao mesmo tempo, uma camada de recuperação cujo trabalho inteiro é escolher quais três. A palavra que começou a aparecer em IA para essa mesma ideia — organizar o que alguém sabe para que outra coisa consiga trabalhar em cima — é **ontology** (ontologia). Não é a palavra dele; ele não usa nenhuma vez e nem precisa.

Eu não sentei para construir uma, e o que faz daquele arquivo uma ontologia em vez de anotação é a parte chata. Os ids são atribuídos uma vez e nunca reaproveitados. Os tipos são *"one of five, closed and gated"* — um de cinco, lista fechada e com portão —, e a frase seguinte, no meu próprio arquivo, é a que importa: *"A name outside the set reddens the suite."* Um nome fora do conjunto deixa a suíte vermelha. Um vocabulário que é só combinado não é vocabulário. Alguma coisa precisa estar disposta a quebrar por causa dele.

Que é também o motivo de isso importar quando quem lê é um modelo. Em outro ponto do mesmo arquivo eu já tinha escrito o que um vocabulário frouxo faz: um valor *"re-decided on every invocation would look exactly like a derived one and be neither."* Re-decidido a cada invocação, ele pareceria exatamente um valor derivado sem ser nenhum dos dois. A falha não é uma resposta errada. É uma resposta regerada toda vez, indistinguível de uma que alguém decidiu uma vez só.

Os dois arquivos moram no outro repositório — o plugin, a única coisa aqui feita para alguém pegar e levar embora. Poder ser levado não é o motivo de eu ter escrito: eu escrevi os motivos para mim mesmo, e só depois descobri que os motivos eram justamente a parte que conseguia sair dali.

Então eu nomeio tarde, e nomeio mesmo assim. Botar uma palavra em cima de algo que você já tem é o que te deixa ir procurar as outras pessoas que construíram um, em vez de achar que você inventou uma mania de arquivar. Boa sorte, e tomara que você encontre o seu em estado melhor do que eu encontrei o meu.
