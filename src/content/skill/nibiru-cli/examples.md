---
title: nibiru Examples
description: Supporting reference for nibiru-cli.
name: nibiru-cli
folder: nibiru-cli
source: nibiru-cli/examples.md
route: nibiru-cli/examples
kind: reference
stickyToc: true
publishDate: '2026-10-19'
---

Concrete copy-paste examples for [`SKILL.md`](/ai-skills/nibiru-cli).

## Bank send with memo (`--note`)

Use this when the destination requires a memo or reference code, such as an
exchange deposit account.

```bash
FROM="ud-prod"
TO_ADDR="nibi1recipient..."
MEMO="2097215673"
AMOUNT="1000000unibi"

nibiru tx bank send \
  "$FROM" \
  "$TO_ADDR" \
  "$AMOUNT" \
  --note "$MEMO" \
  --gas auto
```

Safer pre-flight variant:

```bash
FROM="ud-prod"
TO_ADDR="nibi1recipient..."
MEMO="2097215673"
AMOUNT="1000000unibi"

nibiru tx bank send \
  "$FROM" \
  "$TO_ADDR" \
  "$AMOUNT" \
  --note "$MEMO" \
  --chain-id "cataclysm-1" \
  --gas auto \
  --dry-run
```

Notes:

* Use `--gas auto` for automatic gas estimation and fee calculation. Add fee or
  gas-adjustment overrides only when requested or required by a specific flow.
* Use `--note`, not a guessed memo flag.
* Keep the amount in base units such as `unibi` unless the user explicitly wants
  a human-unit conversion.
* Verify the active network and `--from` value before broadcasting.
