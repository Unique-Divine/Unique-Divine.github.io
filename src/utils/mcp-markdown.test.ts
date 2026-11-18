import { describe, expect, test } from "bun:test"

import { reduceMarkdown } from "~/utils/markdown-copy"
import {
  codeBlock,
  inlineCode,
  mcpCatalogMarkdown,
  mcpServerMarkdown,
  toolAccess,
} from "~/utils/mcp-markdown"
import type { McpManifest } from "~/utils/mcp-schema"

const site = "https://uniquedivine.com"

const manifest = (
  folder: string,
  overrides: Partial<McpManifest> = {},
): McpManifest => ({
  schemaVersion: 1,
  folder,
  slug: `${folder}-mcp`,
  title: `${folder} MCP`,
  description: `Talk to ${folder}.`,
  registry: "npm",
  package: `@uniquedivine/mcp-${folder}`,
  version: "1.2.3",
  installCommand: `bunx @uniquedivine/mcp-${folder}@1.2.3`,
  runtime: "Bun >= 1.4.3",
  license: "MIT",
  sourceUrl: `https://github.com/Unique-Divine/jiyuu/tree/main/mcp/${folder}`,
  registryUrl: `https://www.npmjs.com/package/@uniquedivine/mcp-${folder}`,
  envVars: [
    { name: "SLACK_TOKEN", required: false, secret: true },
    { name: "SLACK_DEBUG", required: false, secret: false, note: "a | b" },
  ],
  toolCount: 2,
  readOnlyCount: 1,
  writeCount: 1,
  tools: [
    {
      name: "list_chats",
      title: "List Chats",
      description: "Lists chats.",
      readOnly: true,
      destructive: false,
      params: [],
    },
    {
      name: "delete_message",
      title: "Delete Message",
      description: "Deletes a message.",
      readOnly: false,
      destructive: true,
      params: [
        { name: "chat", type: "string", required: true },
        { name: "reason", type: "string", required: false },
      ],
    },
  ],
  installMarkdown: "",
  generatedFrom: { revision: "abc123" },
  ...overrides,
})

describe("code helpers", () => {
  test("codeBlock fences outrun backtick runs inside the code", () => {
    expect(codeBlock("ls", "sh")).toBe("```sh\nls\n```")
    expect(codeBlock("a ```` b")).toBe("`````\na ```` b\n`````")
  })

  test("inlineCode survives backticks in the text", () => {
    expect(inlineCode("x")).toBe("`x`")
    expect(inlineCode("a`b")).toBe("``a`b``")
    expect(inlineCode("`a")).toBe("`` `a ``")
  })

  test("toolAccess matches the page's Access column", () => {
    expect(toolAccess({ readOnly: true, destructive: false })).toBe("read")
    expect(toolAccess({ readOnly: false, destructive: false })).toBe("write")
    expect(toolAccess({ readOnly: false, destructive: true })).toBe(
      "destructive",
    )
  })
})

describe("mcpServerMarkdown", () => {
  const text = mcpServerMarkdown(manifest("slack"))

  test("has the description, install, env vars, and tools in order", () => {
    const order = [
      "Talk to slack.",
      "## Install",
      "### Claude Code",
      "### Codex",
      "### Cursor",
      "## Environment Variables",
      "## Tools",
    ].map((part) => text.indexOf(part))
    expect(order.every((at) => at >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test("install snippets match the page's copy buttons", () => {
    expect(text).toContain(
      "```sh\nclaude mcp add slack -e 'SLACK_TOKEN=<SLACK_TOKEN>' " +
        "-- bunx @uniquedivine/mcp-slack@1.2.3\n```",
    )
    expect(text).toContain('```toml\n[mcp_servers.slack]\ncommand = "bunx"')
    expect(text).toContain('```json\n{\n  "mcpServers": {')
  })

  test("tables list env var names and every tool with its access", () => {
    expect(text).toContain("| `SLACK_TOKEN` | No | Yes |  |")
    expect(text).toContain("| `SLACK_DEBUG` | No | No | a \\| b |")
    expect(text).toContain(
      "| `list_chats` | List Chats | read | Lists chats. | None |",
    )
    expect(text).toContain(
      "| `delete_message` | Delete Message | destructive | " +
        "Deletes a message. | `chat*`, `reason` |",
    )
    expect(text).toContain("2 tools: 1 only read, and 1 can change state")
  })

  test("a server without env vars has no env var section", () => {
    expect(mcpServerMarkdown(manifest("x", { envVars: [] }))).not.toContain(
      "## Environment Variables",
    )
  })
})

test("mcpCatalogMarkdown lists servers; links go absolute", async () => {
  const text = mcpCatalogMarkdown([manifest("discord"), manifest("slack")])
  expect(text).toContain("2 servers, 4 tools.")
  expect(text).toContain(
    "- [slack MCP](/mcp/slack-mcp): Talk to slack. 2 tools, 1 read-only " +
      "([Markdown](/mcp/slack-mcp.md)).",
  )
  expect(text).toContain("## Before You Connect One")
  const page = `${site}/mcp`
  const reduced = await reduceMarkdown(text, { mdx: false, page, site })
  expect(reduced).toContain(`[slack MCP](${site}/mcp/slack-mcp)`)
  expect(reduced).toContain(`([Markdown](${site}/mcp/slack-mcp.md))`)
})
