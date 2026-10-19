# Social pair — "My Commitment"

Article: https://tadeumendonca.io/en/blog/my-commitment · https://tadeumendonca.io/pt/blog/meu-compromisso
Content Issue: #668 (the reconstruction). The article itself was published on 2026-07-26.

**This record was written on 2026-10-19, months after publication, by reading what is live. Nothing in it
was written when the posts went out.** On 2026-10-19 the main session searched both networks in a browser.
The X thread was found and its text copied as rendered; that copy is the body below, and it is sound as of
that day. No LinkedIn post was found, so the LinkedIn section carries no body. What a live post cannot
tell anyone is the reasoning behind it — why these hashtags, why a thread, what was cut, what the length
limit forced — so each of those is listed under *Gaps* and left open. No edit marker was observed on X;
if one had been, only the current text would be recorded here.

## Links, as shipped

The X link is recorded as it shipped and is not normalised. It predates the share-link convention of
2026-09-19 (`published-voice` rule 21, recorded in ADR-0038 by the amendment merged in #666), which makes
the shared link the locale-neutral URL. This one is the English edition URL.

- X renders the link as the `t.co` URL `https://t.co/8NLqS5SnBc`, whose display text is
  `tadeumendonca.io/en/blog/my-commitment`. The body below carries the URL as the main session transcribed
  it, in full; the `t.co` destination itself was not resolved.

## LinkedIn — NOT FOUND

No post found. No body, no URL.

- Searched: 2026-10-19, by the main session, in a browser.
- Where: the owner's LinkedIn activity feed (`recent-activity/all`), expanded until it reached items more
  than a year old; and the profile's articles tab, which is empty. The loaded items jump from about one
  month old to about five months old, with nothing in between, so nothing in the feed falls in this
  article's launch window. A search of the loaded items for the article's slugs and for
  `tadeumendonca.io` found no post for this article.
- This record does not say why the post is absent. That is a gap, below.

## X — English, a thread of three posts

- URL (thread head): https://x.com/tedeuxx/status/2081538235193307424
- Date the network shows: 2026-07-27T00:32:43Z, on all three posts
- Edited: no edit marker observed
- Read: 2026-10-19, by the main session, in a browser

### Post 1 of 3

URL: https://x.com/tedeuxx/status/2081538235193307424

```text
I'm making my transition into AI Engineering in the open.

First post is a short manifesto — "My Commitment." The honest version, not the hype one. 🧵
```

### Post 2 of 3

URL: https://x.com/tedeuxx/status/2081538237151981922

```text
I won't claim years of agentic experience I don't have. My hands-on AI work is months old, and I say so.

What I bring instead is ~two decades of SDLC and distributed systems: the production rigor (eval, observability, cost, failure modes) most AI work skips.
```

### Post 3 of 3

URL: https://x.com/tedeuxx/status/2081538239047852032

```text
There's no master of AI yet. The field is too young. So I write as a peer, learning alongside you, experimenting out loud.

Everything public and reproducible. The code is the argument.

https://tadeumendonca.io/en/blog/my-commitment

#AIEngineering #BuildInPublic
```

## Character counts

Measured on 2026-10-19 with the command below, run from the repository root. X counts any URL as 23
characters, so the weighted figure substitutes that weight for the link. There is no LinkedIn body to
count.

```
python3 -c "
import re
t = open('docs/social/my-commitment.md', encoding='utf-8').read()
for n in (1, 2, 3):
    x = t.split('### Post %d of 3\n' % n, 1)[1].split('\`\`\`text\n', 1)[1].split('\n\`\`\`', 1)[0]
    print('x post', n, '| raw', len(x), '| weighted', len(re.sub(r'https?://\S+', 'x' * 23, x)))
"
```

```
x post 1 | raw 149 | weighted 149
x post 2 | raw 259 | weighted 259
x post 3 | raw 264 | weighted 241
```

The command counts code points, so the emoji at the end of post 1 counts as one; X's own weighting of
emoji is not reproduced here.

## Gaps

None of these has an artifact behind it, so none is answered:

- whether a LinkedIn post for this article ever existed, and if so, where it is;
- why the X launch went out as a thread of three rather than one post;
- why the X thread carries two hashtags (ADR-0038 §C, as it reads today, records no hashtags on X; when
  that judgement first applied relative to this thread is not checked here);
- what was cut from the thread, and whether the 280-character limit forced any cut;
- which article URL the `t.co` link resolves to (its display text is recorded above; it was not followed).
