# Social pair — "Build your first AI app: track your investments on your phone using only natural language."

Article: https://tadeumendonca.io/en/blog/build-your-first-ai-app · https://tadeumendonca.io/pt/blog/crie-seu-primeiro-ai-app

Content Issue: #712 · release: #787

**Posted 2026-10-30**, both networks, the text below verbatim as the owner approved it:

- LinkedIn: https://www.linkedin.com/feed/update/urn:li:activity:7522059323364151296/
- X: https://x.com/tedeuxx/status/2116293893910094119

Recorded on #712: https://github.com/tedeuxx/tadeumendonca-io/issues/712#issuecomment-6534703775

Share URL: `https://tadeumendonca.io/blog/build-your-first-ai-app` — the locale-neutral address
(`published-voice` rule 21). Its precondition was checked on 2026-10-30 against production by comparing
the served canonical with the requested path, with a control:

```
curl -s https://tadeumendonca.io/blog/build-your-first-ai-app | grep -oE 'rel="canonical" href="[^"]*"'
# -> rel="canonical" href="https://tadeumendonca.io/blog/build-your-first-ai-app"   the article, self-canonical
curl -s https://tadeumendonca.io/blog/zzz-not-a-page | grep -oE 'rel="canonical" href="[^"]*"'
# -> rel="canonical" href="https://tadeumendonca.io/en"                              the control, a soft-404
```

The card was checked the same day: the neutral URL declares
`og:image` = `https://tadeumendonca.io/og/build-your-first-ai-app.en.png`, which returns `200 image/png`.
Re-run both checks at posting time.

**Open at posting time, not decided here** (each outcome recorded below its item):

- **UTM tag.** Whether to tag the URL per network
  (`utm_source=linkedin|x&utm_medium=social&utm_campaign=author-post`). `content-publishing` asks for the
  tag, and also asks that the tagged form be confirmed to unfurl with the right card first; that check has
  not been run for this address. Same open item as the previous pair.
  **Outcome:** both posts went out with the untagged URL, no UTM tag.
- **The sample app link.** The posts name the sample (real tickers, made-up amounts, not investment
  advice) but do not carry its URL, https://claude.ai/artifact/DEdZjPSNRGYXA2UdbcPMzn. A second link in
  the body may change which link the network unfurls into the card, and that has not been measured. It
  also keeps the click on the article, where the sample sits beside the four checks and the
  prerequisites. If the owner wants it in the post, add it below the article link, never above it.
  **Outcome:** both posts went out without the sample app link, verbatim as the owner approved.

## LinkedIn — DIGEST — bilingual, English first

🇧🇷 Versão em português abaixo.

Money spread across several apps, and not one of them tells you how much you have in total.

That was me: several institutions, more than one currency, and some with no API and no export. The balance screen on the phone was the only source of truth.

Today there is an investment app on my phone that sits in no app store. One screen: how much I have, how it changed month by month, where the money sits. I did not write a line of it. The agent wrote the page, and the checks on the numbers, only from conversation.

Building it was the easy part. The first price after the market-data app launched came back for the wrong symbol. Nothing crashed. The call returned a price.

The piece has what I built so I never take the agent's word for a number, a sample app with real tickers and made-up amounts (not investment advice), and a prompt to build your own. No code, and the Free plan is enough.

How many apps do you open today to know how much you have?

— — —

🇧🇷 Português

Dinheiro espalhado em vários aplicativos, e nenhum deles responde quanto você tem ao todo.

Era assim comigo: várias instituições, mais de uma moeda, e algumas sem API nem exportação. A tela de saldo no celular era a única fonte de verdade.

Hoje tem um app de investimentos no meu celular que não está em loja nenhuma. Uma tela só: quanto eu tenho, como isso mudou mês a mês, onde o dinheiro está. Eu não escrevi uma linha dele. O agente escreveu a página, e as conferências dos números, tudo a partir de conversa.

Montar foi a parte fácil. A primeira cotação depois que o aplicativo de mercado abriu veio com o símbolo errado. Nada quebrou. A chamada devolveu um preço.

No texto está o que eu montei para nunca aceitar um número só na palavra do agente, um app de exemplo com tickers reais e valores inventados (não é recomendação de investimento), e um prompt para você montar o seu. Sem código, e o plano Free basta.

Quantos aplicativos você abre hoje para saber quanto tem?

https://tadeumendonca.io/blog/build-your-first-ai-app

#AIEngineering #BuildInPublic #AgenticDevelopment #AI

## X — DIGEST — English, single post

Money in several apps, and none shows the total. I built an investment app on my phone only by conversing; I did not write a line of it. The first price came back for the wrong symbol. Nothing crashed. What I built around that:

https://tadeumendonca.io/blog/build-your-first-ai-app

#AIEngineering

## Character counts

Measured on 2026-10-30 with the command below, run from the repository root. LinkedIn counts every
character; X counts any URL as 23, so the X figure substitutes that weight for the link.

```
python3 -c "
import re
t = open('docs/social/build-your-first-ai-app.md', encoding='utf-8').read()
li = t.split('## LinkedIn — DIGEST — bilingual, English first\n', 1)[1].split('\n## X', 1)[0].strip()
en, pt = li.split('\n— — —\n')
print('linkedin whole', len(li), '| blocks', len(en.strip()), len(pt.strip()))
print('first lines', [len(b.strip().split('\n')[2]) for b in (en, pt)])
x = t.split('## X — DIGEST — English, single post\n', 1)[1].split('\n## ', 1)[0].strip()
print('x raw', len(x), '| x weighted', len(re.sub(r'https?://\S+', 'x' * 23, x)))
"
```

```
linkedin whole 2101 | blocks 987 1105
first lines [91, 90]
x raw 298 | x weighted 268
```

The second LinkedIn block includes the link and the hashtag line, which trail the Portuguese half. The
whole post sits at about 70% of the 3,000-character ceiling, about the size of the previous pair
(`published-voice` rule 20). Both first lines finish inside the ~140-character fold, a figure that is
unverified. X sits under its 280 limit only because the link is weighted at 23.
