---
title: "Nibiru Rust and WebAssembly"
summary: "I built and maintain Rust contracts, WebAssembly tooling, and libraries used for Nibiru's multisig infrastructure, token vesting, and application development, including the foundations for Sai."
role: "Primary development and maintenance of Nibiru's Rust contracts and tooling"
featured: true
icon: rust
order: 2
links:
  - label: Contracts
    href: https://github.com/NibiruChain/nibiru/tree/main/wasm-contracts
  - label: Chain Integration Library
    href: https://github.com/NibiruChain/nibiru/tree/main/lib/nibiru-std
  - label: Ownership & Permissions
    href: https://github.com/NibiruChain/nibiru/tree/main/lib/nibiru-ownable
---

Much of my Rust work on Nibiru runs underneath applications and infrastructure
that people depend on. It includes contracts that govern shared funds, manage
token vesting, and let application developers use the chain's custom
functionality.

We adopted WebAssembly, or Wasm, for smart contracts early in Nibiru's development. The chain
already had application logic in Go, but we also wanted to build applications
in Rust and deploy them as contracts. Developers needed a way to use our custom
chain calls from those contracts. I built the workspace and much of the tooling
to make that possible.

## Contracts People Depend On

I've done most of the development and maintenance of this contract workspace.
Some contracts I built from scratch. Others started with existing open-source
implementations that I adapted substantially for our requirements. Working with
an existing codebase means understanding its assumptions before changing the
behavior people rely on.

The multisig contracts are part of Nibiru's operational infrastructure. They let
a group propose, approve, and execute actions on-chain. Who can vote, what passes,
and who can execute a proposal are rules that need to be explicit and tested.

The vesting contracts have been used for token agreements and airdrop claim
rewards. They track vesting schedules and let recipients claim the tokens
available to them. Getting the timing, permissions, and amounts right matters
because those rules determine when people can access their funds.

## Bringing Chain Functionality into Rust

A contract developer needs more than the ability to compile Rust to Wasm. They
need to interact with the chain around it.

I built much of our Rust protobuf tooling from scratch. It gives contracts typed
messages and queries for functionality implemented in the chain. The
`nibiru-std` library supplies those Nibiru-specific types and helpers, while
libraries such as `nibiru-ownable` handle shared ownership and permission
patterns.

This work became part of the foundation for Sai, the trading application and
exchange built on Nibiru. It gave us the tools to build application logic in
Rust while using the infrastructure underneath it. The work on Sai also brought
fixture tests and golden examples into our testing practices, giving us concrete
reference cases to check as the implementation changed.

## Maintaining the Whole Stack

These are mature systems used in production. The job includes maintaining
existing behavior, reviewing changes, and keeping the build and test pipeline
working as dependencies evolve. Docker tooling, automated tests, CI, and clear
change descriptions are part of that work.

The node software also uses Rust through libwasmvm and its VM and compiler
dependencies. My work has extended into that stack, including low-level Wasmer
changes and upstream patches. A contract sits on top of a runtime, and sometimes
the work takes you down into it.

The Rust workspace now lives alongside the Go chain code in the main Nibiru
repository. Both were already monorepos. Bringing them together gives us shared
context for maintaining the build pipeline and testing changes across the stack.

For me, the important part is taking responsibility for software after people
start depending on it. Writing the first version is only part of the work.
