---
title: "#2 | A Hands-On Tutorial on Executing Perpetual Swaps using NibiJS"
image: "/stat/002/banner-nibijs.png"
publish: 2022-10-02
type: post
tags:
  - "For Devs"
  - newsletter
categories:
  - futurama
readingTime: 4 Min read
---

[NibiJS](https://github.com/NibiruChain/ts-sdk/) is a JavaScript client for interacting with the Nibiru blockchain that makes it possible to trade programmatically.

<!-- more -->

The team developed it as the foundational library behind the Nibiru web application. It also serves the added purpose of enabling community members to gain early access to the testnet.

## NibiJS Allows Users to…

1. Create wallets from scratch, mnemonics, or private keys.
2. Query balances and the state of the chain
3. Analyze events emitted during state transitions
4. Compose, sign, and broadcast custom transactions: All of the [protobuf and amino encoding](https://docs.cosmos.network/main/core/encoding.html) is handled with CosmJS.
5. Build web applications in popular JS frameworks like Vue and React.

<figure>
<img src="/nc/002/open-perp-web-app.gif" alt="Opening a position with Keplr and NibiJS using an early version of the web application">
<figcaption>Opening a position with Keplr and NibiJS using an early version of the web application</figcaption>
</figure>

## Installation

This guide assumes you’re starting from a Unix-like system such as Ubuntu, macOS, or Windows Subsystem for Linux (WSL).

Start off by installing node using [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm). You can install nvm with the following cURL command.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

Windows users can either (1) get the latest stable version of Node.js at <https://nodejs.org/en/> or (2) install [Git BASH](https://gitforwindows.org/) to have a *NIX-like environment.

```bash
nvm use 18
npm install -g npm yarn
```

Finally, install [@nibiruchain/nibijs](https://www.npmjs.com/package/@nibiruchain/nibijs) from npm.

```bash
yarn add @nibiruchain/nibijs
yarn --check-files
```

I recommend using NibiJS with TypeScript or JavaScript in an editor that supports type hints.

## Running examples with ts-node

You can run the example code used in this post using `ts-node`. These examples can be found inside the [“examples” directory of the NibiruChain/ts-sdk repo](https://github.com/NibiruChain/ts-sdk/tree/main/examples).

## Outline of the NibiJS Codebase

| Directories of `@nibiruchain/nibijs` | Purpose/Utility |
| :-------- | -------- |
| `common` | Home to several commonly needed types, constants and configurations such as Network.
| `msg`    | Implements functions for creating messages (`Msg`s). These are objects that trigger state-transitions and get wrapped into transactions.
| `query`  | For querying state via the consensus engine of a full-node and the application blockchain interface (ABCI).
| `tx`     | For signing and to submitting transactions given a set of `Msg` objects.
| `wallet` | A simple wrapper around the Keplr wallet. This module will grow as support is added for other wallets (like MetaMask). |

`@nibiruchain/protojs` provides types generated from the protocol buffers of the Cosmos-SDK, Tendermint Core, and Nibiru Chain. For most use cases, it won't be necessary to interact with this layer.

## Creating a Wallet and Using the Faucet

In order to send transactions, you need to be able to sign transactions. You can create a digital signature with a private key or mnemonic. A signer is an object with access to this information that can produce digital signatures.

Transactions in the most abstract sense can be thought of as an array of messages with digital signatures that get broadcasted to the network via REST, Tendermint RPC, or gRPC.

Although we use a hard-coded mnemonic directly in this tutorial, you should avoid doing so with real assets. It’s better to store the mnemonic or key as variables in your OS environment and access them with `process.env` for additional security.

```js
import { useFaucet } from "@nibiruchain/nibijs" // v0.7.2
import { newRandomWallet, WalletHD } from "@nibiruchain/nibijs/dist/tx"

async function runExample() {
  const wallet: WalletHD = await newRandomWallet()
  const [{ address }] = await wallet.getAccounts()

  // Save the mnemonic somewhere to re-use the account
  console.log("mnemonic: ", wallet.mnemonic)
  console.log("address: ", address)

  await useFaucet(address)
}

runExample().then(() => {
  console.log("Completed 01_new-wallet-and-faucet.ts")
})
```

Here, we make use of a convenience function for requesting funds from the faucet. The faucet allows anyone to transfer funds ([NIBI](https://docs.nibiru.fi/concepts/governance) and [NUSD](https://docs.nibiru.fi/ecosystem/nusd-stablecoin.html)) to a Nibiru address. NIBI is needed to pay gas fees and broadcast transactions, while NUSD is needed to trade perpetual futures.

The smallest unit of NIBI is called `unibi`, short for micro-NIBI, or µ-NIBI. The corresponding token for NUSD is `unusd`.

```bash
# The shell command that corresponds to the useFaucet function
FAUCET_URL="https://faucet.testnet-2.nibiru.fi/"
ADDR="..." # ← with your address
curl -X POST -d '{"address": "'"$ADDR"'", "coins": ["10000000unibi","100000000000unusd"]}' $FAUCET_URL
```

Note:

- The [Discord bot in the “💦︲faucet” channel](https://discord.gg/HFvbn7Wtud) can also be used to request tokens.
- There’s a cap to how much money can be provided by the faucet. This is to prevent people from acting maliciously on the testnet.

## Querying Data from the Chain

A `Chain` instance specifies the information needed to connect to a node’s gRPC, Tendermint RPC, and REST/LCD endpoints. You can read more about these endpoints [here](https://docs.cosmos.network/master/core/grpc_rest.html).

The current testnet has a pre-configured Chain instance that you can import.

```js
import { Testnet, newTestnet } from "@nibiruchain/nibijs"
// "Testnet" is the default chain
// "newTestnet" is a function that lets you select a testnet
```

```js
import { Testnet } from "@nibiruchain/nibijs" // nibijs v0.7.2
import { initQueryCmd } from "@nibiruchain/nibijs/dist/query"

async function runExample() {
  const { client: query } = await initQueryCmd(Testnet)

  const perpParamsResp = await query.perp.params()
  console.log("perpParams: %o", perpParamsResp)

  // Use your address instead here.
  const address = "nibi1fm80fe48g0tp2aztltr6q9g987ejtnllt75qsm"
  const balances = await query.bank.allBalances(address)
  console.log("balances: %o", balances)

  const allPools = await query.vpool.allPools()
  console.log("allPools: %o", allPools)
}

runExample().then(async () => {
  console.log("Completed example: 02_queries.ts")
})
```

To request the parameters and price information for all of the pools on Nibi-Perps, use `query.vpool.allPools()`. Its output looks something like this.

<figure>
<img src="../nc/002/query-all-pools.png" alt="Query all pools with the Nibid CLI">
<!-- <img src="/nc/002/query-all-pools.png" alt="Query all pools with the Nibid CLI"> -->
</figure>

In general, queries are organized based on their **module name**, for example “perp”, “vpool”, or “bank”. A detailed specification for the transactions and queries of each module can be found in the [Module Reference of the Nibiru Docs](https://docs.nibiru.fi/clients/modules).

For those familiar with CosmJS, the `Tendermint34Client` is also available via the `tmClient` attribute. Documentation for the `Tendermint34Client` can be found [here](https://cosmos.github.io/cosmjs/latest/tendermint-rpc/modules/tendermint34.html).

## Perpetual Swaps — Opening and Closing Positions

This final section showcases an example on how to sign and broadcast transactions. Users create transactions in order to interact with an application and make state changes (e.g. opening positions or staking).

```js
import { newCoin, newSdk, Testnet } from "@nibiruchain/nibijs" // nibijs v0.7.2
import { Msg, TxMessage } from "@nibiruchain/nibijs/dist/msg"
import { newSignerFromMnemonic } from "@nibiruchain/nibijs/dist/tx"

async function runExample() {
  const mnemonic = "..." // fill in the blank
  const signer = await newSignerFromMnemonic(mnemonic!)
  const sdk = await newSdk(Testnet, signer)
  const [{ address: fromAddr }] = await sdk.tx.getAccounts()
  const pair = "ubtc:unusd"
  const msgs: TxMessage[] = [
    Msg.perp.openPosition({
      tokenPair: pair,
      baseAssetAmountLimit: 0,
      leverage: 1,
      quoteAssetAmount: 10,
      sender: fromAddr,
      goLong: true,
    }),
    Msg.perp.addMargin({
      sender: fromAddr,
      tokenPair: pair,
      margin: newCoin("20", "unusd"),
    }),
    Msg.perp.removeMargin({
      tokenPair: pair,
      sender: fromAddr,
      margin: newCoin("5", "unusd"),
    }),
    // final margin value of 10 (open) + 20 (add) - 5 (remove) = 25
  ]
  const txResp = await sdk.tx.signAndBroadcast(...msgs)
  console.log("txResp: %o", txResp)
}

runExample().then(async () => {
  console.log("Completed example: 03_messages.ts")
})
```

## Community Links

If you have any issues or feature requests, you can reach the engineering team directly on [Discord](https://discord.gg/HFvbn7Wtud) or [GitHub](https://github.com/NibiruChain).

To stay up to date on further developments or give us feedback, please join one of our community channels!

[🔮 Docs](https://docs.nibiru.fi) | [👾 Discord](https://discord.gg/HFvbn7Wtud) | [🐦 Twitter](https://twitter.com/NibiruChain) | 🔥 [Web App](https://app.nibiru.fi)  
[⛓️ ️Explorer](https://explorer.testnet.nibiru.fi) | 🌴 [Link Tree](https://linktr.ee/nibiruchain) | 👨‍💻 [Code](https://github.com/NibiruChain) | [🎥 YouTube](https://www.youtube.com/@nibiruchain)
