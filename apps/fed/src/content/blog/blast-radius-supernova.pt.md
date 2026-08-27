---
title: "Blast Radius Supernova"
slug: blast-radius-supernova
date: '2026-08-27T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
hasVideo: true
excerpt: "Pedi uma paródia de uma música que eu gosto, sobre o meu próprio trabalho. Depois fui conferir se cada imagem dela era verdade — e a conferência é o artigo, porque cada uma virou um modo de falha real, com arquivo por trás."
takeaway: 'que um prompt e a saída dele não provam nada sozinhos; o que faz a saída valer publicação é ir imagem por imagem e nomear a que cada uma se refere.'
---

Eu gosto de *Champagne Supernova*, do Oasis. A música tem trinta anos, o clipe é a banda atravessando uma sala em câmera lenta, e eu já trabalhei ouvindo isso mais vezes do que consigo contar.

**A fonte, logo de cara: a métrica, o formato e o esquema de rimas que começaram isso são do Oasis — *Champagne Supernova*, de *(What's the Story) Morning Glory?*, 1995. Tudo o que eu escrevi é meu.** O clipe está aqui, e é o único motivo de eu ter tido a ideia:

https://www.youtube.com/watch?v=P5AjSVwZ9H0

## 1 · A provocação

A ideia não tinha nada de sofisticado. Eu queria uma versão daquela música sobre **o meu trabalho** — o harness que eu construo nos fins de semana, o loop que publica este site, e aquele tipo bem específico de sofrimento que vem de rodar agentes contra os seus próprios repositórios.

Quero ser exato sobre por que eu estou publicando alguma coisa, porque "fiz uma IA escrever uma coisa engraçada" não é motivo.

Todo o resto deste site é um argumento técnico com recibo embaixo. Isso aqui é o mesmo movimento aplicado à **forma** em vez do assunto: peguei um formato fixo que eu não inventei, passei o meu material por ele, e aí fiz a parte que torna a coisa minha — voltei em cada imagem e perguntei a que ela se refere de verdade.

Essa segunda metade é o artigo. A primeira é uma terça-feira.

## 2 · O prompt

Foi isto que eu digitei, sem editar, em caixa baixa e com os erros que tinham. Eu converso com o Claude em português, então esta é a coisa como saiu:

> *"qual a letra de champagne supernova oasis? eu gosto desse clip […] quero ter uma versao de champagne supernova relacionada com meu trabalho, meu drama, minha jornada de aprendizado de harness engineering, claude code, etc."*

**Estou mostrando o prompt porque ele é o método, não porque ele é prova.** Um prompt mais a saída dele provam uma coisa: que um modelo produziu texto. Como argumento sobre engenharia isso é circular, e eu não ia gastar o seu tempo com isso.

O que o prompt serve para mostrar é de onde veio o material. "Meu trabalho, meu drama, minha jornada de aprendizado" não é um briefing criativo — é um ponteiro para dois repositórios dentro dos quais eu venho morando há meses. O modelo forneceu a métrica. O sofrimento já estava lá, e os arquivos também.

## 3 · O que voltou, e por que você não vai ler

O que voltou foi uma paródia inteira, no formato dele: três versos, refrão, ponte, outro. Escandiu. Me fez rir numa noite de terça. Chama-se *Blast Radius Supernova*, que é de onde esta peça tira o nome.

**E ela não está impressa aqui, de propósito.** Não é uma peça que ecoa uma música — é aquela música com as palavras trocadas, verso por verso, posição por posição. Reproduzir isso inteiro é reproduzir a forma de outra pessoa com as minhas substituições dentro, e não é coisa que esta plataforma deva publicar. Prefiro perder a piada a ter no site uma única página jogando solto.

Então o que sobra é a parte que sempre foi a que valia ler.

**Catorze imagens.** Uma doc que ninguém leu. Infraestrutura de volta dos mortos. Um pager às três da manhã. Uma mudança saindo mais rápido do que alguém conseguia olhar. Um plan que comeu o state. Um rollback com raio de destruição. Hooks disparando duas vezes. Um arquivo que eu tinha declarado morto e que carrega assim mesmo. Escopo sendo cortado. Uma sprint que nunca converge. O mesmo labirinto de novo. Drift. Um deadline de contexto estourado. E, no fim, três repetições de um verso sobre ter publicado às cegas.

Li as catorze e tive a reação que transformou isso num artigo em vez de um print: **nenhuma delas é genérica.** Cada uma tem um arquivo, uma fatura, um commit ou uma medição por trás, nos dois repositórios que produzem este site. Um modelo escreveu uma piada sobre o trabalho de um estranho e acertou catorze do meu.

**Essa distância é o punch, e é ela que vale o seu tempo** — não o verso em que chegou. Então vamos à auditoria.

## 4 · O recibo, uma imagem por vez

O vocabulário vai explicado conforme aparece, porque metade dele é específico do jeito que eu trabalho e nada disso deveria exigir uma ferramenta aberta para acompanhar.

**Três palavras que se repetem.** Um **harness** é o aparato em volta de um agente de código — as regras que ele carrega, as permissões que ele tem, os checks pelos quais ele precisa passar. Um **hook** é um script que o harness executa num momento fixo, tipo logo antes de um comando rodar, e que pode recusar esse comando. Uma **persona** é um subagente com um briefing escrito e um trabalho estreito, despachado para uma tarefa e descartado depois.

### A doc que é lida o tempo todo e consultada nunca

Existe um parágrafo no arquivo de instruções do meu próprio plugin que ficou **errado por seis dias** antes de alguém notar — ele apontava para um arquivo que tinha deixado de ser arquivo. Só foi corrigido porque um trabalho não relacionado fez alguém ler aquela frase, e a correção diz isso com todas as letras em vez de consertar a linha caladinho.

A parte interessante não é uma doc ter envelhecido. É que a doc em questão é a que é **carregada em toda e qualquer sessão** — não é um README esquecido numa pasta, é o arquivo que o agente lê primeiro, sempre.

Tenho um segundo caso, pior, de outra semana: escrevi numa guia a regra de que uma lista que enumera coisas falha *em silêncio* quando falta alguma — e a lista seguinte escrita sob aquela regra deixou de fora exatamente o arquivo sobre o qual a regra tinha sido escrita.

### A infraestrutura que eu aposentei, e que continuou faturando

Eu não tenho cluster nenhum. Tenho uma coisa que se comporta igual.

Quando eu cortei o backend desta plataforma — inteiro, a camada de API, o banco, a autenticação — a aposentadoria foi limpa no código e **não foi limpa na conta**. Uns **USD 12,80 por mês** continuaram saindo: ACLs de firewall e endereços IP públicos ociosos, parados ali ligados a nada, faturando no cronograma. Descobri lendo a fatura, que é o jeito atrasado de descobrir.

Infraestrutura que você para de usar não para de existir. Ela para de estar *no diff*, que é uma coisa completamente diferente.

### O texto que eu risquei, e que carrega assim mesmo

Esse eu cito, porque a expressão é o mecanismo: *"a steering file I swore would die"* — um steering file que eu jurei que ia morrer.

Um **steering file** é o documento de instruções permanentes que uma ferramenta agêntica carrega antes de fazer qualquer coisa — o negócio que conta pro agente como este projeto funciona. Eu rodo dois harnesses, um no trabalho e um aqui, e os dois têm uma versão disso.

O meu é cheio de texto que eu declarei morto. É uma convenção que eu escolhi e ainda defendo: quando uma regra se revela errada, eu **risco e deixo no lugar**, com data e motivo, porque alguém tomou uma decisão baseada na frase antiga e merece descobrir que ela mudou em vez de descobrir que ela sumiu.

O custo é exato e eu pago toda sessão. Aquele arquivo é carregado no início da sessão, inteiro, com os trechos riscados junto. E ele não está sozinho: num ponto medido, só as descrições da minha biblioteca de skills tinham virado uns **dez mil tokens carregados antes da primeira palavra da tarefa de verdade** — uma decisão que era de graça enquanto nada as carregava, e deixou de ser no instante em que alguma coisa passou a carregar.

Tudo o que eu enterrei continua na sala. De propósito, e não de graça.

### A mudança que sai na velocidade de um clique

Aqui não tem rollout lento. Não tem ambiente de homologação, não tem canário, não tem porcentagem. **Mergear é publicar** — um branch, um destino, e o merge que fecha o pull request é o mesmo ato que coloca a coisa na sua frente.

É uma escolha deliberada e tem um preço declarado, que eu vou repetir em vez de suavizar: o que decide se uma mudança é segura o bastante para mergear sem mim é o mesmo tipo de coisa que escreveu a mudança. Classifique uma errado e ela vai direto pra rua. O que torna isso aceitável não é confiança — é que isto é um site estático e um revert é um merge.

### O plan que é cego justo para o que dá acesso a todo o resto

`terraform plan` é o comando que te conta o que está prestes a mudar na sua conta de nuvem antes de mudar. A piada da imagem é que o plan deveria ser a parte segura.

O referente é um buraco que eu documentei de propósito. A confiança entre o meu pipeline e a AWS — o provedor de identidade e o papel que o pipeline assume — é **criada na mão, fora do Terraform**, porque não existe jeito de bootstrapar isso por dentro. O que significa que a frase naquele registro de decisão diz, na íntegra: se alguém editar aquela política de confiança pelo console, **nenhum `plan` reclama**. A ferramenta que existe para te contar a verdade sobre a sua infraestrutura é estruturalmente cega justo para o pedaço que dá acesso ao resto.

Escrevi isso como limitação em vez de decorar, e continua sendo uma limitação.

### Os dois lugares onde o revert não alcança

Esse é o título, e é o único conceito que eu levaria embora desta peça inteira se só pudesse ficar com um.

**Blast radius** é o quanto do mundo uma mudança consegue danificar se estiver errada. É o dial contra o qual eu calibro todo o resto: quanto planejamento, quanta revisão, se um humano precisa dizer sim. Raio grande recebe cerimônia máxima. Barato-de-reverter recebe velocidade de produto.

Aqui quase tudo tem raio pequeno, e eu digo isso. Mas existem exatamente dois lugares nesta plataforma onde o raio é genuinamente largo, e os dois são largos pelo mesmo motivo — **o desfazer não chega**:

O primeiro é uma URL publicada e o seu card social. O primeiro scraper que busca um artigo novo fixa o título e a imagem que viu. Mude depois e o pino não anda. É por isso que o título e o slug *deste* artigo foram a única coisa que eu não deixei o loop decidir.

O segundo é o histórico do git. Um arquivo commitado num repositório público está commitado; apagar num commit seguinte tira ele da árvore e não do registro. É essa restrição que faz as miniaturas dos vídeos deste site serem desenhadas por mim, no meu próprio design system, em vez de cópias das que o YouTube serve — uma questão de licenciamento que um `git rm` não teria respondido.

Em todo o resto eu consigo desfazer. Nesses dois, "desfazer" é uma palavra que para de funcionar, e é isso que um raio largo é na prática.

### Dois hooks, um comando, toda vez

Aqui eu também cito, porque as duas metades da frase trabalham: *"the hooks fire twice, I don't know why"* — os hooks disparam duas vezes, não sei por quê.

A primeira metade é literalmente verdadeira e eu consigo apontar a linha. Meu plugin registra **dois** hooks no mesmo gatilho — cada comando de shell que eu rodo passa pelo `permission-guard`, que pode recusar na hora, e depois pelo `wip-guard`, que checa se eu já tenho trabalho em voo. Dois scripts, um comando, toda vez. Está no `hooks.json` e dá para contar.

A segunda metade é a parte honesta. Eu sei por que *aqueles dois* disparam. O que eu repetidamente não soube foi por que uma regra que eu escrevi uma vez continua precisando ser escrita de novo — um dos meus registros de decisão anota que um guard específico **declarava a mesma regra duas vezes no próprio cabeçalho**, e o corpo do registro repetia uma terceira, e mesmo assim ela foi quebrada depois.

Dizer uma coisa duas vezes não é mecanismo. Isso levou um número constrangedor de repetições até eu aceitar, e é o argumento mais forte que eu tenho para explicar por que este loop é feito de hooks e gates em vez de um documento muito longo explicando ao agente como se comportar.

### O detector de drift, e o buraco dele

**Drift** é quando a coisa que você implantou e a coisa que você escreveu param de concordar, e nada te avisa.

Eu tenho detector para um sabor disso: o meu site guarda um inventário commitado do que o plugin contém — quantos hooks, quais personas, o que cada uma pode e não pode recusar — e um job compara esse inventário com a árvore viva do plugin. Renomeie uma persona lá e o build aqui fica vermelho. É o mecanismo de que eu mais me orgulho, porque é o que transforma um diagrama em afirmação.

E vou te contar exatamente onde ele para, porque um guard descrito como pegando mais do que pega é justamente como o caso não-pego sobrevive. Aquele check compara **nomes e contagens**. Ele não checa o que uma linha diz que uma persona *faz*, e não checa quais skills cada uma carrega. Existe uma tabela na minha página de arquitetura onde alguém poderia mudar um briefing amanhã e a tabela começaria a mentir no dia seguinte **sem sinal nenhum**. Eu sei disso, está escrito lá nesses termos, e hoje não há detector para isso.

Um tipo de drift pego mecanicamente, outro tipo pego só por um humano relendo. O segundo tipo é o que roda por semanas.

### O contexto que acaba

O contexto de um agente é finito e acaba, e o jeito como ele acaba é a restrição que define tudo lá em cima. Ver uma string de erro de sistema distribuído aterrissar no meio de uma música sobre os sonhos de alguém é mais engraçado do que deveria, e é também a imagem mais exata do conjunto.

É para isso que as personas servem, na prática. Quando eu despacho um subagente, ele lê, roda, erra e refaz **dentro da sessão dele**, e o que volta para a sessão principal é a conclusão em vez do trabalho. A sessão principal paga pelo veredito, não pela execução. Já medi isso uma vez nas minhas próprias transcrições: o que ficou dentro dos subagentes foi mais de uma ordem de grandeza maior do que o que voltou.

E não é escapatória. Aquela mesma sessão ficou sem espaço e compactou duas vezes assim mesmo. A alavanca é real e tem teto, e se algum dia eu escrever uma peça dizendo que resolvi isso, não acredite.

### A fila que crescia por estar sendo trabalhada

Até três dias atrás o meu loop **não tinha iteração nenhuma**. Tinha uma fila e um comando que drenava ela, e a condição de parada do comando era "até a fila secar" — que não é condição de parada, porque a fila cresce trabalhando.

Eu tenho a medição. Numa sessão o backlog cresceu **19 issues líquidas**, das quais umas **13 nasceram dentro de uma revisão de outra coisa**. Cada achado virava trabalho que ninguém tinha decidido fazer. O loop não estava falhando; estava tendo sucesso na coisa errada, que é muito mais difícil de enxergar.

A correção foi limitar o pool em vez da ambição: o que é drenado agora é uma iteração, fixada num momento em que eu estou na sala, e não tudo o que por acaso está marcado como pronto. Isso não limita o backlog. Move o crescimento para um lugar onde um humano precisa olhar, que é o único lugar onde este loop já limitou alguma coisa que é questão de valor e não de aritmética.

### O escopo que foi cortado

O corte é a coisa mais documentada desta plataforma, e é a parte de que eu menos me envergonho.

Este site não foi construído enxuto. Foi construído **cheio e depois cortado**. Teve backend em Lambda, banco, serviço de autenticação, serviço de e-mail, uma função na borda renderizando card social a cada requisição, um serviço de unfurl de link, um modelo de branching com dois ambientes e um app offline-first. Um banco sem nada para guardar. Autenticação sem ninguém para autenticar. Um ambiente de homologação para um site cujo rollback é um merge. Cada uma dessas reversões é um registro numerado que você pode abrir.

O harness foi pelo mesmo caminho. **Dezenove personas viraram sete. Sessenta e nove skills viraram catorze.** Cada corte carrega data e motivo.

Não vou fingir que cortar é heroico. É o que acontece quando você finalmente pergunta a um componente para que ele serve *aqui*, e ele não tem resposta.

### O labirinto que eu já tinha decorado

Não vou nomear ninguém, e não há o que nomear: o ponto é justamente que eles pararam de se distinguir.

Já escrevi sobre isso, então fico no formato. O trabalho que eu vinha fazendo tinha chegado num lugar onde cada engajamento novo rimava com o anterior — mesmos problemas de integração, mesmas formas organizacionais, mesmas soluções, e um crescimento técnico que eu já não sentia. Foi isso que me mandou procurar outro tipo de problema, e é por isso que existe um site aqui.

Isso é a descrição de um teto, não uma reclamação sobre alguém. Os labirintos estavam ótimos. Eu é que tinha decorado o labirinto.

### O pager que não existe

Essa é a única imagem cujo referente é uma **ausência** em vez de um mecanismo — e a ausência é deliberada e já está publicada na minha página de arquitetura, então não estou confessando nada aqui.

Nada neste site aciona ninguém. Não tem monitor de disponibilidade, não tem rastreador de erro olhando o navegador do leitor, não tem log de acesso. Um site estático servido de um bucket quase não tem o que te acordar, e montar um aparato de plantão para isso seria fantasia.

O que existe no lugar é um arquivo, `iac/budget.tf`, que define um teto para a conta inteira e me manda e-mail quando o gasto passa dele. É o único vigia contínuo do sistema. Ele não canta às três; ele manda carta. E é a coisa que teria pego as ACLs mortas lá de cima meses antes, que é exatamente por que ele está lá agora.

### A única sem nada por trás

O outro repete um verso três vezes: *"we were shipping blind"* — a gente publicava às cegas.

É a única imagem do conjunto sem mecanismo embaixo, e eu quero ser direto sobre isso, porque o resto desta peça não valeria nada se eu deixasse um bom verso de fechamento fazer uma afirmação falsa.

Não é uma descrição desta plataforma. Tudo lá em cima existe precisamente para que aquela frase não seja verdade aqui: gates que recusam, hooks que negam um comando antes de ele rodar, um inventário que deixa um build vermelho quando ele para de ser exato.

**Repare no tempo verbal.** *Were.* É a condição contra a qual o aparato inteiro foi construído — o estado ordinário de muito trabalho de software, o meu incluído, por um bom tempo. Esse estado é da profissão, não é veredito sobre ninguém que está nela, e muito menos sobre as pessoas ao lado de quem eu fiz aquele trabalho.

O motivo de ele estar no fim é que é para isso que serve um refrão. Você não constrói gate porque é cuidadoso de temperamento. Você constrói porque lembra de como era sem eles.

## O que eu levaria daqui

Não a paródia — você nem está lendo ela. Leve o exercício.

Alguma coisa te entrega um texto de máquina meio bobo sobre o seu próprio trabalho, e ele acerta. A pergunta útil nunca é *isso está bom* — é **a que cada imagem se refere**. Catorze delas, e passar por elas uma a uma revelou uma doc que esteve errada por seis dias, uma fatura de infraestrutura que eu achava ter apagado, um detector de drift com um buraco que eu tinha documentado e depois parado de pensar sobre, e um backlog que crescia por estar sendo trabalhado.

O modelo forneceu o formato. A auditoria é o que fez aquilo valer o seu tempo, e a auditoria não é coisa que um modelo faça por você, porque os referentes estão nos seus repositórios, nas suas faturas e na sua memória.

Então — passe alguma coisa que você fez por um formato que você não inventou, e depois vá conferir o que ele afirma sobre você, item por item. Eu ia gostar bastante de saber o que cai fora. **Qual das catorze lá em cima é uma terça-feira na sua semana, e qual é o arquivo que você vem adiando abrir?**

Boa sorte por aí, e que o seu raio seja estreito.
