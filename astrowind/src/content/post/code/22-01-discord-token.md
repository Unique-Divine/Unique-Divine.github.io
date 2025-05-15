---
title: 'How to Find Your Discord token in the Browser'
publishDate: 2022-01-10
type: post
image: '/coding-4.png'
category: Coding
tags:
  - coding
  - discord
readingTime: 1 Min read
---

1. Head to https://discord.com/login
2. Open the browser's developer console with either `Ctrl + Shift + I` or by right clicking.
3. Refresh the page
4. Go under the "Network" tab in the console.
5. Enter "/api" as the filter and then hit `Enter`.
6. One of the items in the table should have a name starting with "library". Click this row.
7. In the "Headers" tab, find the place that says "authorization: ". The text for this field is your Discord token.

Reference:

- [Webhook Resource. Discord Developer Portal.](https://discord.com/developers/docs/resources/webhook)

<!-- TODO: add pictures -->
