---
title: "Registrei tudo o que os meus agentes fazem. O que valeu foi o que eles não fazem."
slug: o-que-os-meus-agentes-nao-fazem
date: '2026-12-31T12:00:00.000Z'
tag: harness
track: engenharia
hasVideo: true
excerpt: "A palestra do Garry Tan descreve um cérebro de empresa sem nunca usar a palavra que começou a aparecer na área para isso — ontology. Fui conferir o meu contra o argumento dele, e a coluna que se pagou não foi a que lista o que cada peça faz."
takeaway: 'registrar é a metade fácil; o que faz uma base de conhecimento valer a consulta é dizer o limite, registrar a remoção e declarar o que ainda está incompleto.'
---

O Garry Tan, que toca a Y Combinator, deu uma palestra de vinte minutos chamada *Every company should have a Brain* ("toda empresa deveria ter um cérebro"). Sem slide nenhum, só ele falando.

https://www.youtube.com/watch?v=eBUyTS7SzV4

É um pitch. Ele mesmo diz isso no meio — *"let me stress test my own pitch because you would anyway"* ("deixa eu mesmo testar o meu pitch, porque vocês fariam isso de qualquer jeito") — e eu quero ser exato com essa palavra, porque ela normalmente chega como acusação e não é assim que eu estou usando. **Pitch descreve o formato da coisa. Diz que a palestra está organizada para te convencer. Não diz nada sobre ela estar certa ou errada.**

Uma frase ali me mandou de volta para os meus repositórios:

> "Retrieval is easy. Being worth retrieving from is the product."
>
> — recuperar é fácil; valer a consulta é que é o produto.

Fui olhar o que eu tinha construído de verdade, e a parte interessante não foi a parte de que eu tinha orgulho.

## A palavra que ele nunca usa

O vocabulário da palestra é uma biblioteca. Livros, um bibliotecário, três livros abertos na mesa ao mesmo tempo, uma camada de recuperação cujo trabalho inteiro é escolher quais três. É uma boa imagem e ela carrega o argumento sozinha.

A palavra que começou a aparecer em IA para essa mesma ideia — organizar o conhecimento de uma companhia de um jeito que alguma coisa consiga trabalhar em cima dele — é **ontology** (ontologia). Não é a palavra dele. Ele não usa nenhuma vez em vinte minutos, e nem precisa: a palestra descreve a coisa muito bem sem ela.

Ainda assim eu nomeio aqui, por um motivo só. Dar nome a algo que você já tem é o que te deixa ir procurar outras pessoas que construíram um, em vez de achar que você inventou uma mania de arquivar.

## A questão de escala, que ele mesmo responde

A minha primeira objeção a "toda empresa deveria ter um cérebro" foi que eu não tenho uma empresa. Eu tenho dois repositórios e fins de semana.

Ele fecha a palestra exatamente nessa objeção, e fecha com uma história em vez de um argumento: um amigo cujo filho tem uma forma rara de epilepsia, que construiu um repositório de oitenta mil arquivos markdown — *"a company brain for one small boy"* ("um cérebro de empresa para um menininho") — e se empurrou até a borda do que se sabe sobre a condição exata daquela criança. Um pai, um laptop e uma biblioteca. E aí ele diz a frase que transforma aquilo em afirmação em vez de anedota: *"That is the exact architecture I've been describing for the last 20 minutes."* — é exatamente a arquitetura que ele passou vinte minutos descrevendo.

Ou seja: a arquitetura é declarada válida numa escala de um. Eu sou uma escala de um. É só por isso que eu tenho o que dizer aqui — não é que eu opere uma empresa como as da palestra, é que a palestra afirma que o formato não precisa de uma.

## O que eu já tinha, e não chamava de nada

O loop que publica este site é um plugin que eu construí e opero. Sete personas que discordam entre si antes de qualquer coisa ser escrita, hooks que recusam certos comandos na marra, uma biblioteca de skills, um conjunto de registros de decisão. Tudo rodando, tudo aberto.

O que eu não tinha, até pouco tempo atrás, era um lugar só dizendo o que tudo aquilo **é**. Então eu escrevi um — um registro com uma entrada por comportamento, e não por arquivo, porque um arquivo pode carregar dois comportamentos e um comportamento pode estar espalhado em três arquivos. Hoje ele tem **33 entradas**. Cada uma carrega um id atribuído uma vez e nunca reaproveitado, um tipo de uma lista fechada de cinco, um propósito, o que ela faz — e uma coluna para **o que ela não faz**.

Eu esperava que a coluna valiosa fosse a do propósito. Não era.

A coluna que se pagou é a última, e o meu próprio arquivo diz o porquê melhor do que eu conseguiria parafrasear — o repositório é publicado em inglês, então vai o original e a tradução: *"The most transferable cell in the row: a limit is a property of the strategy, so it ports even where the mechanism does not."* A célula mais transferível da linha: um limite é uma propriedade da estratégia, então ele viaja até onde o mecanismo não viaja. Quem roda um setup completamente diferente do meu não consegue usar o meu hook. Consegue usar, sem nenhum atrito, a frase que diz o que aquele hook deixa passar.

## Remoção é a parte que ninguém registra

Aqui vem a segunda coisa, e é a que eu recomendaria a um par roubar primeiro.

Os meus registros de decisão já emitiram vinte e um números. **Sete estão vivos. Quatorze sumiram** — absorvidos por outros registros quando a decisão que carregavam deixou de ser uma decisão própria. E nenhum daqueles quatorze números está simplesmente faltando. Cada um tem uma linha numa tabela dizendo o que decidiu e onde aquela decisão mora agora. A regra, escrita no topo dessa tabela: *"A record leaves this library only as a disposition, never as an absence."* — um registro só sai desta biblioteca como disposição, nunca como ausência.

E tem um teste que lê isso nos dois sentidos. Um número sem arquivo e sem linha deixa a suíte vermelha. Uma linha para um número que ainda está vivo deixa vermelha também.

A mesma disciplina aparece no formato do loop. Dezenove personas viraram sete. Sessenta e nove skills viraram quatorze. Cada um desses cortes carrega uma data e um motivo, e eu consigo ir ler, que é o único motivo pelo qual eu confio no formato atual — eu não estou confiando na minha lembrança do porquê, eu estou lendo o porquê.

**O Tan nomeia esse modo de falha sozinho, e nomeia como sendo o que mata um cérebro desses:** *"a brain nobody curates becomes a garbage dump with great search"* — um cérebro que ninguém cuida vira um lixão com uma busca excelente — e a correção que ele dá é um papel, não uma funcionalidade: *"a librarian, human plus agent, whose actual job is pruning"*, um bibliotecário, humano mais agente, cujo trabalho de verdade é podar.

É dessa frase que eu tenho recibo. Podar não é a parte que dá sensação de progresso. É a parte que deixou o resto utilizável.

## O que nada disso consegue conferir — e o meu próprio arquivo diz isso

Agora a metade honesta, porque um texto que concorda com um pitch e para por aí te vendeu a versão fácil.

**Nada do que eu construí consegue dizer se aquilo é verdade.** A coluna de propósito é infalsificável — essa palavra está no meu próprio arquivo: *"No instrument in this repository can tell a true purpose from a plausible one, or a limit that is complete from one that is merely well-written."* Nenhum instrumento naquele repositório distingue um propósito verdadeiro de um plausível, nem um limite completo de um apenas bem escrito. Uma entrada cujo raciocínio envelheceu dois meses atrás passa em todos os testes que eu tenho.

Exatamente uma metade é conferível, e só por causa de uma decisão de formatação: o limite citado tem que estar nas palavras do próprio arquivo de origem, literal, para que um script consiga procurar por ele. Uma paráfrase seria mais gostosa de ler e impossível de verificar.

E a tabela de cobertura se declara **incompleta** em vez de parecer pronta. Seis skills ainda não têm entrada. Escrever seis entradas rasas para deixar aquela declaração verde é exatamente a falha que o arquivo existe para evitar, então ele diz `partial` e nomeia quais seis. Ali ausência é um valor, nunca um buraco — o que soa como burocracia até a primeira vez em que você olha para uma base de conhecimento e não consegue distinguir "a gente decidiu que isso está fora do escopo" de "ninguém chegou nisso ainda".

## Se você quiser começar um

Você não precisa das minhas ferramentas nem das dele. Três hábitos carregaram tudo o que está aí em cima, e nenhum deles exige repositório:

**Escreva o que cada coisa não faz, no mesmo fôlego em que você escreve o que ela faz.** Essa é a coluna que viaja.

**Quando remover alguma coisa, deixe uma disposição, não um buraco.** Para onde foi aquela decisão. Uma linha basta.

**Declare o que está incompleto em vez de deixar parecer pronto.** Uma base que subdeclara e uma que superdeclara falham do mesmo jeito, e as duas falham em silêncio.

Então: vá olhar o que quer que você venha anotando nos últimos três meses. Não para admirar. Faça uma pergunta só: se alguém lesse só isto, o que essa pessoa entenderia errado? Essa resposta é a sua primeira entrada na última coluna.

Boa sorte, e tomara que você encontre o seu em estado melhor do que eu encontrei o meu.
