# Funnel-review post record

One line per post the owner publishes under the communication and channel strategy
([requirements document](../tadeumendonca-io-product-requirements-document-communication-channel-strategy.md),
section 8). It records which address each post carried, so the funnel review can match a post to its
sessions, which sprint-07's finding 1 could not (#819). This file is declared in
[`declarations.md`](./declarations.md), which is where the rite reads the baseline rule that counts
over it.

## Format

Column 0, read literally by `apps/fed/scripts/funnel-posts.mjs`. A line that does not start with
`post: ` or `reach: ` is prose and records nothing.

    post: <piece-key> <platform> <post-language> <posted-date> <address> <post-url>
    reach: <post-url> unread
    reach: <post-url> read <YYYY-MM-DD> owner-native-ui <metric> <value>

The template is indented by four spaces so that it records nothing; a real line starts at column 0.

- **`<piece-key>`** is the article's content file stem, the same key `declarations.md` declares.
- **`<platform>`** is `linkedin`, `x` or `youtube`.
- **`<post-language>`** is the language of the post, not of the reader. A text post on LinkedIn or X
  is one bilingual post, written as its opening language first: `pt-en` or `en-pt`. A YouTube Short is
  one language: `pt` or `en`. The language the reader landed in is a different field: it comes from the
  session, in the figures the script prints.
- **`<posted-date>`** is the day the post went out, `YYYY-MM-DD`.
- **`<address>`** is the link the post carried, **verbatim, with its campaign tags**. A LinkedIn or X
  post carries the neutral address `/blog/<en-slug>` (ADR-0052); a YouTube Short carries the edition in
  its own language. Every address carries `utm_campaign=author-post` (owner ruling on #819, ADR-0039);
  a LinkedIn or X address carries `utm_source=<platform>` and `utm_medium=social`.
- **`<post-url>`** is the post's own address on the platform.
- **`reach:`** is the post's native reach (impressions, members reached, views), which exists only
  inside each platform. It is the owner's reading, never a measurement here: `unread` until he reads it,
  then `read <date> owner-native-ui <metric> <value>`, one line per reading. Every post has at least one
  `reach:` line, so a reach nobody has read says so instead of being absent.

`node apps/fed/scripts/funnel-posts.mjs` checks every line against the site and prints the baseline
count. With a collection file as its argument, it also prints the `figure:` lines that match each post
to its sessions; `declarations.md` states the `session-row:` lines it reads.

## Posts

None recorded yet. No piece has shipped under the strategy: the distribution kit that emits the
tagged addresses is #818.
