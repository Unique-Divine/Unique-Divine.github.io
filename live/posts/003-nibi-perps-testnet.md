---
title: "#3 | Nibi-Perps V1 on Public Testnet"
image: "/stat/003/banner-nibi-perps-public-tn.png"
publish: 2022-11-01
type: post
tags:
  - newsletter
# categories:
#   - futurama
readingTime: 2 Min read
---

We’re proud to announce the release of the first public Nibiru testnet, which enables interested early adopters to try out Nibi-Perps.

<!-- more -->

## How to participate

There are currently two main ways to interact with the testnet: running a full node and trading perpetual futures via one of the Nibiru clients (Python, TypeScript, and CLI). The [Python SDK](https://github.com/NibiruChain/py-sdk) and [TypeScript SDK](https://github.com/NibiruChain/ts-sdk) have entry-point tutorials for setting up a wallet, querying the chain, and executing transactions.

- [TypeScript SDK — NibiJS Tutorial](./002-nibijs)
- [Python SDK — Google Colab Notebook Tutorial](https://colab.research.google.com/github/NibiruChain/py-sdk/blob/master/examples/collab_notebook.ipynb)

Nibiru also has a command-line client called `nibid`.

1. You can install the `nibid` CLI by downloading the binary or building it directly from the source code using the [Nibiru Docs - Installing the Nibid binary](https://docs.nibiru.fi/dev/cli/nibid-binary) instructions.
2. After installing nibid, you can run a full node by following the [Nibiru Docs - Joining Tesnet](https://docs.nibiru.fi/run-nodes/testnet) instructions.

## What’s next?

<figure>
<img src="../stat/003/nibi-roadmap.png" alt="Nibiru Chain roadmap testnet 2">
</figure>

- **Product Roadmap**: Our development team is working hard at creating more legos necessary to realize the Nibiru vision: permission-less smart contracts, Nibi-Swap and NUSD. As we approach Mainnet, we’ll launch an incentivized testnet to encourage users, builders, and validators to test the system's robustness.
- **Collections Library**: We plan to contribute to other open-source projects in the Cosmos ecosystem. As a first step, the team has developed a novel Object-Relational Mapping (ORM) layer that we call the Collections API compatible with Cosmos-SDK modules. This will be released as a standalone package.
- **Oracle & Price Feeder**: We also enhanced a decentralized [oracle solution](https://github.com/NibiruChain/nibiru/tree/master/x/oracle) and corresponding sidecar “price feeder” that can be used on chains like Umee, Sei, and Terra.
- **Audits**: Nibiru has engaged with multiple teams to begin a process of stage-wise audits that will eventually cover each module and core smart contract.
Web App (Desktop): We’ll release an MVP of the Nibi-Perps web application in November.

## Community Links

If you’d like to learn more about Nibiru, chat with us on Discord or Twitter.

[🔮 Docs](https://docs.nibiru.fi) | [👾 Discord](https://discord.gg/HFvbn7Wtud) | [🐦 Twitter](https://twitter.com/NibiruChain) | 🔥 [Web App](https://app.nibiru.fi)  
[⛓️ ️Explorer](https://explorer.testnet.nibiru.fi) | 🌴 [Link Tree](https://linktr.ee/nibiruchain) | 👨‍💻 [Code](https://github.com/NibiruChain) | [🎥 YouTube](https://www.youtube.com/@nibiruchain)
