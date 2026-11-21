---
title: Sai Perps
description: Moved into agent skill `sai`. Query and reconcile Sai Perps data from live contracts, Sai Keeper GraphQL and Postgres, and DexPal REST. Use for markets, trades, fees, open interest, vaults, balances, referrals, Sai Keeper Postgres tables, columns, and schema questions, or disagreements between on-chain and indexed data. Load agent skill `sai` for everything except the Postgres table guide, which stays here. Use agent skill `sai-ops` for mutations.
name: sai-perps
folder: sai-perps
source: sai-perps/SKILL.md
route: sai-perps
kind: skill
stickyToc: true
publishDate: '2026-10-19'
---

This skill moved into agent skill `sai`. Load `sai` and follow its router.

If agent skill `sai` is not installed, read it from its repository at
<https://github.com/Unique-Divine/jiyuu/tree/main/ai-skills/sai>. The `sai`
CLI also prints its packaged copy with `sai --skill`.

| Old page in `sai-perps`            | Page in `sai`                                                   |
| ---------------------------------- | --------------------------------------------------------------- |
| `references/sai-contracts.md`      | [`references/contracts.md`](/ai-skills/sai/contracts)           |
| `references/sai-vaults.md`         | [`references/vaults.md`](/ai-skills/sai/vaults)                 |
| `references/sai-graphql.md`        | [`references/graphql.md`](/ai-skills/sai/graphql)               |
| `references/sai-rest.md`           | [`references/rest.md`](/ai-skills/sai/rest)                     |
| `references/sai-referrals.md`      | [`references/referrals.md`](/ai-skills/sai/referrals)           |
| `references/sai-reconciliation.md` | [`references/reconciliation.md`](/ai-skills/sai/reconciliation) |
| `examples/sai-perps-prompts.md`    | [`examples/prompts.md`](/ai-skills/sai/examples/prompts)        |

The links above work when both skills sit in the same directory. Otherwise
use the same paths under the repository URL.

## Sai Keeper Postgres

For a question about a Sai Keeper Postgres table, column, unit, migration, or
which table feeds a GraphQL field or REST metric, read
[`references/sai-db.md`](/ai-skills/sai-perps/sai-db). That page stays in this
skill, because agent skill `sai` ships inside the public `sai` CLI and
carries no database material.

For database access, primary and replica routing, or any write, use private
agent skill `sai-db`. Do not infer connection details from repository
configuration or environment variables.

## Mutations

Contract and operator mutations belong to agent skill `sai-ops`.
