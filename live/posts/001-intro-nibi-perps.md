---
title: "#1 | An Introduction to Nibi-Perps"
image: "/stat/001/nibi-perps-ui-alpha-1.png"
publish: 2022-9-11
type: post
tags:
  - newsletter
# categories:
#   - futurama
readingTime: 2 Min read
---

Nibiru is a decentralized platform, proof-of-stake (PoS) blockchain, and member of the family of interconnected blockchains that comprise the Cosmos Ecosystem.

The team has primarily been focused on building and testing our perpetuals swap trading protocol, Nibi-Perps, on devnet. We’ve also begun onboarding users and validators for private testnet.

<!-- more -->

> We’re soon to release our alpha version.

## Documentation / Litepaper

The initial roadmap for the protocol is outlined by the “Concepts” section on [our documentation website](https://docs.nibiru.fi). Expect frequent updates as we release tutorials and continue to optimize the content for usability.

## Nibi-Perps V1

Nibi-Perps is an entirely on-chain perpetual swaps DEX. A more detailed description is available at [this link](https://docs.nibiru.fi/ecosystem/nibi-perps.html), but here’s a quick TLDR:

- Positions are (initially) settled in USDC.
- The initial testnet version of Nibi-Perps is based on an AMM-based price discovery mechanism similar in to the designs used in [Perpetual Protocol](https://perp.com/) and [Drift (Solana)](https://www.drift.trade/).
- Nibi-Perps can serve as a platform for bootstrapping **leverage trading on all assets**, whether inside or outside the Cosmos. Traders can open positions with up to ≈10x leverage on assets like BTC, ETH, and ATOM.

## Product and Engineering Updates

**① Web app**: We implemented UI designs and features for the web application.

**② Trading Bots**: We developed automated trading bots to stress test our stack against different market environments. For example, the team made an execution stack for arbitrage trading between FTX and Nibiru.

**③ Liquidation bots**: Our liquidation engine is feature-complete and ready for external traders.

**④ Explorer**: We deployed a block explorer for the Nibi-Perps testnet using the Juno implementation for BigDipper.

<figure>
<img src="../nc/001/explorer.png" alt="Nibiru Chain — Testnet Block Explorer">
<figcaption>Nibiru Chain — Testnet Block Explorer</figcaption>
</figure>

**⑤ Faucet**: The [faucet](https://github.com/NibiruChain/faucet) is complete for the Nibiru testnet.

**⑥ Oracle**: Sending transactions to post prices in our oracle network became expensive for validators, so we implemented an upgrade to make that type of transaction gasless.

**⑦ IBC Relayer**: Deployed an IBC relayer for transfers between (test) chains of Nibiru, Axelar, and Osmosis.

### Community Links

We look forward to sharing updates and receiving feedback in the coming weeks. Feel free to ask any questions on Discord or DM us on Twitter.

[🔮 Docs](https://docs.nibiru.fi) | [👾 Discord](https://discord.gg/nibirufi) | [🐦 Twitter](https://twitter.com/NibiruChain) | 🔥 [Web App](https://app.nibiru.fi)  
[⛓️ ️Explorer](https://explorer.testnet.nibiru.fi) | 🌴 [Link Tree](https://linktr.ee/nibiruchain) | 👨‍💻 [Code](https://github.com/NibiruChain) | [🎥 YouTube](https://www.youtube.com/@nibiruchain)
