---
title: 'Aposentei o backend do meu próprio site — e por que isso foi engenharia, não preguiça'
slug: building-serverless-on-aws
date: '2026-07-22T19:00:00.000Z'
tag: aws
track: engenharia
excerpt: 'Este site já rodou num BFF serverless completo. Desliguei tudo e fiz estático — a decisão, e onde serverless ajuda de verdade.'
takeaway: 'onde serverless ajuda de verdade e onde vira armadilha de custo.'
---
## O site que você está lendo já teve um backend

Por um tempo, `tadeumendonca.io` rodou num stack serverless de gente grande: um BFF em
**Hono** sobre **Lambda**, **DynamoDB** para os dados, **Cognito** para login, **SES** para
e-mail, tudo provisionado com Terraform. Funcionava. E mesmo assim eu **apaguei o backend
inteiro** — hoje é uma SPA estática pré-renderizada em build, servida em S3 + CloudFront,
sem servidor nenhum.

Isso não foi desistir de engenharia. Foi a engenharia.

## O que serverless resolve — e o que ele só empurra

O argumento de venda do serverless é real: sem servidor pra gerir, paga-se por requisição,
escala a zero. Mas "escala a zero" só vale para a **computação**. A complexidade não escala a
zero: um BFF ainda tem contrato de API pra versionar, cold start pra medir, permissões IAM pra
apertar, um pool do Cognito pra manter, uma tabela pra migrar. Para um produto multi-tenant com
lógica por requisição e dados que **precisam** viver no servidor, esse custo se paga. Para uma
página de CV e alguns artigos, ele é dívida sem receita.

## A pergunta que decidiu

A pergunta não foi "serverless é bom?". Foi: **o que aqui realmente precisa de um servidor?**

A resposta foi honesta e desconfortável: nada. O conteúdo é markdown no próprio repositório.
As meta tags de OG/SEO dá pra gerar em build, pré-renderizando cada rota. Não há dado de
usuário, não há sessão, não há nada que um visitante mande de volta. Um backend ali era
superfície de ataque e conta de AWS em troca de zero capacidade nova.

Então o backend saiu. O que sobrou escala a zero de verdade — na computação **e** na operação:
não há o que ficar de pé, o que monitorar de madrugada, o que corrigir com pressa.

## Onde eu faria o oposto

Isto não é "serverless é armadilha". No próximo projeto que tiver estado real de usuário,
lógica por requisição ou dado que não pode sair do servidor, eu volto pro Lambda + DynamoDB
sem pensar duas vezes — e aí o custo de operar aquilo é justo.

A armadilha não é o serverless. É carregar qualquer arquitetura que o problema não pediu.
