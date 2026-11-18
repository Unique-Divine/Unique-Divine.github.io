import { describe, expect, test } from "bun:test"

import {
  catalogJsonLd,
  claudeCommand,
  codexToml,
  cursorJson,
  jsonLdScript,
  serverBreadcrumbs,
  serverJsonLd,
  splitCommand,
  unsafeTools,
  type McpServer,
} from "~/utils/mcp"

/** The JSON-LD fields these tests read. */
interface LdItem {
  position: number
  name: string
  url?: string
  item?: string
}
interface LdNode {
  "@type": string
  "@id"?: string
  url?: string
  numberOfItems?: number
  hasPart?: { "@id": string }[]
  mainEntity?: { "@id": string }
  isPartOf?: { "@id": string }
  breadcrumb?: LdNode
  itemListElement: LdItem[]
  [key: string]: unknown
}

const site = "https://uniquedivine.com"

const server = (
  folder: string,
  overrides: Partial<McpServer> = {},
): McpServer => ({
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
  toolCount: 3,
  ...overrides,
})

describe("client snippets", () => {
  test("Claude Code adds the server under its folder name", () => {
    expect(claudeCommand(server("slack"))).toBe(
      "claude mcp add slack -- bunx @uniquedivine/mcp-slack@1.2.3",
    )
  })

  test("Codex TOML and Cursor JSON split the command from its arguments", () => {
    const pypi = server("telegram", {
      registry: "pypi",
      installCommand: "uvx uniquedivine-telegram-mcp@2.0.2",
    })
    expect(codexToml(pypi)).toBe(
      [
        "[mcp_servers.telegram]",
        'command = "uvx"',
        'args = ["uniquedivine-telegram-mcp@2.0.2"]',
      ].join("\n"),
    )
    expect(JSON.parse(cursorJson(pypi))).toEqual({
      mcpServers: {
        telegram: { command: "uvx", args: ["uniquedivine-telegram-mcp@2.0.2"] },
      },
    })
  })

  test("splitCommand rejects an empty command", () => {
    expect(splitCommand("  bunx  pkg@1  --flag ")).toEqual({
      command: "bunx",
      args: ["pkg@1", "--flag"],
    })
    expect(() => splitCommand(" ")).toThrow("Empty")
  })

  test("unsafeTools finds only the _unsafe suffix", () => {
    expect(
      unsafeTools([
        { name: "slack_delete_message" },
        { name: "slack_delete_message_unsafe" },
        { name: "unsafe_prefix" },
      ]).map((t) => t.name),
    ).toEqual(["slack_delete_message_unsafe"])
  })
})

describe("structured data", () => {
  const servers = [server("discord"), server("slack")]

  test("the catalog lists every server in order and links them as parts", () => {
    const graph = catalogJsonLd(servers, site)["@graph"] as LdNode[]
    const page = graph.find((node) => node["@type"] === "CollectionPage")!
    const list = graph.find((node) => node["@type"] === "ItemList")!
    expect(page.url).toBe(`${site}/mcp`)
    expect(page.mainEntity).toEqual({ "@id": `${site}/mcp#servers` })
    expect(list["@id"]).toBe(`${site}/mcp#servers`)
    expect(page.hasPart).toEqual([
      { "@id": `${site}/mcp/discord-mcp#software` },
      { "@id": `${site}/mcp/slack-mcp#software` },
    ])
    expect(list.numberOfItems).toBe(2)
    expect(
      list.itemListElement.map((item: LdItem) => [item.position, item.url]),
    ).toEqual([
      [1, `${site}/mcp/discord-mcp`],
      [2, `${site}/mcp/slack-mcp`],
    ])
    expect(page.breadcrumb!.itemListElement.map((i: LdItem) => i.item)).toEqual(
      [`${site}/`, `${site}/mcp`],
    )
  })

  test("a server page describes the software and belongs to the catalog", () => {
    const graph = serverJsonLd(server("slack"), site)["@graph"] as LdNode[]
    const app = graph.find((node) => node["@type"] === "SoftwareApplication")!
    const crumbs = graph.find((node) => node["@type"] === "BreadcrumbList")!
    expect(app).toMatchObject({
      name: "slack MCP",
      softwareVersion: "1.2.3",
      url: `${site}/mcp/slack-mcp`,
      license: "https://spdx.org/licenses/MIT",
      isPartOf: { "@id": `${site}/mcp#page` },
      maintainer: { "@id": `${site}/#person` },
    })
    expect(crumbs.itemListElement.map((i: LdItem) => [i.name, i.item])).toEqual(
      serverBreadcrumbs(server("slack")).map((c) => [
        c.name,
        new URL(c.path, site).href,
      ]),
    )
  })

  test("JSON-LD script text can't close its script element", () => {
    const text = jsonLdScript({ name: "</script><b>" })
    expect(text).not.toContain("</script>")
    expect(JSON.parse(text)).toEqual({ name: "</script><b>" })
  })
})
