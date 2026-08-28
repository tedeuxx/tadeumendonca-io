---
title: "Blast Radius Supernova"
slug: blast-radius-supernova
date: '2026-08-28T12:00:00.000Z'
tag: harness
track: engenharia
draft: false
hasVideo: true
excerpt: "Pedi uma paródia de uma música que eu gosto, sobre o meu próprio trabalho. Depois fui imagem por imagem conferir a que cada uma se referia de verdade — e a conferência é o artigo."
takeaway: 'que um prompt e a saída dele não provam nada sozinhos; o que faz a saída valer publicação é ir imagem por imagem e nomear a que cada uma se refere.'
---

Eu gosto de *Champagne Supernova*, do Oasis. A música tem trinta e um anos, o clipe é a banda atravessando uma sala em câmera lenta, e eu já trabalhei ouvindo isso mais vezes do que consigo contar.

**A fonte, logo de cara e em três partes, porque esta peça só funciona se o empréstimo for nomeado com exatidão.** A métrica, o formato e o esquema de rimas são do Oasis — *Champagne Supernova*, de *(What's the Story) Morning Glory?*, 1995. **Os versos são do Claude**, escritos sob instrução minha, em cima daquela forma. **Meus são a ideia, o prompt que você vai ler daqui a pouco, e cada palavra da auditoria que vem depois deles.**

## 1 · A provocação

A ideia não tinha nada de sofisticado. Eu queria uma versão daquela música sobre **o meu trabalho** — o harness que eu construo nos fins de semana, o loop que publica este site, e aquele tipo bem específico de sofrimento que vem de rodar agentes contra os seus próprios repositórios.

Todo o resto deste site é um argumento técnico com recibo embaixo. Isso aqui é o mesmo movimento aplicado à **forma** em vez do assunto: apontei um modelo para um formato fixo que eu não inventei e para o meu próprio material, e aí fiz a parte que torna qualquer coisa disso minha — voltei em cada imagem que ele produziu e perguntei a que aquela imagem se refere de verdade.

Essa segunda metade é o artigo. A primeira é uma terça-feira.

## 2 · O prompt

Foi isto que eu digitei, sem editar, em caixa baixa e com os erros que tinham. Eu converso com o Claude em português, então esta é a coisa como saiu:

> *"qual a letra de champagne supernova oasis? eu gosto desse clip […] quero ter uma versao de champagne supernova relacionada com meu trabalho, meu drama, minha jornada de aprendizado de harness engineering, claude code, etc."*

**Estou mostrando o prompt porque ele é o método, não porque ele é prova.** Um prompt mais a saída dele provam uma coisa: que um modelo produziu texto. Como argumento sobre engenharia isso é circular, e eu não ia gastar o seu tempo com isso.

O que o prompt serve para mostrar é de onde veio o material. "Meu trabalho, meu drama, minha jornada de aprendizado" não é um briefing criativo — é um ponteiro para dois repositórios dentro dos quais eu venho morando há meses, e o modelo nunca viu nenhum dos dois. Ele escreveu os versos. O sofrimento já estava lá, e os arquivos também.

## 3 · O resultado — a paródia

O que voltou foi uma paródia inteira, naquela forma. Escandiu. Me fez rir numa noite de semana. Chama-se *Blast Radius Supernova*, que é de onde esta peça tira o nome.

O clipe está aqui, e é o único motivo de eu ter tido a ideia. Põe pra tocar para o que vem agora — é a forma em que os versos estão sentados:

https://www.youtube.com/watch?v=P5AjSVwZ9H0

Os versos estão em inglês e vão ficar assim: a métrica e a rima são o que eles são, e nenhuma das duas sobrevive a uma tradução.

> [verso 1]  
> Another README no one read  
> Another cluster back from dead  
> Where were you when the pager sang at three?  
> Slowly rolling out the change  
> Faster than the diff can rage  
> Where were you when the plan ate the state?
>
> [refrão]  
> One day they will find me  
> Buried in the rollback  
> With a blast radius wide as the sky  
> One day they will find me  
> Buried in the rollback  
> With a blast radius  
> A blast radius wide as the sky
>
> [verso 2]  
> The hooks fire twice, I don't know why  
> A steering file I swore would die  
> Still loading every time the session starts  
> Slowly rolling out the change  
> Faster than the diff can rage  
> Where were you when the plan ate the state?
>
> [ponte]  
> 'Cause everybody swears  
> they're gonna have it done by summer  
> But you and me, we cut the scope  
> The sprint just keeps turning around  
> and no one knows  
> why, why, why, why
>
> [verso 3]  
> Another client, same old maze  
> Terraform drift for eighteen days  
> Context deadline exceeded in my dreams
>
> [encerramento]  
> We were shipping blind  
> We were shipping blind  
> We were shipping blind  
> (repete até o solo do Weller acabar)

A fonte, repetida uma vez no lugar certo: a métrica, o formato e o esquema de rimas são do Oasis, *Champagne Supernova*, 1995. Os versos acima são do Claude, escritos sob instrução minha.

## 4 · O recibo, uma imagem por vez

**Catorze imagens**, e eu li elas do mesmo jeito que você acabou de ler — com a diferença de que eu sei o que tem atrás de cada uma. Foi essa a reação que transformou isso num artigo em vez de um print, e vou te dar a conta com as exceções em vez de arredondar pra cima. **Doze** têm um arquivo, uma fatura, um commit ou uma medição por trás, nos dois repositórios que produzem este site. **Uma** cai ao lado de uma coisa real em vez de em cima dela. **Uma** não tem nada embaixo, e eu digo qual quando a gente chegar nela.

Um modelo escreveu uma piada sobre o trabalho de um estranho e acertou doze do meu em cheio.

**Essa distância é o punch, e é ela que vale o seu tempo.** Então vamos à auditoria.

O vocabulário vai explicado conforme aparece, porque metade dele é específico do jeito que eu trabalho e nada disso deveria exigir uma ferramenta aberta para acompanhar.

**Três palavras que se repetem.** Um **harness** é o aparato em volta de um agente de código — as regras que ele carrega, as permissões que ele tem, os checks pelos quais ele precisa passar. Um **hook** é um script que o harness executa num momento fixo, tipo logo antes de um comando rodar, e que pode recusar esse comando. Uma **persona** é um subagente com um briefing escrito e um trabalho estreito, despachado para uma tarefa e descartado depois.

### A doc que é lida o tempo todo e consultada nunca

Existe um parágrafo no arquivo de instruções do meu próprio plugin que ficou **errado por três dias** antes de alguém notar — ele apontava para um arquivo que tinha deixado de ser arquivo. Só foi corrigido porque um trabalho não relacionado fez alguém ler aquela frase, e a correção diz isso com todas as letras em vez de consertar a linha caladinho.

A parte interessante não é uma doc ter envelhecido. É que a doc em questão é a que é **carregada em toda e qualquer sessão** — não é um README esquecido numa pasta, é o arquivo que o agente lê primeiro, sempre.

Tenho um segundo caso, pior, de outra semana: escrevi numa guia a regra de que uma lista que enumera coisas falha *em silêncio* quando falta alguma — e a lista seguinte escrita sob aquela regra deixou de fora exatamente o arquivo sobre o qual a regra tinha sido escrita.

E eu te devo a metade feia do primeiro caso. Eu tinha escrito *seis dias* aqui, porque seis dias é o que a própria correção diz, e eu copiei sem conferir. São pouco mais de três dias — `git log` no arquivo apagado, contra o commit que consertou o texto. **Um registro sobre uma afirmação vencida estava carregando um número vencido, e este artigo sobre auditar afirmações reimprimiu ele até alguém rodar de novo.** A contagem lá em cima está medida. O registro ainda precisa ser corrigido.

### A infraestrutura que eu aposentei, e que continuou faturando

Eu não tenho cluster nenhum. Tenho uma coisa que se comporta igual.

Quando eu cortei o backend desta plataforma — inteiro, a camada de API, o banco, a autenticação — a aposentadoria foi limpa no código e **não foi limpa na conta**. Uns **USD 12,80 por mês** continuaram saindo: ACLs de firewall e endereços IP públicos ociosos, parados ali ligados a nada, faturando no cronograma. Descobri lendo a fatura, que é o jeito atrasado de descobrir.

Infraestrutura que você para de usar não para de existir. Ela para de estar *no diff*, que é uma coisa completamente diferente.

### O texto que eu risquei, e que carrega assim mesmo

A imagem é um arquivo que alguém jurou ter matado, e que carrega assim mesmo no início de toda sessão. É esse o mecanismo, e ele é meu.

Um **steering file** é o documento de instruções permanentes que uma ferramenta agêntica carrega antes de fazer qualquer coisa — o negócio que conta pro agente como este projeto funciona. Eu rodo dois harnesses, um no trabalho e um aqui, e os dois têm uma versão disso.

O meu é cheio de texto que eu declarei morto. É uma convenção que eu escolhi e ainda defendo: quando uma regra se revela errada, eu **risco e deixo no lugar**, com data e motivo, porque alguém tomou uma decisão baseada na frase antiga e merece descobrir que ela mudou em vez de descobrir que ela sumiu.

O custo é exato e eu pago toda sessão. Aquele arquivo é carregado no início da sessão, inteiro, com os trechos riscados junto. E ele não está sozinho: num ponto medido, só as descrições da minha biblioteca de skills tinham virado uns **dez mil tokens carregados antes da primeira palavra da tarefa de verdade** — uma decisão que era de graça enquanto nada as carregava, e deixou de ser no instante em que alguma coisa passou a carregar. Esse número foi tirado quando a biblioteca tinha sessenta e nove skills. Hoje ela tem catorze, então o número de hoje é menor, e eu deliberadamente não reescrevi ele: remedir seria trocar um número antigo e conferível por um novo que ninguém além de mim consegue rodar.

Tudo o que eu enterrei continua na sala. De propósito, e não de graça.

### A mudança que sai na velocidade de um clique

Aqui não tem rollout lento. Não tem ambiente de homologação, não tem canário, não tem porcentagem. **Mergear é publicar** — um branch, um destino, e o merge que fecha o pull request é o mesmo ato que coloca a coisa na sua frente.

É uma escolha deliberada e tem um preço declarado, que eu vou repetir em vez de suavizar: o que decide se uma mudança é segura o bastante para mergear sem mim é o mesmo tipo de coisa que escreveu a mudança. Classifique uma errado e ela vai direto pra rua. O que torna isso aceitável não é confiança — é que isto é um site estático e um revert é um merge.

### O plan que não é a rede de segurança que parece

`terraform plan` é o comando que te conta o que está prestes a mudar na sua conta de nuvem antes de mudar. A imagem é um plan que comeu o state — a própria salvaguarda fazendo o estrago. O que eu tenho é o mesmo medo pelo outro lado: um plan que não fala nada.

O referente é um buraco que eu documentei de propósito. A confiança entre o meu pipeline e a AWS — o provedor de identidade e o papel que o pipeline assume — é **criada na mão, fora do Terraform**, e o motivo não é o óbvio.

Existe, sim, um problema de bootstrap, e o meu próprio registro arquiva ele como *"mechanical, and would go away"* (mecânico, e um dia sumiria). O motivo permanente é o outro, e o registro diz com todas as letras que os dois não podem ser colapsados num só: **um papel que consegue reescrever a própria política de confiança não tem teto.** Ele poderia adicionar um sujeito à própria confiança, e a mudança chegaria pelo mesmo caminho automatizado de uma rotineira. A regra que sai disso cabe numa linha, e é o título deste artigo enunciado como restrição — *"The blast radius of an `apply` must not include the authority to perform the next `apply`"* (o raio de destruição de um `apply` não pode incluir a autoridade de fazer o `apply` seguinte).

O preço de segurar essa linha é o ponto cego, e o registro diz qual: se a impressão digital do provedor ou a política de confiança do papel de infra for editada pelo console, nenhum `plan` reclama. A ferramenta que existe para te contar a verdade sobre a sua infraestrutura é estruturalmente cega justo para o pedaço que dá acesso ao resto.

Escrevi isso como limitação em vez de decorar, e continua sendo uma limitação.

### Os dois lugares onde o revert não alcança

Esse é o título, e é o único conceito que eu levaria embora desta peça inteira se só pudesse ficar com um.

**Blast radius** é o quanto do mundo uma mudança consegue danificar se estiver errada. É o dial contra o qual eu calibro todo o resto: quanto planejamento, quanta revisão, se um humano precisa dizer sim. Raio grande recebe cerimônia máxima. Barato-de-reverter recebe velocidade de produto.

Aqui quase tudo tem raio pequeno, e eu digo isso. Mas existem exatamente dois lugares nesta plataforma onde o raio é genuinamente largo, e os dois são largos pelo mesmo motivo — **o desfazer não chega**:

O primeiro é uma URL publicada e o seu card social. O primeiro scraper que busca um artigo novo fixa o título e a imagem que viu. Mude depois e o pino não anda. É por isso que o título e o slug *deste* artigo foram a única coisa que eu não deixei o loop decidir.

O segundo é o histórico do git. Um arquivo commitado num repositório público está commitado; apagar num commit seguinte tira ele da árvore e não do registro. É essa restrição que faz as miniaturas dos vídeos deste site serem desenhadas por mim, no meu próprio design system, em vez de cópias das que o YouTube serve — uma questão de licenciamento que um `git rm` não teria respondido.

Em todo o resto eu consigo desfazer. Nesses dois, "desfazer" é uma palavra que para de funcionar, e é isso que um raio largo é na prática.

### Dois hooks, um comando, toda vez

A imagem tem duas metades e elas caem de jeitos diferentes — hooks disparando duas vezes, e não saber por quê. As duas são verdade sobre mim, e não do mesmo jeito.

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

Até o fim de agosto o meu loop **não tinha iteração nenhuma** — a decisão caiu no dia 24 e o mecanismo mergeou no dia 26. Tinha uma fila e um comando que drenava ela, e a condição de parada do comando era "até a fila secar" — que não é condição de parada, porque a fila cresce trabalhando.

O número está no meu próprio registro de decisão, e foi medido uma vez e nunca mais rodado, que é como você deve pesar ele: numa sessão o backlog cresceu **19 issues líquidas**, das quais umas **13 nasceram dentro de uma revisão de outra coisa**. Cada achado virava trabalho que ninguém tinha decidido fazer. O loop não estava falhando; estava tendo sucesso na coisa errada, que é muito mais difícil de enxergar.

A correção foi limitar o pool em vez da ambição: o que é drenado agora é uma iteração, fixada num momento em que eu estou na sala, e não tudo o que por acaso está marcado como pronto. Isso não limita o backlog. Move o crescimento para um lugar onde um humano precisa olhar, que é o único lugar onde este loop já limitou alguma coisa que é questão de valor e não de aritmética.

### O escopo que foi cortado

O corte é a coisa mais documentada desta plataforma.

Este site não foi construído enxuto. Foi construído **cheio e depois cortado**. Teve backend em Lambda, banco, serviço de autenticação, serviço de e-mail, uma função na borda renderizando card social a cada requisição, um serviço de unfurl de link, um modelo de branching com dois ambientes e um app offline-first. Um banco sem nada para guardar. Autenticação sem ninguém para autenticar. Um ambiente de homologação para um site cujo rollback é um merge. Cada uma dessas reversões é um registro numerado que você pode abrir.

O harness foi pelo mesmo caminho. **Dezenove personas viraram sete. Sessenta e nove skills viraram catorze.** Cada corte carrega data e motivo.

Cortar é o que acontece quando você finalmente pergunta a um componente para que ele serve *aqui*, e ele não tem resposta.

### O labirinto que eu já tinha decorado

Não vou nomear ninguém, e não há o que nomear: o ponto é justamente que eles pararam de se distinguir.

Já escrevi sobre isso, então fico no formato. O trabalho que eu vinha fazendo tinha chegado num lugar onde cada engajamento novo rimava com o anterior — mesmos problemas de integração, mesmas formas organizacionais, mesmas soluções, e um crescimento técnico que eu já não sentia. Foi isso que me mandou procurar outro tipo de problema, e é por isso que existe um site aqui.

Isso é a descrição de um teto, não uma reclamação sobre alguém. Os labirintos estavam ótimos. Eu é que tinha decorado o labirinto.

**Esta é a que eu prometi, a que cai ao lado de uma coisa real em vez de em cima dela.** Não tem arquivo, nem fatura, nem commit embaixo — o que ela aponta é um trecho da minha própria carreira, e o único artefato que ela deixou é este site.

### O pager que não existe

O referente aqui é uma **ausência** em vez de um mecanismo — e a ausência é deliberada e já está publicada na minha página de arquitetura, então não estou confessando nada aqui.

Nada neste site aciona ninguém. Não tem monitor de disponibilidade, não tem rastreador de erro olhando o navegador do leitor, não tem log de acesso. Um site estático servido de um bucket quase não tem o que te acordar, e montar um aparato de plantão para isso seria fantasia.

O que existe no lugar é um arquivo, `iac/budget.tf`, que define um teto para a conta inteira e me manda e-mail quando o gasto passa dele. É o único vigia contínuo do sistema. Ele não canta às três; ele manda carta. E é a coisa que teria pego as ACLs mortas lá de cima meses antes, que é exatamente por que ele está lá agora.

### A única sem nada por trás

A peça termina numa afirmação só, repetida três vezes: que a gente publicava sem conseguir enxergar o que tinha publicado.

É a única imagem do conjunto sem absolutamente nada embaixo, e eu quero ser direto sobre isso, porque o resto desta peça não valeria nada se eu deixasse um bom verso de fechamento fazer uma afirmação falsa.

Não é uma descrição desta plataforma. Tudo lá em cima existe precisamente para que isso não seja verdade aqui: gates que recusam, hooks que negam um comando antes de ele rodar, um inventário que deixa um build vermelho quando ele para de ser exato.

**E o tempo verbal é a coisa toda.** Está escrito como uma coisa que *foi*, não como uma que é — uma condição encerrada e olhada de longe. É contra ela que o aparato lá de cima foi construído: o estado ordinário de muito trabalho de software, o meu incluído, por um bom tempo.

E eu tenho um recibo pequeno e exato de como isso é na prática. Um erro de rota mandou todos os cards sociais por artigo deste site para a rota catch-all, então cada um respondia a qualquer scraper que perguntasse com um `200` e o HTML da home. Bem formado, confiante, errado. Não tinha nada olhando aquele caminho, então nada falou nada, e eu descobri do jeito que a gente sempre descobre — depois, e de fora. O que olha aquilo hoje são os testes unitários da própria função de rewrite e um check pós-deploy de que a função no ar continua sendo a deste repositório, que é o formato de toda correção desta peça: não mais cuidado, e sim uma coisa que falha alto.

O motivo de ele estar no fim é que é para isso que serve um refrão. Você não constrói gate porque é cuidadoso de temperamento. Você constrói porque lembra de como era sem eles.

## O que eu levaria daqui

Não a paródia. Leve o exercício.

Um modelo que nunca abriu os seus repositórios escreve uma piada sobre o seu trabalho, e doze das catorze têm um arquivo, uma fatura, um commit ou uma medição por trás. A pergunta útil nunca é *isso está bom* — é **a que cada imagem se refere**. Catorze delas, e passar por elas uma a uma revelou uma doc que esteve errada por três dias, um número vencido dentro da correção que consertou ela, uma fatura de infraestrutura que eu achava ter apagado, um detector de drift com um buraco que eu tinha documentado e depois parado de pensar sobre, e um backlog que crescia por estar sendo trabalhado.

O modelo escreveu. A auditoria é o que fez aquilo valer o seu tempo, e a auditoria não é coisa que um modelo faça por você, porque os referentes estão nos seus repositórios, nas suas faturas e na sua memória.

**Qual das catorze lá em cima é uma terça-feira na sua semana, e qual é o arquivo que você vem adiando abrir?**

**Então: pega uma coisa que você fez, passa ela por um formato que você não inventou, e vai conferir o que aquilo afirma sobre você — item por item. Me conta o que cai fora.**

Boa sorte por aí, e que o seu raio seja estreito.
