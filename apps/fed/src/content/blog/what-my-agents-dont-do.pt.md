---
title: "Registrei o que os meus agentes fazem. A metade que vale escrever é o porquê."
slug: o-que-os-meus-agentes-nao-fazem
date: '2026-12-31T12:00:00.000Z'
tag: harness
track: engenharia
hasVideo: true
excerpt: "A palestra do Garry Tan me mandou de volta para um arquivo do meu próprio repositório: 33 comportamentos, cada um com uma linha dizendo por que ele existe. É a coluna que eu manteria se tivesse que jogar o resto fora, e o motivo é que o modelo completa o resto."
takeaway: 'o inventário é a metade que o modelo completa sozinho; o que precisa estar escrito é a ideia central — o propósito, o limite e o motivo de alguma coisa ter sido removida.'
---

O Garry Tan, que toca a Y Combinator, deu uma palestra curta chamada *Every company should have a Brain* ("toda empresa deveria ter um cérebro"). Sem slide nenhum, só ele falando.

https://www.youtube.com/watch?v=eBUyTS7SzV4

Um aviso de casa, já que o texto inteiro gira em torno da diferença entre um recibo e uma lembrança: tudo o que eu atribuo a ele daqui para a frente está relatado, com as minhas palavras. Não tinha slide e eu não guardei transcrição, então o que chega até você é o conteúdo do que ele disse na minha formulação. As passagens que eu cito literalmente mais adiante são arquivos meus, e dessas eu consigo apontar a linha.

É um pitch. Ele mesmo diz isso no meio: ele para para testar o próprio pitch, pelo argumento de que a plateia faria isso de qualquer jeito. E eu quero ser exato com essa palavra, porque ela normalmente chega como acusação e não é assim que eu estou usando. **Pitch descreve o formato da coisa. Diz que a palestra está organizada para te convencer. Não diz nada sobre ela estar certa ou errada.**

Uma ideia dali me mandou de volta para os meus repositórios. É assim que eu venho carregando ela desde então — o argumento é dele, a frase é minha:

> Recuperar é fácil. Valer a consulta é que é o produto.

Então eu fui olhar o que eu tinha construído de verdade, e qual parte daquilo sobreviveria a ser lida por alguém que nunca vai rodar nada daquilo.

## A palavra para isso

O vocabulário da palestra é uma biblioteca. Livros, um bibliotecário, três livros abertos na mesa ao mesmo tempo, uma camada de recuperação cujo trabalho inteiro é escolher quais três. É uma boa imagem e ela carrega o argumento sozinha.

A palavra que começou a aparecer em IA para essa mesma ideia — organizar o conhecimento de uma companhia de um jeito que alguma coisa consiga trabalhar em cima dele — é **ontology** (ontologia). Não é a palavra dele. Ele não usa nenhuma vez, e nem precisa: a palestra descreve a coisa muito bem sem ela.

Ainda assim eu nomeio aqui, por um motivo só. Dar nome a algo que você já tem é o que te deixa ir procurar outras pessoas que construíram um, em vez de achar que você inventou uma mania de arquivar.

## A questão de escala, que ele mesmo responde

A objeção óbvia a "toda empresa deveria ter um cérebro" é que a maior parte de quem está assistindo não tem uma empresa. Eu também não tenho. Eu tenho dois repositórios e fins de semana.

Ele fecha a palestra exatamente nessa objeção, e fecha com uma história em vez de um argumento: um amigo cujo filho tem uma forma rara de epilepsia, que construiu um repositório de oitenta mil arquivos markdown, um cérebro de empresa construído para um menininho só, e se empurrou até a borda do que se sabe sobre a condição exata daquela criança. Um pai, um laptop e uma biblioteca. E aí ele crava o que transforma aquilo em afirmação em vez de anedota: o que aquele pai construiu é a mesma arquitetura que ele passou a palestra inteira descrevendo. Não uma parecida. A mesma.

Ou seja: a arquitetura é declarada válida numa escala de um. Eu sou uma escala de um. É só por isso que eu tenho o que dizer aqui — não é que eu opere uma empresa como as da palestra, é que a palestra afirma que o formato não precisa de uma.

## O que eu já tinha, e não chamava de nada

O loop que publica este site é um plugin que eu construí e opero. Sete personas que discordam entre si antes de qualquer coisa ser escrita, hooks que recusam certos comandos sem discussão, uma biblioteca de skills, um conjunto de registros de decisão. Tudo rodando, tudo aberto.

O que eu não tinha, até pouco tempo atrás, era um lugar só dizendo o que tudo aquilo **é**. Então eu escrevi um — um registro com uma entrada por comportamento, e não por arquivo, porque um arquivo pode carregar dois comportamentos e um comportamento pode estar espalhado em três arquivos. Hoje ele tem **33 entradas**. Cada uma carrega um id atribuído uma vez e nunca reaproveitado, um tipo de uma lista fechada de cinco, um propósito, o que ela faz — e uma coluna para **o que ela não faz**.

**A coluna com que eu mais me importo é a que diz para que cada comportamento existe**, e o motivo é mecânico, não sentimental. Um modelo é bom em completar o texto depois que a ideia central está capturada. Se alguém lê aquele arquivo e entende para que serve uma peça do meu harness, a maior parte do resto dá para reconstruir com a ferramenta já aberta na frente. O que não dá para reconstruir é uma decisão que ninguém tomou. Essa parte precisa existir escrita, porque não tem de onde mais ela sair.

O meu próprio arquivo define esse campo do jeito mais seco possível — e como o repositório é em inglês, daqui em diante vem sempre o original e a tradução. As três últimas palavras são a regra inteira: *"why the behaviour is wanted — the obligation, stated so a reader on a harness nobody here has measured can decide whether it matters to them. Never a content list."* Por que o comportamento é desejado: a obrigação, escrita de um jeito que alguém rodando um harness que ninguém aqui mediu consiga decidir se aquilo importa para ele. Nunca uma lista de conteúdo.

Nunca uma lista de conteúdo. A lista é a parte com que eu não preciso tomar cuidado.

A última coluna é da mesma família, e o arquivo diz o porquê melhor do que eu conseguiria parafrasear: *"The most transferable cell in the row: a limit is a property of the strategy, so it ports even where the mechanism does not."* A célula mais transferível da linha: um limite é uma propriedade da estratégia, então ele viaja até onde o mecanismo não viaja. Quem roda um setup completamente diferente do meu não consegue usar o meu hook. Consegue usar, sem nenhum atrito, a frase que diz o que aquele hook deixa passar.

Propósito e limite são os dois um motivo. Só a coluna do meio é inventário — e a coluna do meio é a única que eu entregaria para uma máquina rascunhar.

Que é como eu leio o argumento dele agora. Valer a consulta não é uma propriedade de quanta coisa tem ali dentro. É de o que está ali dentro ser a parte que não daria para derivar.

## Remoção é a parte que ninguém registra

Aqui vem a segunda coisa.

Os meus registros de decisão já emitiram vinte e um números. **Sete estão vivos. Quatorze sumiram** — absorvidos por outros registros quando a decisão que carregavam deixou de ser uma decisão própria. E nenhum daqueles quatorze números está simplesmente faltando. Cada um tem uma linha numa tabela dizendo o que decidiu e onde aquela decisão mora agora. A regra, escrita no topo dessa tabela: *"A record leaves this library only as a disposition, never as an absence."* — um registro só sai desta biblioteca como disposição, nunca como ausência.

E tem um teste que lê isso nos dois sentidos. Um número sem arquivo e sem linha deixa a suíte vermelha. Uma linha para um número que ainda está vivo deixa vermelha também.

A mesma disciplina aparece no formato do loop. Dezenove personas viraram sete. Sessenta e nove skills viraram quatorze. Cada um desses cortes carrega uma data e um motivo, e eu consigo ir ler. Eu não estou trabalhando com a minha lembrança do porquê, eu estou lendo o porquê.

**O Tan nomeia esse modo de falha, e nomeia como sendo o que mata um cérebro desses:** um cérebro que ninguém cuida vira um lixão com uma busca excelente. E a correção que ele dá é um papel, não uma funcionalidade: um bibliotecário, humano mais agente, cujo trabalho de verdade é podar.

É dessa afirmação que eu tenho recibo. Podar não é a parte que dá sensação de progresso. É a parte que deixou o resto utilizável.

## O que nada disso consegue conferir — e o meu próprio arquivo diz isso

Agora a metade honesta, porque um texto que concorda com um pitch e para por aí te vendeu a versão fácil.

**Nada do que eu construí consegue dizer se aquilo é verdade.** A coluna de propósito é infalsificável — essa palavra está no meu próprio arquivo: *"No instrument in this repository can tell a true purpose from a plausible one, or a limit that is complete from one that is merely well-written."* Nenhum instrumento naquele repositório distingue um propósito verdadeiro de um plausível, nem um limite completo de um apenas bem escrito. Uma entrada cujo raciocínio envelheceu dois meses atrás passa em todos os testes que eu tenho.

**E capturar a ideia central não faz ninguém ler.** Dois recibos, os dois meus. Um dos meus registros de decisão descrevia um arquivo que tinha sido apagado cinco horas antes de o registro ser escrito — falso no dia em que subiu, e ainda falso semanas depois, porque ninguém relê um registro de decisão. E, numa sessão, eu escrevi uma regra num guia, a de que uma enumeração falha aberta, e a lista seguinte escrita sob aquela regra deixou de fora exatamente o arquivo sobre o qual a regra tinha sido escrita. A ideia estava capturada. Estava capturada e não foi consultada. Os dois são falhas de recuperação, não de escrita, e nada no meu registro encosta nisso.

Repare no que envelheceu no primeiro caso, aliás. Era um caminho de arquivo.

Exatamente uma metade do registro é conferível, e só por causa de uma decisão de formatação: o limite citado tem que estar nas palavras do próprio arquivo de origem, literal, para que um script consiga procurar por ele. Uma paráfrase seria mais gostosa de ler e impossível de verificar.

E a tabela de cobertura se declara **incompleta** em vez de parecer pronta. Seis skills ainda não têm entrada. Escrever seis entradas rasas para deixar aquela declaração verde é exatamente a falha que o arquivo existe para evitar, então ele diz `partial` e nomeia quais seis. Ali ausência é um valor, nunca um buraco — o que soa como burocracia até a primeira vez em que você olha para uma base de conhecimento e não consegue distinguir "a gente decidiu que isso está fora do escopo" de "ninguém chegou nisso ainda".

## Se você quiser começar um

Você não precisa das minhas ferramentas nem das dele. Três hábitos carregaram tudo o que está aí em cima, e nenhum deles exige repositório:

**Escreva o motivo, não o inventário.** Por que a coisa existe, e o que ela se recusa a fazer. A lista do que ela faz é a parte em que você pode ser preguiçoso — alguma coisa vai completar aquilo para você.

**Quando remover alguma coisa, deixe uma disposição, não um buraco.** Para onde foi aquela decisão. Uma linha basta.

**Declare o que está incompleto em vez de deixar parecer pronto.** Uma base que subdeclara e uma que superdeclara falham do mesmo jeito, e as duas falham em silêncio.

Então: vá olhar o que quer que você venha anotando nos últimos três meses. Não para admirar. Faça uma pergunta só: se alguém lesse só isto, o que essa pessoa teria que adivinhar? Essa é a linha que deveria estar lá.

Boa sorte, e tomara que você encontre o seu em estado melhor do que eu encontrei o meu.
