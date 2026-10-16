# Social pair — the dated addendum to "How to run your Claude Code/Codex/Kiro like an AI-native company"

Content Issue: #732 (AC 12)

**DRAFT — DO NOT POST.** Ask-first: post only after the owner approves this copy explicitly, and only
after the merge carrying the addendum is live. Record both live post URLs on #732 once posted.

Share URL: `https://tadeumendonca.io/blog/what-my-agents-do` — the locale-neutral address, as AC 12
requires (`published-voice` rule 21). Its precondition was checked on 2026-10-15 against production by
comparing the served canonical with the requested path, with a control:

```
curl -s https://tadeumendonca.io/blog/what-my-agents-do | grep -oE 'rel="canonical" href="[^"]*"'
# -> rel="canonical" href="https://tadeumendonca.io/blog/what-my-agents-do"   the article, self-canonical
curl -s https://tadeumendonca.io/blog/zzz-not-a-page | grep -oE 'rel="canonical" href="[^"]*"'
# -> rel="canonical" href="https://tadeumendonca.io/en"                         the control, a soft-404
```

Re-run it at posting time. **Open at posting time, not decided here:** whether to tag the URL with the
per-network campaign (`utm_source=linkedin|x&utm_medium=social&utm_campaign=author-post`, as the
previous pair did). `content-publishing` asks for the tag, and also asks that the tagged form be
confirmed to unfurl with the right card first; that check has not been run for this address.

Before posting: fetch the canonical URL and confirm its `og:image` returns 200 and is this article's
card. The front matter is unchanged, so the card should be the one already published.

## LinkedIn — DIGEST — bilingual, English first

🇧🇷 Versão em português abaixo.

For me, as a software engineer, these are not capabilities of a project. They are capabilities of how I work.

In September I published a piece on running Claude Code, Codex and Kiro like an AI-native company, with a drawing of my loop. The article stays as it was: a record of when I published it. It now carries a dated addendum, because part of that drawing is no longer true — and one sentence in it was already wrong on the day it went out.

What moved is where the method lives. It used to travel as a plugin. Now it is installed from my workstation, at user level, and the projects only follow.

Why: each person works differently, unless the organisation imposes a way of working on us. That is why I needed to rehearse the organisations' way of working with myself. And perimeter defence: my workstation must set the rules of the game.

On your machine, where is the line: what belongs to the project, and what belongs to how you work?

— — —

🇧🇷 Português

Para mim, como engenheiro de software, não são capacidades de projeto. São capacidades de como eu trabalho.

Em setembro eu publiquei um texto sobre rodar Claude Code, Codex e Kiro como uma empresa AI-native, com o desenho do meu loop. O artigo fica como estava: um registro de quando eu publiquei. Agora ele tem um adendo datado, porque parte daquele desenho deixou de ser verdade — e uma frase dele já estava errada no dia em que saiu.

O que mudou foi onde o método mora. Ele viajava como plugin. Agora ele é instalado a partir da minha workstation, no nível do usuário, e os projetos só seguem.

Por quê: cada pessoa trabalha diferente, a não ser que a organização nos imponha uma forma de trabalho. Por isso eu precisava ensaiar comigo mesmo a forma das organizações. E defesa em perímetro: a minha workstation deve ditar as regras do jogo.

Na sua máquina, onde fica a linha: o que é do projeto, e o que é de como você trabalha?

https://tadeumendonca.io/blog/what-my-agents-do

#ContextEngineering #HarnessEngineering #AgenticDevelopment #AIEngineering #ClaudeCode #AIDLC

## X — DIGEST — English, single post

For me, as a software engineer, these are not capabilities of a project. They are capabilities of how I work. My September piece on running agents like an AI-native company now has a dated addendum: what changed, and why.

https://tadeumendonca.io/blog/what-my-agents-do

#AIEngineering

## Character counts

Measured on 2026-10-15 with the command below, run from the repository root. LinkedIn counts every
character; X counts any URL as 23, so the X figure substitutes that weight for the link.

```
python3 -c "
import re
t = open('docs/social/what-my-agents-do-addendum.md', encoding='utf-8').read()
li = t.split('## LinkedIn — DIGEST — bilingual, English first\n', 1)[1].split('\n## X', 1)[0].strip()
en, pt = li.split('\n— — —\n')
print('linkedin whole', len(li), '| blocks', len(en.strip()), len(pt.strip()))
x = t.split('## X — DIGEST — English, single post\n', 1)[1].split('\n## ', 1)[0].strip()
print('x raw', len(x), '| x weighted', len(re.sub(r'https?://\S+', 'x' * 23, x)))
"
```

```
linkedin whole 2077 | blocks 976 1092
x raw 286 | x weighted 262
```

The second LinkedIn block includes the link and the hashtag line, which trail the Portuguese half. The
whole LinkedIn post sits at about 69% of the 3,000-character ceiling; X sits under its 280 limit only
because the link is weighted at 23.
