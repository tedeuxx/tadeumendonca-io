---
title: "Held draft fixture"
slug: held-draft-fixture
date: '2026-08-25T12:00:00.000Z'
tag: harness
track: engenharia
draft: true
contentIssue: 510
excerpt: "The permanent fixture for the held-draft mechanism (#510). It is held, so it is out of the index, the sitemap, the navigation and the OG cards — and it renders here, at its real URL, for anyone arriving with the preview parameter."
takeaway: 'what a held article is, and what the hold does not buy.'
---

This page is not an article. It is the **fixture** the held-draft mechanism is tested against, and it is
committed on purpose rather than generated, so the gates assert against the same content pipeline every
real article travels through instead of against a synthetic double that can drift away from it.

## What is being asserted

The regression checks that this pair is absent from four public enumerations — the sitemap, the
prerendered route set, the per-article OG cards, and the site's own index and feed — while remaining
resolvable at its final URL. Every one of those assertions is mutation-checked by flipping this file's
`draft: true` to `false` and confirming it goes red. An assertion that stays green on a published article
asserts nothing about the hold.

The nonce below is what those checks search for: HELDNONCE-EN-4f7a1c92

## What the hold does not buy

It buys **isolation, not privacy**. While this draft is deployed its full text — both editions — sits in
the JavaScript bundle the site serves to everyone, fetchable with no parameter at all. Nobody stumbles
into it; anybody who knows to look will find it. That consequence is recorded in ADR-0049 along with the
command that measures it, and the upgrade to a genuinely private draft is described there too.
