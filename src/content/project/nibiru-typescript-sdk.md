---
title: "Nibiru TypeScript SDK"
summary: "I built much of the initial SDK and maintained it over several years, giving our frontend teams and other developers the tools to build applications on Nibiru."
role: "Initial development and ongoing maintenance with the Nibiru team"
featured: true
icon: typescript
order: 1
links:
  - label: Source Code
    href: https://github.com/NibiruChain/ts-sdk
  - label: npm Package
    href: https://www.npmjs.com/package/@nibiruchain/nibijs
---

It's common for teams to build an SDK just to say they have one. For us, the
question was what people actually needed to build applications on Nibiru.

We already had a working Python SDK and maintained it well. But JavaScript and
TypeScript were where our frontend teams and many of the developers building on
the chain did their work. That's where we could make the biggest difference.

I built much of the initial Nibiru TypeScript SDK and worked on follow-up
versions over several years. As the chain grew, the tooling had to grow with it.

## Making the Chain Usable

The SDK handles wallet and signing utilities, transaction submission, chain
queries, and smart contract interactions. It also includes generated protocol
types, GraphQL clients, and helpers for Nibiru's EVM precompiles.

That coverage matters because application developers need to use the whole
system. A frontend needs to read data, submit a transaction, and make sense of
what happened. The SDK connects those pieces to the infrastructure underneath.

Our own application teams used it too. That gave us a reason to keep working on
it as the protocol changed, and a direct connection to the people using it.

## Taking Ownership of the Tooling

Some of the harder work came from upstream dependencies. A bug or a change in
another project could block something we needed in our own tooling.

Over time, we got more comfortable maintaining the pieces ourselves. Generating
our own protobuf types was part of that. We could make a change, test it against
our chain, and keep moving. It also meant taking responsibility for maintaining
what we shipped.

Automated tests and CI supported that work. The SDK's test workflow starts a
local Nibiru network before running the tests. Its release workflow uses
semantic-release to automate package publishing. Packaging, distribution, and
versioning became part of the engineering work I did regularly.

## Leaving the Dungeon

Before this, I had mostly been a systems and backend guy. My earlier AI work
involved a lot of PyTorch, some C++, and TensorFlow. I hadn't spent much time
with React or frontend development.

Building tooling for application developers got me out of that dungeon. I
worked more closely with frontend engineers and learned from experienced people
we hired. I picked up their habits, studied the language and its conventions,
and got comfortable maintaining software that other teams depended on.

I write a lot more TypeScript than Python these days. I wouldn't have guessed
that back when I was mostly building AI models.
