---
title: "Fixture de rascunho retido"
slug: rascunho-retido-fixture
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
contentIssue: 510
excerpt: "O fixture permanente do mecanismo de rascunho retido (#510). Ele está retido, então está fora do índice, do sitemap, da navegação e dos cards de OG — e renderiza aqui, na URL real, para quem chega com o parâmetro de preview."
takeaway: 'o que é um artigo retido, e o que a retenção não compra.'
---

Esta página não é um artigo. É o **fixture** contra o qual o mecanismo de rascunho retido é testado, e ele
é versionado de propósito em vez de gerado, para que os gates verifiquem o mesmo pipeline de conteúdo por
onde passa todo artigo real, em vez de um dublê sintético que pode se afastar dele.

## O que está sendo verificado

A regressão checa que este par está ausente de quatro enumerações públicas — o sitemap, o conjunto de
rotas prerenderizadas, os cards de OG por artigo, e o índice e o feed do próprio site — e continua
resolvível na sua URL final. Cada uma dessas asserções é verificada por mutação, trocando o `draft: true`
deste arquivo por `false` e confirmando que ela fica vermelha. Uma asserção que continua verde num artigo
publicado não afirma nada sobre a retenção.

O nonce abaixo é o que essas checagens procuram: HELDNONCE-PT-4f7a1c92

## O que a retenção não compra

Ela compra **isolamento, não privacidade**. Enquanto este rascunho está publicado, o texto completo — nas
duas edições — está dentro do bundle JavaScript que o site serve para todo mundo, acessível sem parâmetro
nenhum. Ninguém tropeça nele; quem souber procurar vai encontrar. Essa consequência está registrada na
ADR-0049 junto com o comando que a mede, e o caminho de upgrade para um rascunho de fato privado está
descrito lá também.
