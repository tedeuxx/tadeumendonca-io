_Vaga-alvo: **AI Engineer** (GenAI aplicada / agentic — não pesquisa em ML)._

Esse é o meu ramp-up em público. Sou arquiteto de aplicações cloud (AWS, 17 anos entre SDLC e sistemas distribuídos) migrando para AI Engineering — e esta página é o plano que montei pra mim, o raciocínio por trás dele, e as fontes exatas que estou usando. Publico porque a maior parte do conteúdo de "como virar AI Engineer" é ou gatekeeping de PhD em ML ou thread de hype, e nenhum dos dois me ajudou.

Aviso honesto: isso é um plano em andamento, não uma volta olímpica. Estou no meio da transição. Pega o que servir, ignora o resto.

---

## 1. Primeiro, acerte a categoria

"AI Engineer" e "ML Engineer" são trabalhos diferentes que dividem uma palavra. Perdi tempo antes de enxergar isso com clareza.

- **Trilha ML / Data Science:** treinar e fazer fine-tuning de modelos, SageMaker, PyTorch, diffusion/LoRA, sistemas de recomendação e antifraude. É um trabalho de verdade. **Não** é o que eu quero.
- **Trilha GenAI aplicada / Agentic:** construir aplicações *em cima de* foundation models — agentes, tool-calling, RAG, avaliação, orquestração — e colocar isso em produção com rigor. É essa a trilha.

Li vagas de agentic em fintechs e marketplaces brasileiros e em startups AI-native americanas. Elas quase nunca pedem pra treinar modelo. Pedem agentes, avaliação, observabilidade, gestão de prompt/contexto e cabeça de sistemas distribuídos. Esse é o perfil-alvo — filtre seu estudo por ele.

O filtro em uma linha: **GenAI aplicada, não pesquisa em ML.**

---

## 2. Se você vem de software, seu histórico é um fosso — não um handicap

O instinto é se sentir atrasado por não ter feito ML. Instinto errado.

"Saber montar um agente" vira commodity rápido — todo mundo que migrar vai aprender. A habilidade escassa é construir agentes com o rigor que falta na maior parte do trabalho com IA: **avaliação, observabilidade, testes, controle de custo, modos de falha, blast radius.** É exatamente o que anos de SDLC e distribuídos te dão.

Então a estratégia inverte o óbvio: não se apoie demais na parte glamourosa de "construir um agente". Se apoie na parte sem glamour, a de produção. É onde um histórico de software ganha e um de ML frequentemente não. As vagas de agentic confirmam — avaliação e observabilidade aparecem com mais constância do que qualquer habilidade de construir modelo.

---

## 3. O método: prática primeiro, e todo tópico entrega algo

Eu não retenho lendo. Retenho construindo. Então o plano tem uma regra só:

**Nenhum tópico termina em resumo. Todo tópico termina num artefato pequeno e publicado.**

O loop:

> estudar um tópico → construir um artefato em Python que use aquilo → publicar (GitHub) → escrever sobre o que aprendi

Um movimento, quatro resultados: você retém (porque construiu), ganha prova (código público), ganha conteúdo, e ganha assunto pra entrevista. Revisão espaçada aqui significa *resolver de novo sem olhar*, não reler.

Se você também não retém lendo passivamente, rouba essa parte. É a decisão de maior alavancagem do plano inteiro.

---

## 4. Os tópicos — cinco pilares

Derivados de vagas reais, não de um currículo genérico. Nessa ordem:

1. **Fundação Python-agentic** — Python + um framework de agentes (LangGraph é o padrão de mercado hoje) + FastAPI/Docker/Git. Se você vem de outra linguagem (eu venho de Java), essa é sua lacuna de verdade. Não os conceitos — a *prova* em Python.
2. **Avaliação + Observabilidade de agentes** — LLM-as-judge, teste A/B de prompt, pipelines de eval; mais tracing, métricas, logging. É o requisito que mais se repete nas vagas, e onde um histórico de software brilha.
3. **RAG + MCP** — embeddings, busca vetorial, recuperação semântica; e o Model Context Protocol pra integração de ferramentas e conectores. MCP ainda é raro em currículo, o que o torna diferencial.
4. **Agentes cloud-native** — rodar agentes em produção numa cloud (no meu caso: AWS Bedrock + AgentCore), com guardrails e defesa contra prompt injection.
5. **Credencial + narrativa** — uma certificação opcional como filtro (estou de olho na AWS Certified Generative AI Developer – Professional), e transformar os artefatos num portfólio público.

Transversais, aplicados em tudo: engenharia de prompt/contexto e rigor puro de SDLC (testes, CI/CD, arquitetura limpa).

Uma nota sobre a certificação: ela é *filtro*, não diferencial. Nenhum time de agentic contrata por certificado — contrata por prova de código. Trate como marco, não como centro.

---

## 5. O roadmap (6–12 meses, uma coisa por vez)

Montado como transição planejada, não como sprint — eu tenho um emprego. Uma cadência que sobrevive a uma semana ruim ganha de um pique que queima. Cada fase entrega um artefato; o mesmo agente evolui entre as fases (mais fácil de construir e mais fácil de narrar que cinco demos desconexas).

- **Fase 0 — Setup:** ambiente Python, um repo de portfólio, e escolher o domínio do primeiro agente a partir de trabalho real.
- **Fase 1 — Python-agentic:** construir o primeiro agente de verdade com LangGraph.
- **Fase 2 — Eval + Observabilidade:** instrumentar esse agente — harness de avaliação + tracing/métricas. *(É aqui que o fosso para de ser invisível: o rigor é o artefato, não a biografia.)*
- **Fase 3 — RAG + MCP:** adicionar uma camada de conhecimento e expor uma capacidade como servidor MCP.
- **Fase 4 — Cloud-native:** rodar em produção com guardrails.
- **Fase 5 — Credencial + consolidação:** certificação + portfólio polido + textos.

"Pronto" pra mim significa: 3–4 projetos Python-agentic publicados (cada um com prova de eval/observabilidade), a certificação, alguns textos, e conseguir sustentar uma entrevista técnica sobre design de agente, avaliação e trade-offs.

---

## 6. As fontes que eu realmente uso

Lista real, com links. Livros são a camada canônica/profunda; YouTube é a camada aplicada/explicada; X e Instagram são a camada de fronteira/sinal — onde eu descubro que algo existe, não onde eu aprendo.

### Livros (O'Reilly)

Metade dessa estante ainda está saindo capítulo por capítulo enquanto eu leio. É o campo sendo o que é: esperar o livro pronto é ler indicador atrasado.

- **[AI Engineering](https://www.oreilly.com/library/view/ai-engineering/9781098166298/)** — Chip Huyen. *A* fundação. Centrado em modelo: foundation models, avaliação, prompting, RAG, finetuning, inferência, arquitetura. Se for ler um, leia esse. *(terminado)*
- **[Building Applications with AI Agents](https://www.oreilly.com/library/view/building-applications-with/9781098176495/)** — Michael Albada. Agentes ponta a ponta: design, ferramentas, orquestração, memória, multi-agente, validação, monitoramento, segurança, colaboração humano-agente. *(terminado)*
- **[AI Agents with MCP](https://www.oreilly.com/library/view/ai-agents-with/9798341639546/)** — Kyle Stratis. MCP focado e prático: clients, servers, transports, testar e proteger. *(lendo)*
- **[AI Agents: The Definitive Guide](https://www.oreilly.com/library/view/ai-agents-the/0642572247775/)** — Nicole Koenigstein. Voltado a produção: contratos, governança de ferramentas, design de custo, threat modeling. *(na fila)*
- **[An Illustrated Guide to AI Agents](https://www.oreilly.com/library/view/an-illustrated-guide/9798341662681/)** — Maarten Grootendorst & Jay Alammar. Visual, intuição primeiro: modelos de raciocínio, memória, planejamento, multi-agente, code agents. *(na fila)*
- **[Hands-On Large Language Models](https://www.oreilly.com/library/view/hands-on-large-language/9781098150952/)** — Jay Alammar & Maarten Grootendorst. A camada debaixo do agente: tokens, embeddings, attention, fine-tuning — visual e prático. Mesmos autores do guia ilustrado acima, mas sobre o modelo em vez do agente. *(na fila)*

Os links vão pro catálogo da O'Reilly; ler exige assinatura.

### YouTube

Três pra começar — um por canal, escolhidos pra mostrar por que o canal merece o lugar dele aqui, não porque têm o número maior. Assiste um, e se colar, segue o canal.

**Anthropic** — a explicação curta mais clara que vi do que acontece de fato dentro de um modelo. Não é demo de produto: é um resultado de interpretabilidade, contado em cinco minutos.

https://www.youtube.com/watch?v=rKV5JcALQoQ

**Claude** — a porta de entrada. Se você só conhece o produto de chat, são os dois minutos que reenquadram o Claude como ferramenta que se dirige do terminal.

https://www.youtube.com/watch?v=fl1DSmwQKKY

**Lucas Montano** — PT-BR, e a coisa mais honesta que achei sobre a pergunta que essa página trata: o que sêniores estão de fato fazendo com IA, passando das demos.

https://www.youtube.com/watch?v=P1-8da1GgBg

O resto do que assisto, ranqueado por quanto eu realmente assisto — não por número de seguidor:

- **[Anthropic](https://www.youtube.com/channel/UCrDwWp7EBBv4NwvScIpBDOA)** · **[Claude](https://www.youtube.com/channel/UCV03SRZXJEz-hchIAogeJOg)** · **[Lucas Montano](https://www.youtube.com/channel/UCyHOBY6IDZF9zOKJPou2Rgg)** — os três acima, com folga os canais aos quais eu mais volto.
- **[Kiro](https://www.youtube.com/channel/UCXouiHXUN8mba_K-jn1gqVg)** — IDE agentic, vale assistir mesmo usando outra.
- **[AWS](https://www.youtube.com/channel/UCd6MoB9NC6uYN2grvUNT-Zg)** · **[AWS Developers](https://www.youtube.com/channel/UCT-nPlVzJI-ccQXlxjSvJmw)** · **[AWS Events](https://www.youtube.com/channel/UCdoadna9HFHsxXWhafhNvKw)** — Bedrock e IA cloud-native.
- **[Y Combinator](https://www.youtube.com/channel/UCcefcZRL2oaA_uBNeo5UOWg)** — pra onde o campo está indo, pelo lado de quem constrói.
- **[Dwarkesh Patel](https://www.youtube.com/channel/UCXl4i9dYBrFOabk0xGmbkRA)** — conversas longas com pesquisadores de IA; profundidade e alinhamento.
- **[Chase AI](https://www.youtube.com/channel/UCoy6cTJ7Tg0dqS-DI-_REsA)** · **[Zack the AI Guy](https://www.youtube.com/channel/UCppvQz-ua7Rfi1Ca2qV9nzw)** — walkthroughs práticos de Claude/agentes.
- **[IBM Technology](https://www.youtube.com/channel/UCKWaEZ-_VweaEx1j62do_vQ)** — explicações limpas de quadro branco sobre conceitos centrais.
- **[Matt Pocock](https://www.youtube.com/@mattpocockuk)** · **[bycloud](https://www.youtube.com/channel/UCgfe2ooZD3VJPB6aJAnuQng)** · **[Shaw Talebi](https://www.youtube.com/channel/UCa9gErQ9AE5jT2DZLjXBIdA)** — tutoriais práticos de AI coding e agentes.
- **[Jeff Su](https://www.youtube.com/@JeffSu)** · **[Fireship](https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA)** — IA aplicada ao trabalho e contexto rápido de fronteira.
- **[Brock Mesarich](https://www.youtube.com/@BrockMesarich)** — IA pra quem não é técnico; boa rampa se você está começando do zero.
- **[Systems Made Better](https://www.youtube.com/channel/UCNZd3Osk_AIOxz2aydFYhHg)** — sistemas e automação de workflow com IA.

### X / Twitter

- **[@AnthropicAI](https://x.com/AnthropicAI)** · **[@ClaudeDevs](https://x.com/ClaudeDevs)** · **[@bcherny](https://x.com/bcherny)** (Boris Cherny, Claude Code) — o mais perto da fonte em ferramental de dev agentic.
- **[@OpenAI](https://x.com/OpenAI)** · **[@OpenAIDevs](https://x.com/OpenAIDevs)** — Codex e o outro lado da fronteira.
- **[@rubenhassid](https://x.com/rubenhassid)** · **[@sairahul1](https://x.com/sairahul1)** · **[@tom_doerr](https://x.com/tom_doerr)** — praticantes postando técnicas e ferramentas que valem roubar.
- **[@virattt](https://x.com/virattt)** — IA aplicada a finanças, se esse for seu domínio.
- **[@garrytan](https://x.com/garrytan)** (Garry Tan, YC) — a lente de fundador/investidor sobre onde a IA está indo.
- PT-BR: **[@AkitaOnRails](https://x.com/AkitaOnRails)** (Fabio Akita) · **[@glaucia_lemos86](https://x.com/glaucia_lemos86)** (Glaucia Lemos) — vozes brasileiras de dev indo fundo nisso.

Trate X como sinal, não como verdade — é onde você descobre o que é novo, e daí vai verificar nos livros.

### Instagram

Vídeo curto faz parte de como eu me mantenho atualizado, então deixar de fora seria pose. Mas vou ser direto sobre a proporção: a maior parte do conteúdo de "Claude" no Instagram é isca — *"comenta GUIA que eu te mando minha biblioteca de prompts"* — e boa parte simplesmente erra sobre o que o produto faz. Passei pela minha própria pasta de salvos pra escrever essa seção e joguei fora uns dois terços.

O que sobrou, e por quê:

- **[@lucasmontano](https://www.instagram.com/lucasmontano/)** — PT-BR, a contraparte em formato curto do canal que eu já assisto em formato longo.
- **[@codewithbrij](https://www.instagram.com/codewithbrij/)** — a explicação curta mais clara que vi do Claude Code como sistema em camadas: `CLAUDE.md` → skills → hooks → subagents → plugins. Bate com a arquitetura que eu de fato rodo nos meus repos, e é por isso que eu confio.
- **[@brunobracaioli](https://www.instagram.com/brunobracaioli/)** — PT-BR sobre MCP, e o melhor enquadramento em uma linha que eu li: sem MCP o modelo é um gênio trancado numa sala vazia.
- **[@allesinisgalli](https://www.instagram.com/allesinisgalli/)** — PT-BR, skills do Claude Code, concreto e sem pedir comentário em troca.
- **[@oleg.build](https://www.instagram.com/oleg.build/)** — servidores MCP que valem plugar; útil como varredura do que existe.

Só links, sem embed — de propósito. A regra deste site é que nada de terceiro carrega antes de você pedir: os vídeos acima ficam atrás de um facade que só carrega no clique. O embed do Instagram não oferece isso — o script dele roda no instante em que a página abre — então ele não entra.

### GitHub — as skills e os loops que essas pessoas realmente rodam

As configs e os conjuntos de skills que elas usam, em aberto — só perfis e repos oficiais.

- **[Matt Pocock](https://github.com/mattpocock)** → **[mattpocock/skills](https://github.com/mattpocock/skills)**: skills de Claude Code do `.claude` dele — TDD, guardrails de engenharia, restrições que mantêm o AI coding honesto.
- **[Garry Tan](https://github.com/garrytan)** → **[gstack](https://github.com/garrytan/gstack)** (stack de agente opinativa, com `skills.md`) e **[gbrain](https://github.com/garrytan/gbrain)** (a memória/"cérebro" do agente dele).
- **[Andrej Karpathy](https://github.com/karpathy)** → o especial: **[nanoGPT](https://github.com/karpathy/nanoGPT)**, **[llm.c](https://github.com/karpathy/llm.c)**, **[nanochat](https://github.com/karpathy/nanochat)**, **[minGPT](https://github.com/karpathy/minGPT)** — a melhor forma gratuita de entender de verdade o que roda por baixo.

---

## 7. A parte honesta

Eu não coloquei agentes em produção em escala, e não vou fingir que sim. O que estou construindo é um loop de desenvolvimento que transforma técnicas AI-native em software pronto pra produção — e a prova pública desse loop, conforme ele acontece.

Se você é engenheiro de software olhando pra essa transição: seu histórico não é um déficit a superar, é o que te torna raro nessa trilha. Construa em público, entregue pequeno, e deixe os artefatos argumentarem por você.
