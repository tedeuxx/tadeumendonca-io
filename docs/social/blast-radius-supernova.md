# Social pair — "Blast Radius Supernova"

Article: https://tadeumendonca.io/en/blog/blast-radius-supernova · https://tadeumendonca.io/pt/blog/blast-radius-supernova
Content Issue: #668 (the reconstruction). The article itself was published on 2026-08-28.

**This record was reconstructed on 2026-10-19, from the live posts, after publication. It was not written
when the posts went out.** On 2026-10-19 the main session opened both posts in a browser and copied their
text as the networks rendered it; the bodies below are that copy, unedited. So the words are sound as of
that day. What no reading of a live post can recover is the reasoning behind it: why these hashtags, what
was cut, what the length limit forced. Every such question is listed under *Gaps* as a gap and left
unanswered. **LinkedIn marks its post as edited**, so the LinkedIn body here is the post's current text,
not necessarily the text it was published with.

## Links, as shipped

Both posts are recorded with their links exactly as rendered. They predate the share-link convention of
2026-09-19 (`published-voice` rule 21, recorded in ADR-0038 by the amendment merged in #666), which makes
the shared link the locale-neutral URL. Nothing here normalises them to it.

- LinkedIn renders each link as a LinkedIn-shortened `lnkd.in` URL, one in each language block. Their
  destinations were not resolved, so this record does not say which article URL they point at.
- X renders its link as a `t.co` URL with a link card titled "Blast Radius Supernova · tadeumendonca.io".
  Its destination was not resolved either.

## LinkedIn — bilingual, English first

- URL: https://www.linkedin.com/feed/update/urn:li:activity:7499043068365479936/
- Date the network shows: Aug 28 (2026)
- Edited: yes — LinkedIn shows "Edited"
- Link card: "Blast Radius Supernova · tadeumendonca.io"
- Read: 2026-10-19, by the main session, in a browser

Body, verbatim (a fenced block, so that line breaks and characters stay exactly as copied):

```text
🇧🇷 A versão em português está no final deste post.

I like Champagne Supernova, by Oasis. I have had it on while working more times than I can count.

This week I asked Claude for a version of it about my own work: the harness I build on weekends, the loop that publishes this site, and the very specific kind of grief that comes with running agents against your own repositories.

It worked. It scanned, it rhymed, and it made me laugh on a weeknight.

Then I did the only thing I know how to do with a claim on this site — I went image by image and checked what each one actually referred to, in two repositories the model has never opened. That check is what turned a screenshot into an article, and the reason is inside it.

The parody is in there in full — three verses, a chorus, a bridge, an outro, in English, because meter and rhyme do not survive a translation. The form is Oasis's and is named as such; the lines are Claude's, written to my instruction. None of it fits here: it is in the article, and it is meant to be read there.

Take something you made, put it through a shape you did not invent, and then go and check what it claims about you, one item at a time. I would genuinely like to know what falls out.

https://lnkd.in/deCX_mZv

#AgenticDevelopment #HarnessEngineering #AIDLC #ClaudeCode #BuildInPublic

———

🇧🇷 Versão em português

Eu gosto de Champagne Supernova, do Oasis. Já trabalhei ouvindo isso mais vezes do que consigo contar.

Nesta semana eu pedi ao Claude uma versão daquilo sobre o meu próprio trabalho: o harness que eu construo nos fins de semana, o loop que publica este site, e aquele sofrimento bem específico de rodar agentes contra os seus próprios repositórios.

Deu certo. Escandiu, rimou, e me fez rir numa noite de semana.

Aí eu fiz a única coisa que eu sei fazer com uma afirmação neste site: fui imagem por imagem conferir a que cada uma se referia de verdade, em dois repositórios que o modelo nunca abriu. Foi essa conferência que transformou um print num artigo, e o porquê está lá dentro.

A paródia inteira está lá — três versos, refrão, ponte e outro, em inglês, porque métrica e rima não sobrevivem a uma tradução. A forma é do Oasis e está nomeada como tal; os versos são do Claude, escritos sob instrução minha. Nenhum pedaço dela cabe aqui: ela está no artigo, e é para ser lida lá.

Pega uma coisa que você fez, passa ela por um formato que você não inventou, e depois vai conferir o que aquilo afirma sobre você, item por item. Eu ia gostar bastante de saber o que cai fora.

https://lnkd.in/gGw-suFt
```

## X — English, single post

- URL: https://x.com/tedeuxx/status/2093277572108804249
- Date the network shows: 2026-08-28T10:00:39Z
- Edited: no edit marker observed
- Link card: "Blast Radius Supernova · tadeumendonca.io"
- Read: 2026-10-19, by the main session, in a browser

Body, verbatim:

```text
I like Oasis's Champagne Supernova. I asked Claude for a version about my own work. It worked: it scanned, and it made me laugh.

Then I checked what each image referred to, in repos it never saw. That check is the piece.

The parody is in there, whole. https://t.co/1keQAm1RDP
```

## Character counts

Measured on 2026-10-19 with the command below, run from the repository root. LinkedIn counts every
character. X counts any URL as 23 characters, so the weighted X figure substitutes that weight for each
link. The LinkedIn blocks are split on the `———` line; the first block includes the English link and the
hashtag line, the second includes the Portuguese link.

```
python3 -c "
import re
t = open('docs/social/blast-radius-supernova.md', encoding='utf-8').read()
def body(h): return t.split(h + '\n', 1)[1].split('\`\`\`text\n', 1)[1].split('\n\`\`\`', 1)[0]
li = body('## LinkedIn — bilingual, English first')
a, b = li.split('\n———\n')
print('linkedin whole', len(li), '| blocks', len(a.strip()), len(b.strip()))
x = body('## X — English, single post')
print('x raw', len(x), '| x weighted', len(re.sub(r'https?://\S+', 'x' * 23, x)))
"
```

```
linkedin whole 2564 | blocks 1327 1230
x raw 277 | x weighted 277
```

The whole LinkedIn post sits at about 85% of the 3,000-character ceiling. The X link is a `t.co` URL
that is itself 23 characters long, so the raw and weighted figures are the same.

## Gaps

None of these has an artifact behind it, so none is answered:

- why the LinkedIn post carries these five hashtags, and the X post none;
- what, if anything, the LinkedIn edit changed, and when it was made;
- what was cut from either post, and whether a length limit forced any cut;
- why the LinkedIn Portuguese block carries its own link and no hashtag line;
- which article URL each `lnkd.in` and `t.co` link resolves to.
