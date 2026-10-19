# Social pair — "From cloud to AI, on the same badge"

Article: https://tadeumendonca.io/en/blog/from-cloud-to-ai-same-badge · https://tadeumendonca.io/pt/blog/da-cloud-a-ia-com-o-mesmo-cracha
Content Issue: #668 (the reconstruction). The article itself was published on 2026-08-21.

**Reconstructed on 2026-10-19 by reading the live networks — not written at publication.** That day the
main session searched both networks in a browser. The X post was found and its text copied as rendered;
the body below is that copy, and it holds as of that reading. No LinkedIn post was found, so the LinkedIn
section has no body. The reasoning behind the X post — why no hashtags, what was cut, what 280 characters
forced — is not recoverable from the post itself, and each such question is listed under *Gaps* as open.
No edit marker was observed on X; where a network marks a post edited, a record like this one can only
hold its current text.

## Links, as shipped

The X link is recorded as rendered and is not normalised. It predates the share-link convention of
2026-09-19 (`published-voice` rule 21, recorded in ADR-0038 by the amendment merged in #666), which makes
the shared link the locale-neutral URL.

- X renders the link as the `t.co` URL `https://t.co/3kcqkjxukj` with a link card titled "From cloud to
  AI, on the same badge · tadeumendonca.io". Its destination was not resolved, so this record does not say
  which article URL it points at.

## LinkedIn — NOT FOUND

No post found. No body, no URL.

- Searched: 2026-10-19, by the main session, in a browser.
- Where: the owner's LinkedIn activity feed (`recent-activity/all`), expanded until it reached items more
  than a year old; and the profile's articles tab, which is empty. The loaded items jump from about one
  month old to about five months old, with nothing in between, so nothing in the feed falls in this
  article's launch window. A search of the loaded items for the article's slugs and for
  `tadeumendonca.io` found no post for this article.
- This record does not say why the post is absent. That is a gap, below.

## X — English, single post

- URL: https://x.com/tedeuxx/status/2091489407236772139
- Date the network shows: 2026-08-23T11:35:07Z
- Edited: no edit marker observed
- Link card: "From cloud to AI, on the same badge · tadeumendonca.io"
- Read: 2026-10-19, by the main session, in a browser

Body, verbatim (a fenced block, so that line breaks and characters stay exactly as copied):

```text
In 2021 I joined AWS for cloud and Terraform every day. I got exactly that, for years.

The conversation now is AI, same badge. Not my main activity on projects — why I turned that way is the piece.

In a few years this may look clumsy. Still typing? https://t.co/3kcqkjxukj
```

## Character counts

Measured on 2026-10-19 with the command below, run from the repository root. X counts any URL as 23
characters, so the weighted figure substitutes that weight for the link. There is no LinkedIn body to
count.

```
python3 -c "
import re
t = open('docs/social/the-problem-stopped-changing.md', encoding='utf-8').read()
x = t.split('## X — English, single post\n', 1)[1].split('\`\`\`text\n', 1)[1].split('\n\`\`\`', 1)[0]
print('x raw', len(x), '| x weighted', len(re.sub(r'https?://\S+', 'x' * 23, x)))
"
```

```
x raw 274 | x weighted 274
```

The `t.co` link is itself 23 characters long, so the raw and weighted figures are the same.

## Gaps

None of these has an artifact behind it, so none is answered:

- whether a LinkedIn post for this article ever existed, and if so, where it is;
- why the X post went out on 2026-08-23, two days after the article's publication date;
- what was cut from the X post, and whether the 280-character limit forced any cut;
- which article URL the `t.co` link resolves to.
