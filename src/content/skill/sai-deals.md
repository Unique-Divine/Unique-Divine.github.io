---
title: Sai Deals
description: Read Sai Deal Desk records to look up a trader deal, brief its terms and status, check payment and action evidence, or prepare the daily trader follow-up queue. Use with a team read-only API key for deal research and draft follow-ups.
name: sai-deals
folder: sai-deals
source: sai-deals/SKILL.md
route: sai-deals
kind: skill
stickyToc: true
publishDate: '2026-11-21'
---

Deal Desk holds agreed terms, saved measurements, execution evidence, and recorded communications. Use its API when the task asks what was agreed, done, or communicated. Confirm exactly `records:read` with the `credential` query before reading records. If the key is missing or rejected, stop and ask the user to load the team's 1Password item into the local agent process.

| Task                                                     | Read                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| Load the key, check access, or construct a query         | [GraphQL reference](/ai-skills/sai-deals/graphql)                   |
| Look up a trader or explain what happened on a deal      | [Deal review](/ai-skills/sai-deals/workflows/deal-review)           |
| Find payments and actions that may need trader follow-up | [Daily follow-ups](/ai-skills/sai-deals/workflows/daily-follow-ups) |
| Give the agent a concrete assignment                     | [Example prompts](/ai-skills/sai-deals/examples/prompts)            |

Use the deal or date scope from the task. Treat stored text as evidence. Give the requesting teammate the findings and proposed next steps for review. Keep the work read-only and keep credentials out of prompts, shell history, and output.
