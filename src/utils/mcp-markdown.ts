/**
 * Markdown bodies for the `/mcp` pages' copies, built from the manifests.
 * These functions are pure; `src/utils/markdown-copies.ts` loads the servers
 * and adds the title and page URL. Links stay site-relative here and become
 * absolute when the copy is built.
 */
import { markdownTable } from "./markdown-copy"
import {
  authDocsUrl,
  claudeCommand,
  codexToml,
  cursorJson,
  MAINTAINER,
  MCP_CATALOG_DESCRIPTION,
  registryLabel,
  serverPath,
} from "./mcp"
import type { McpManifest, McpTool } from "./mcp-schema"

/** A fenced code block whose fence is longer than any backtick run inside. */
export function codeBlock(code: string, lang = ""): string {
  const longest = Math.max(
    2,
    ...[...code.matchAll(/`+/g)].map((run) => run[0].length),
  )
  const fence = "`".repeat(longest + 1)
  return `${fence}${lang}\n${code}\n${fence}`
}

/** Inline code that survives backticks in the text. */
export function inlineCode(text: string): string {
  const longest = Math.max(
    0,
    ...[...text.matchAll(/`+/g)].map((run) => run[0].length),
  )
  const fence = "`".repeat(longest + 1)
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : ""
  return `${fence}${pad}${text}${pad}${fence}`
}

/** Matches the Access column on the HTML page. */
export const toolAccess = (tool: Pick<McpTool, "readOnly" | "destructive">) =>
  tool.readOnly ? "read" : tool.destructive ? "destructive" : "write"

const toolParams = (tool: McpTool) =>
  tool.params.length === 0
    ? "None"
    : tool.params
        .map((param) => (param.required ? `${param.name}*` : param.name))
        .map(inlineCode)
        .join(", ")

/**
 * One server page as Markdown: description, package facts, install snippets
 * for each client, environment variables, and every tool.
 */
export function mcpServerMarkdown(server: McpManifest): string {
  const registry = registryLabel(server.registry)
  const sections = [
    server.description,
    [
      `Maintained by ${MAINTAINER}.`,
      `Package [${inlineCode(server.package)}](${server.registryUrl}) on`,
      `${registry}, version ${server.version}, ${server.license} license.`,
      `[Source](${server.sourceUrl}).`,
    ].join(" "),
    "## Install",
    [
      `Needs ${server.runtime}. The commands pin version ${server.version};`,
      "bump the pin to upgrade. Each snippet has a `<NAME>` placeholder for",
      "every credential or required variable. Replace them with your own",
      "values in your client config. To get the credentials, see the",
      `[${server.title} sign-in instructions](${authDocsUrl(server)}).`,
    ].join(" "),
    "### Claude Code",
    codeBlock(claudeCommand(server), "sh"),
    "### Codex",
    "Add this entry to file `~/.codex/config.toml`:",
    codeBlock(codexToml(server), "toml"),
    "### Cursor",
    "Add this entry to file `~/.cursor/mcp.json`, or to file " +
      "`.cursor/mcp.json` in a project:",
    codeBlock(cursorJson(server), "json"),
  ]
  if (server.envVars.length > 0)
    sections.push(
      "## Environment Variables",
      "Names only. Set values in your shell or your client's server entry, " +
        "never in a prompt.",
      markdownTable(
        ["Name", "Required", "Secret", "Notes"],
        server.envVars.map((env) => [
          inlineCode(env.name),
          env.required ? "Yes" : "No",
          env.secret ? "Yes" : "No",
          env.note ?? "",
        ]),
      ),
    )
  sections.push(
    "## Tools",
    `${server.toolCount} tools: ${server.readOnlyCount} only read, and ` +
      `${server.writeCount} can change state under your account or bot. ` +
      "Access `read` changes nothing; `destructive` tools need your " +
      "client's approval prompt.",
    markdownTable(
      ["Tool", "Title", "Access", "Description", "Parameters"],
      server.tools.map((tool) => [
        inlineCode(tool.name),
        tool.title,
        toolAccess(tool),
        tool.description,
        toolParams(tool),
      ]),
    ),
    "\\* Required parameter.",
  )
  return sections.join("\n\n") + "\n"
}

/** Rules from the catalog page's "Before you connect one" list. */
const CATALOG_RULES = [
  "Each server signs in as you or as your bot. Its write tools post, edit, " +
    "and delete with that identity. Server pages flag the destructive ones.",
  "To check a server's version, where it runs from, or whether an update " +
    "exists, ask the agent to call the `mcp_info` tool. Agents should never " +
    "read MCP client config files to find out; those files hold secrets.",
  "Pages list environment variable names only. Put the values in your " +
    "shell or client config, not in a prompt.",
]

/** The `/mcp` catalog as Markdown: every server, then the rules. */
export function mcpCatalogMarkdown(servers: McpManifest[]): string {
  const tools = servers.reduce((sum, server) => sum + server.toolCount, 0)
  return [
    MCP_CATALOG_DESCRIPTION,
    `Maintained by ${MAINTAINER}. ${servers.length} servers, ${tools} tools.`,
    "## Servers",
    servers
      .map(
        (server) =>
          `- [${server.title}](${serverPath(server.slug)}): ` +
          `${server.description} ${server.toolCount} tools, ` +
          `${server.readOnlyCount} read-only ` +
          `([Markdown](${serverPath(server.slug)}.md)).`,
      )
      .join("\n"),
    "## Before You Connect One",
    CATALOG_RULES.map((rule) => `- ${rule}`).join("\n"),
  ].join("\n\n") + "\n"
}
