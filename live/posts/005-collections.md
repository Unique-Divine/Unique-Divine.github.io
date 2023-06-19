---
title: "#5 | Collections API, an upgrade to Cosmos-SDK storage"
image: "/stat/005/banner-collections.png"
publish: 2023-01-10
type: post
tags:
  - "For Devs"
  - newsletter
categories:
  - futurama
readingTime: 4 Min read
---

The collections API is a Golang package that improves upon state-related abstractions in the Cosmos-SDK. Here, we explain blockchain state and the advantages of NibiruChain/collections.

<!-- more -->

We recently implemented the collections API for better state management on Nibiru Chain and thought the tool would be useful for the broader Cosmos community. After integrating it to our core modules, we proposed an architectural design record (ADR) to the Cosmos-SDK, which got merged near the end of 2022. It was awesome to see such positive responses from core SDK contributors.

<figure>
<img src="../stat/005/dev-comment.png" alt="Dev Ojha (ValarDragon) - Builder on Osmosis, Tendermint, Cosmos, Sikka Tech">
<figcaption>Dev Ojha (ValarDragon) - Builder on Osmosis, Tendermint, Cosmos, Sikka Tech</figcaption>
</figure>

> "There is something nice about the simplicity of collections for simpler use cases and the prospect of being able to migrate modules to collections without requiring a migration is obviously attractive.” - [Aaron Craelius](https://github.com/aaronc) at Regen Network (aaronc)

- Reference: [Cosmos-SDK Architectural Design Record #62: Collections, a simplified storage layer for Cosmos-SDK modules](https://docs.cosmos.network/main/architecture/adr-062-collections-state-layer)
- The architect/inventor and primary builder of the collections was [@testinginprod](https://github.com/testinginprod).
- The original implementation for the collections API lives inside [NibiruChain/collections](https://github.com/NibiruChain/collections). It has since been included as part of the Cosmos-SDK and published under the [cosmossdk.io/collections package](https://github.com/NibiruChain/collections).
- We leverage the API heavily in [modules of Nibiru Chain](https://github.com/NibiruChain/nibiru/tree/master/x) such as x/oracle, x/perp, and x/vpool.

The rest of this post is an explainer on how “state” works and where protocol developers on app chains can benefit from using the collections API.

# What is State?

A blockchain is a deterministic state machine that transitions between states based on transactions. “State” is how we refer to the representation of this system at any point. State includes everything the chain tracks: account balances, liquidity positions, exchange parameters, and much more.

The state machine is deterministic because a node that executes the same transactions starting from an initial state (block) will end up in the same ending state.

# State in the Cosmos-SDK

When developers build applications, they need to specify when to read, update, or delete state. To deal with this, the Cosmos-SDK provides a module-specific, key-value store (`KVStore`). Applications can read and write byte data with these `KVStores`, and the collections of these stores makes the state.

This is where the first problem pops up. In business logic, we often deal with “structured data”, in this context referring to things like `structs`, classes, arrays, queues, maps, or JSON in programming languages. However, when we deal with storage, we have to work with bits and bytes because that’s the format programs use to represent data in memory. Human-readable strings are great for development but bad for computational efficiency.

In the case of SDK app chains, the [consensus engine (Tendermint Core)](https://docs.nibiru.fi/run-nodes/testnet/node-daemon.html) is agnostic to the application and only accepts transactions in the form of raw bytes, which aren’t generally human-readable.

For this reason, SDK apps end up creating a plethora of functions to deal with storage types. It’s verbose, error prone, and increases maintenance costs in the form of tests. We’ll run through a concrete example to highlight this.

# Examples from the x/staking module

You don’t need to read these code blocks too closely. The point of including them is to showcase how much work goes into getting the create, read, update, and delete (CRUD) behavior described in the previous section.

<figure>
<img src="../stat/005/x-staking-get-delegation.png" alt="Function for reading one item from the delegations store in the x/staking module">
<figcaption>Function for reading one item from the delegations store in the x/staking module</figcaption>
</figure>

To get the full utility of the delegations store, the SDK also had to include similar functions for:

- Adding items - `SetDelegation`
- Removing items - `RemoveDelegation`
- Iterating through the items - `IterateAllDelegations`
- And reading all of the items - `GetAllDelegations`

This is all just for one key type. On top of this, certain information needs to be defined in types/keys.go. This includes:

# 1 — Store prefixes for each key type

Keys store prefixes in the keys.go file of the x/staking module
Keys store prefixes | from keys.go in the x/staking module

<figure>
<img src="../stat/005/x-staking-store-prefixes.png" alt="Function for reading one item from the delegations store in the x/staking module">
<figcaption>Function for reading one item from the delegations store in the x/staking module</figcaption>
</figure>

# 2 — Key encoder functions for each key type

<figure>
<img src="../stat/005/x-staking-key-encoders.png" alt="Example functions for encoding keys | from keys.go in the x/staking module">
<figcaption>Example functions for encoding keys | from keys.go in the x/staking module</figcaption>
</figure>

For each of the 14 key types in `x/staking`, we have to define a minimum of 4 functions (totaling over 50) just for basic CRUD. This process ends up being extremely repetitive across modules and storage types.

> Defining how to encode and decode between keys and bytes is one of the most error-prone tasks even for seasoned Cosmos developers.

This process adds maintenance requirements with tests, and it tends to get nasty when dealing with objects mapped with multi-part keys.

For example, a perpetual `Position` on Nibi-Perps is uniquely mapped (identified) by the combination of an `AssetPair` and the `Trader` address that owns the position. We may want to access the collection of `Positions` in different ways without exhaustively going through every position, e.g.

- “get all of the `Positions` for a given `AssetPair`”
- “get all of the `Positions` for a given `Trader`”
- “get all of the long `Positions` that are underwater on any `AssetPair`”

All of this data is super useful to access and update for use cases like trading, liquidating positions, and market-making. But, multi-part keys get extremely tricky when we want to add more complex functionality.

# Enter the [collections API](https://github.com/NibiruChain/collections)

The collections API is a Golang package that improves upon the storage abstractions in the Cosmos-SDK by bringing a developer experience similar to [CosmWasm/cw-storage-plus](https://github.com/CosmWasm/cw-storage-plus), the main library for storage abstractions in CosmWasm smart contracts.

## The `collections` API has the following advantages

- **It doesn’t require custom tooling** and has few dependencies. Collections just relies on generics.
- **Protocol developers can focus on business logic**. By hiding the complexity of encoding and decoding keys, CRUD (create-read-update-delete) operations become much easier to understand.
- **Composite keys** are seamlessly managed with `collections.Join` and have accessors for iterations through different views of the same store.
- **Handles complex structures**: hello, Golang `IndexedMap`!

---

Thank you for reading! Feel free to send any questions or comments on Twitter, Discord, GitHub, or here.

[🔮 Docs](https://docs.nibiru.fi) | [👾 Discord](https://discord.gg/HFvbn7Wtud) | [🐦 Twitter](https://twitter.com/NibiruChain) | 🔥 [Web App](https://app.nibiru.fi)  
[⛓️ ️Explorer](https://explorer.testnet.nibiru.fi) | 🌴 [Link Tree](https://linktr.ee/nibiruchain) | 👨‍💻 [Code](https://github.com/NibiruChain) | [🎥 YouTube](https://www.youtube.com/@nibiruchain)

News on our decentralized oracle network, Ambassador Program, seed raise, and multi-phase incentivized testnet will come out over the next few weeks.

---

# Appendix for Devs: Collections

## Defining storage types

In `collections`, storage types are defined on the `Keeper` struct. Because the Keeper is the king of a module’s business logic, state definitions should be there, not scattered across multiple files. Let’s see how we instantiate all this new collections types.

<figure>
<img src="../stat/005/coll-storage-types.png" alt="Storage types example - Collections">
</figure>

So in order to instantiate a `collections.Map`, we need four things:

- The module’s store key (this is required to get the `KVStore`)
- A namespace number ranging from 0 to 255. This is basically the reserved namespace byte for all the objects associated with this collection. It means that the maximum number of collection types we can have in a single module is 256, which should be plenty.
- A `KeyEncoder` that instructs the `collections.Map` how to encode and decode keys. The collections API has already defined most of the useful key encoders you might need.
- A `ValueEncoder` that instructs the `collections.Map` on how to encode and decode its values. Similar to the `KeyEncoder`, the most commonly needed value encoders are built into the library.

### What do you get from this?

- A type safe API. Keys and Values are type safe. You don’t have to deal with bytes anymore.
- Safe key encoders which take care of:
  - proper ordering
  - safe prefixing
- No more need to define `Get/Set/Delete/Iterate` methods on your keeper specific to every object.
- A nice `Iterate API` using `collections.Ranger`.
- Other powerful collections APIs to explore: `KeySet`, `Item`, `Sequence`, `IndexedMap`.

Here’s how some of the examples from earlier in the post look with collections.

<figure>
<img src="../stat/005/coll-mature-bonds.png" alt="Iterating over complex types with collections is simple.">
<figcaption>Iterating over complex types with collections is simple.</figcaption>
</figure>

Now let’s see the positions case (note: `collections.Pair` is a type which defines a key composed of two other keys, `collections.PairRange` implements an interface which has a nicer API for working with `collections.Pair` keys):

<figure>
<img src="../stat/005/coll-positions-by.png" alt="Multi-part keys are also easy to work with and have built-in iteration methods.">
<figcaption>Multi-part keys are also easy to work with and have built-in iteration methods.</figcaption>
</figure>

More instructions and examples are provided in the [collections repository](https://github.com/NibiruChain/collections).

Thank you!
