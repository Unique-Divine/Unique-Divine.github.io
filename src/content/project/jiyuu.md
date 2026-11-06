---
title: "Jiyuu (自由)"
summary: "My public monorepo of tools I use every day as an engineer: agent skills, custom MCP servers, CLIs, and TypeScript libraries, plus my notes on core algorithms."
tagline: "Monorepo of tools I use daily; custom MCPs and agent skills."
role: "Creator and maintainer"
featured: true
icon: jiyuu
order: -1
links:
  - label: Source Code
    href: https://github.com/Unique-Divine/jiyuu
  - label: Agent Skills
    href: https://github.com/Unique-Divine/jiyuu/tree/main/ai-skills
---

Jiyuu (自由) is Japanese for "freedom." It's where I keep the tools I use
every day, in the open, so anyone can take them.

The repository started in 2023 as a place for algorithm practice and has grown
into a monorepo of about 370 commits. It's Bun and TypeScript first, with Go
and Rust where they fit the job better.

## Agent Skills

The `ai-skills` directory holds 22 public agent skills. Each one is a playbook
an AI coding agent can follow for a task I do repeatedly: writing and reviewing
pull requests, watching CI, routing work across my repositories, querying
Nibiru chain and Sai data, and editing prose so it doesn't read like a model
wrote it. They work in Claude Code, Codex, Cursor, and other agents that read
skills.

## Tools

- **gh-rev** is a Rust CLI that keeps a durable review ledger for a branch or
  pull request. It follows the PR as it changes and refuses to record new
  findings against a commit that has moved.
- **MCP servers for Slack and Telegram**, adapted from open-source servers,
  let agents work through my own accounts. Sending anything needs my explicit
  approval.
- **`@uniquedivine/bash`** runs shell scripts written in TypeScript with the
  Bun Shell.
- **tg-sai** handles Sai's Telegram administration and chat custody.
- Smaller CLIs in Go cover jobs like turning files into LLM context and fixing
  broken text encodings.

## Algorithms

The original half of the repository is still here: solutions and notes on
core algorithms and data structures, written up for practice with Anki.
