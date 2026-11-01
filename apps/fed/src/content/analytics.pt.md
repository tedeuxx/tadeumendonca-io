## Antes de qualquer número, o que o número consegue ver

Quando eu leio a analytics de um produto digital, a primeira pergunta não é quantos. É o que cada sinal é capaz de deixar passar. Uma contagem vale o que vale a observação por baixo dela, então eu quero ver a observação antes de ler a contagem.

Então esta página faz o contrário, para este site. Ela não traz nenhum número do GA4 nem gráfico. Ela lista cada evento que o próprio código do site envia do navegador, os parâmetros de cada um, o que ele consegue estabelecer e o que não consegue. A lista é lida do código, não da minha memória: um teste compara os eventos apresentados aqui com os que o [`analytics.ts`](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.ts) emite, nas duas direções. Um evento novo no código sem esta página, ou uma entrada aqui sem código por trás, quebra o build.

## Toda contagem é um piso

Nada chega ao Google antes de você aceitar a analytics. Antes de escolher, se você recusar, e num build sem identificador de medição, a tag nunca é carregada, então o Google não grava cookie nem recebe requisição. Se você aceitar e depois retirar o consentimento, o código deste site não envia mais nada a partir dali. A tag, porém, continua carregada, e o que ela coleta por conta própria, como a medição automática que o GA4 pode ligar numa propriedade, depende de uma configuração do console que este repositório não consegue observar. Essa trava é uma decisão com os motivos registrados na [ADR-0033](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0033-ga4-consent-gated-analytics.md).

A consequência é que quem recusa nunca é contado, e quem bloqueia a tag também não. Todo número que o GA4 guarda sobre os eventos que o código deste site envia é, portanto, um piso, nunca um total, a menos que essa coleta automática conte a mesma coisa uma segunda vez ([ADR-0023](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0023-observability-static-site.md)). Esse é o preço da trava, e eu prefiro pagá-lo a contar quem disse não.

## O único cookie gravado antes de qualquer escolha

Um cookie é gravado em toda página, seja qual for a sua escolha sobre a analytics, e é deste site, não do Google: o `locale_hint`. Guarda `pt` quando o país de onde a sua conexão parece vir fala português, `other` quando não fala, e `unknown` quando nenhum país chegou. Não carrega identificador nem outra localização. Cada página aberta renova o cookie por uma hora.

## Emitido não é o mesmo que consultável

Esta página descreve o que o site **emite**. Essa parte este repositório conhece, porque é o código. O que dá para **consultar** no GA4 é outro fato: só dá para segmentar por um parâmetro depois que ele é registrado como dimensão personalizada no console do GA4, e o registro não é retroativo. Um parâmetro emitido antes do registro não dá para consultar no GA4 naquele período, para sempre.

Esse passo no console fica fora de todas as verificações que este repositório roda, e nada aqui consegue observar se ele foi feito. Por isso esta página não afirma nada sobre o que é consultável. O raciocínio, e a obrigação, estão na [ADR-0051](https://github.com/tedeuxx/tadeumendonca-io/blob/main/docs/adr/0051-ga4-event-schema-is-immutable-once-shipped.md).

O GA4 também anexa a cada hit campos próprios que este site não define, como o idioma do navegador e o tamanho da tela. Esses não estão listados aqui: esta página cobre o que o código deste site envia, não tudo o que a ferramenta registra.

## Os eventos

Todo evento personalizado carrega `locale`, a edição em que o leitor está. Cada nome é fixo desde o momento em que começa a coletar, porque o GA4 não migra o histórico quando um nome muda. Ele abre uma segunda série e deixa a primeira parecendo completa. Então cada nome diz o que o navegador consegue observar, nunca o que eu gostaria que ele significasse.

### `page_view`

**Parâmetros:** `page_location` no primeiro hit de um carregamento de página · `page_path` em cada troca de rota seguinte

**O que estabelece:** que uma página foi exibida a um leitor que tinha aceitado a analytics. O primeiro de um carregamento de página é enviado quando a tag do GA4 inicia, e o código deste site define o `page_location` dele explicitamente: o endereço por onde o leitor chegou, capturado antes do consentimento para que as marcações de campanha de um link compartilhado sobrevivam a um aceite tardio. Cada um dos seguintes é enviado pelo código deste site numa troca de rota dentro do site, com o `page_path`: o caminho e a sua query string.

**O que não estabelece:** que algo na página foi lido. E um leitor é registrado errado, como custo aceito de preservar essas marcações de campanha: quem chega numa página, vai para uma segunda e só então aceita fica registrado na primeira, e a segunda nunca é contada.

### `article_progress`

**Parâmetros:** `locale` · `slug` · `percent`

**O que estabelece:** que o bloco que marca 25%, 50% ou 75% do artigo, contado em blocos, entrou na área visível. No máximo uma vez por artigo e marco na sessão de uma aba do navegador.

**O que não estabelece:** leitura. Numa tela grande o bloco de 25% muitas vezes já aparece no carregamento, antes de o leitor fazer qualquer coisa. O papel dele é ser pré-condição do evento seguinte, não uma medida própria.

### `article_end_reached`

**Parâmetros:** `locale` · `slug`

**O que estabelece:** que o último bloco do texto do artigo entrou na área visível, que o bloco de 75% já tinha entrado, e que passou tempo suficiente para que as palavras pudessem ter sido lidas. Esse tempo sai do tamanho do artigo a 1.000 palavras por minuto, com mínimo de cinco segundos: não uma velocidade média de leitura, e sim o limite do fisicamente implausível.

**O que não estabelece:** uma leitura. É um indicador indireto, e por isso não se chama `read`. Quem chega ao fim passando pelos marcos e deixa a aba aberta até o tempo mínimo passar é contado sem ter lido; quem lê com cuidado e sai um parágrafo antes do fim não é.

### `share_open`

**Parâmetros:** `locale` · `slug`

**O que estabelece:** que o controle de compartilhar foi aberto. Num artigo, `slug` é o do artigo; nesta página e nas outras páginas longas, é o nome da própria página, então esta página reporta `analytics`.

**O que não estabelece:** que algo foi compartilhado. E um compartilhamento pelo bloco sempre visível no pé de um artigo não abre nada, então `share_complete` pode passar de `share_open`. Essa razão é exata para o diálogo e superestimada para o site como um todo.

### `share_complete`

**Parâmetros:** `locale` · `target`

**O que estabelece:** que um destino de compartilhamento foi escolhido. Nos destinos sociais, a tela de publicação da rede abre numa nova aba.

**O que não estabelece:** que algo foi publicado. A página nunca vê o que acontece naquela aba. A única evidência de que um compartilhamento aconteceu de fato é uma visita posterior chegando por um link compartilhado marcado, que é outra população e não substitui esta.

### `contact_reach`

**Parâmetros:** `locale`

**O que estabelece:** que a seção de contato da página inicial entrou na área visível. No máximo uma vez por sessão de uma aba do navegador.

**O que não estabelece:** que a seção foi lida, nem sequer olhada. Não há condição de tempo, de propósito. E ele não diz de qual página o leitor veio, que é para isso que existe o `nav_click`.

### `contact_click`

**Parâmetros:** `locale` · `target`

**O que estabelece:** que um dos meus canais de contato foi clicado: GitHub, LinkedIn, X, WhatsApp ou e-mail.

**O que não estabelece:** que o contato aconteceu. Uma abordagem acontece no LinkedIn ou por e-mail, e os dois são invisíveis para este site por construção.

### `nav_click`

**Parâmetros:** `locale` · `from` · `to`

**O que estabelece:** que um controle do menu foi clicado, com a página que o leitor estava deixando capturada no clique. Os dois valores vêm de uma lista fechada de áreas do site, então nenhum endereço e nenhuma query string viajam neles.

**O que não estabelece:** nada sobre esta página como origem. Esta página não está no menu e não tem área própria, então um clique no menu feito daqui reporta `from` como `other`. Isso é consequência conhecida de mantê-la fora do menu, não um defeito. Um clique num link dentro do texto de uma página não é clique no menu e não envia `nav_click`.

### `outbound_click`

**Parâmetros:** `locale` · `href`

**O que estabelece:** que um link levou o leitor para fora deste site por um caminho que não é canal de contato nem destino de compartilhamento. `href` carrega só o host e o caminho do destino: sem query string e sem fragmento, então os parâmetros que o autor do link tenha anexado ficam para trás.

**O que não estabelece:** o que aconteceu depois, nem se o leitor voltou. Canais de contato e destinos de compartilhamento ficam de fora de propósito, para não serem contados duas vezes sob dois nomes.

## O que esta página não é

Ela não é uma página de números. Uma página publicando números do GA4 precisaria de uma credencial que este site estático não tem, e cada número nela seria impossível de o leitor verificar. Esta aqui pode ser conferida contra [o código](https://github.com/tedeuxx/tadeumendonca-io/blob/main/apps/fed/src/lib/analytics.ts), linha por linha.
