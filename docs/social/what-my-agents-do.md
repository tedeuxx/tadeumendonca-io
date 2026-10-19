# Social pair — the September launch of "How to run your Claude Code/Codex/Kiro like an AI-native company"

Article: https://tadeumendonca.io/en/blog/what-my-agents-do · https://tadeumendonca.io/pt/blog/o-que-os-meus-agentes-fazem
Content Issue: #668 (the reconstruction). The article itself was published on 2026-09-18.

This file records the **launch** posts. The October addendum posts are a different pair, recorded in
`what-my-agents-do-addendum.md`, which this file does not touch.

**Reconstructed on 2026-10-19 from the live posts — this is not a record written at publication.** On
that day the main session read both posts in a browser and copied their text as rendered, and the bodies
below are that copy. The text can be trusted as of that reading. The decisions behind it cannot be
recovered from a live post: why these hashtags, what was cut, what the length limit forced. Those are
listed under *Gaps* and not answered. **LinkedIn shows its post as edited**, so what is recorded here is
the post's current text, which may differ from what was first published.

## Links, as shipped

Both links are recorded as rendered, not normalised. These posts predate the share-link convention as it
was recorded: `published-voice` rule 21 dates the ruling 2026-09-19, and the ADR-0038 amendment that
records it merged on 2026-09-20 (#666). Both posts show the date 2026-09-19 too, so whether they went out
before or after the ruling that same day is not established here — see *Gaps*.

- LinkedIn renders its link as a LinkedIn-shortened `lnkd.in` URL, which was not resolved. The link card
  under the post points at `https://tadeumendonca.io/en/blog/what-my-agents-do`, the English edition URL,
  not the locale-neutral one.
- X renders its link as a `t.co` URL with a link card titled "How to run your Claude Code/Codex/Kiro like
  an AI-native company · tadeumendonca.io". Its destination was not resolved.

## LinkedIn — bilingual, English first

- URL: https://www.linkedin.com/feed/update/urn:li:activity:7507086870267465728/
- Date the network shows: Sep 19 (2026)
- Edited: yes — LinkedIn shows "Edited"
- Link card: "How to run your Claude Code/Codex/Kiro like an AI-native company · tadeumendonca.io", pointing at
  `https://tadeumendonca.io/en/blog/what-my-agents-do`
- Read: 2026-10-19, by the main session, in a browser

Body, verbatim (a fenced block, so that line breaks and characters stay exactly as copied):

```text
🇧🇷 Versão em português abaixo.

An org chart of people cannot be re-run in a different shape. An org chart of agents can.

Garry Tan, of Y Combinator, breaks an AI-native company into four pieces, and all four are files: the skill file is an employee, and the table that routes the work is the org chart.

"When you sit down with Claude Code or Codex, you're not writing software, you're hiring, training, and managing a workforce made of markdown." — Garry Tan, 2026

I went looking for those four in my own loop — built before I saw the talk — and three of them were already there, under names I had not borrowed from him.

Sixty-nine skills became fourteen, and there are fifteen now. Nineteen agent profiles became six, and there are eight now. A count that only falls tells a story by itself; one that falls and then climbs back tells none at all — and that is exactly the shape that stops being readable when nobody wrote the reason down.

Give the agent the task, correct what comes back, and only then turn that corrected workflow into a skill. The order is the whole trick: you capture after correcting, so the skill is born with the correction already inside it.

The fourth piece did not match. And there is a fifth, underneath the other four, that comes apart for another reason. Both are in the article.

Go and look at your own setup: if you rearranged it tomorrow, would anything written tell you why it was that shape?

— — —

Organograma de pessoas não dá para rodar de novo com outro formato. Organograma de agentes sim.

O Garry Tan, da Y Combinator, quebra uma empresa AI-native em quatro peças, e todas são arquivo: o arquivo de skill é um funcionário, e a tabela que roteia o trabalho é o organograma.

"Quando você senta com o Claude Code ou o Codex, você não está escrevendo software: está contratando, treinando e gerindo uma equipe feita de markdown." — Garry Tan, 2026

Fui procurar essas quatro no meu loop — construído antes de eu ver a palestra — e três já estavam lá, com nomes que eu não tinha pegado emprestado dele.

Sessenta e nove skills viraram quatorze, e hoje são quinze. Dezenove perfis de agente viraram seis, e hoje são oito. Uma contagem que só cai conta uma história sozinha; uma que cai e depois sobe não conta nenhuma — e é exatamente aí que deixa de ser legível se ninguém escreveu o porquê.

Dá a tarefa pro agente, corrige o que voltou, e só aí transforma aquele fluxo corrigido numa skill. A ordem é o truque inteiro: você captura depois de corrigir, para a skill já nascer com a correção dentro.

A quarta peça não bateu. E tem uma quinta, embaixo das outras quatro, que desmonta por outro motivo. As duas estão no artigo.

Vá olhar o seu setup: se você rearranjasse ele amanhã, teria algo escrito dizendo por que ele estava naquele formato?

https://lnkd.in/djHbWzuy

#ContextEngineering #HarnessEngineering #AgenticDevelopment #ClaudeCode #Codex #Kiro
```

## X — English, single post

- URL: https://x.com/tedeuxx/status/2101321307635753426
- Date the network shows: 2026-09-19T14:43:35Z
- Edited: no edit marker observed
- Link card: "How to run your Claude Code/Codex/Kiro like an AI-native company · tadeumendonca.io"
- Read: 2026-10-19, by the main session, in a browser

Body, verbatim:

```text
An org chart of people cannot be re-run in a different shape. One made of files can.

I ran Garry Tan's breakdown of an AI-native company against a loop I had built before I ever saw the talk. Three of its four pieces matched. https://t.co/LiFaCMNTOD
```

## Character counts

Measured on 2026-10-19 with the command below, run from the repository root. LinkedIn counts every
character. X counts any URL as 23 characters, so the weighted X figure substitutes that weight for each
link. The LinkedIn blocks are split on the `— — —` line; the second block includes the link and the
hashtag line, which trail the Portuguese half.

```
python3 -c "
import re
t = open('docs/social/what-my-agents-do.md', encoding='utf-8').read()
def body(h): return t.split(h + '\n', 1)[1].split('\`\`\`text\n', 1)[1].split('\n\`\`\`', 1)[0]
li = body('## LinkedIn — bilingual, English first')
a, b = li.split('\n— — —\n')
print('linkedin whole', len(li), '| blocks', len(a.strip()), len(b.strip()))
x = body('## X — English, single post')
print('x raw', len(x), '| x weighted', len(re.sub(r'https?://\S+', 'x' * 23, x)))
"
```

```
linkedin whole 2904 | blocks 1434 1461
x raw 250 | x weighted 250
```

The whole LinkedIn post sits at about 97% of the 3,000-character ceiling. The X link is a `t.co` URL
that is itself 23 characters long, so the raw and weighted figures are the same.

## Gaps

None of these has an artifact behind it, so none is answered:

- why the LinkedIn post carries these six hashtags, and the X post none;
- what, if anything, the LinkedIn edit changed, and when it was made;
- what was cut from either post, and whether a length limit forced any cut;
- whether the posts went out before or after the share-link ruling of 2026-09-19, which carries the same
  date;
- which article URL the `lnkd.in` and `t.co` links resolve to (the LinkedIn card's URL is recorded above;
  the in-body link was not followed).
