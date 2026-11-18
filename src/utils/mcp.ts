/**
 * Pure helpers for the `/mcp` pages: client config snippets, JSON-LD, and
 * per-server notes. Pages load the `mcp` collection and pass plain data in.
 */
import type { McpManifest } from "./mcp-schema"

export const MCP_CATALOG_PATH = "/mcp"
export const MCP_CATALOG_TITLE = "MCP Servers"
export const MCP_CATALOG_DESCRIPTION =
  "Model Context Protocol servers I maintain and publish, with install " +
  "commands for Claude Code, Codex, and Cursor and every tool listed."
export const MAINTAINER = "Unique Divine"

/** Only the fields the helpers read, so tests can build small servers. */
export type McpServer = Pick<
  McpManifest,
  | "folder"
  | "slug"
  | "title"
  | "description"
  | "registry"
  | "package"
  | "version"
  | "installCommand"
  | "runtime"
  | "license"
  | "sourceUrl"
  | "registryUrl"
  | "toolCount"
  | "envVars"
>

export const serverPath = (slug: string) => `${MCP_CATALOG_PATH}/${slug}`

export const registryLabel = (registry: McpManifest["registry"]) =>
  registry === "npm" ? "npm" : "PyPI"

/** Splits `bunx pkg@latest --flag` into a command and its arguments. */
export function splitCommand(line: string): {
  command: string
  args: string[]
} {
  const [command, ...args] = line.trim().split(/\s+/)
  if (!command) throw new Error("Empty install command")
  return { command, args }
}

/**
 * Env vars the snippets carry as placeholders: required ones and
 * credentials. Optional switches stay in the table only.
 */
export const snippetEnv = (server: McpServer) =>
  server.envVars
    .filter((env) => env.required || env.secret)
    .map((env) => env.name)

/** A placeholder, never a value: `<SLACK_TOKEN>`. */
export const placeholder = (name: string) => `<${name}>`

export function claudeCommand(server: McpServer): string {
  // Quoted, so the shell doesn't read `<NAME>` as a redirect.
  const env = snippetEnv(server).map(
    (name) => `-e '${name}=${placeholder(name)}' `,
  )
  return `claude mcp add ${server.folder} ${env.join("")}-- ${server.installCommand}`
}

const tomlString = (value: string) => JSON.stringify(value)

export function codexToml(server: McpServer): string {
  const { command, args } = splitCommand(server.installCommand)
  const env = snippetEnv(server)
  return [
    `[mcp_servers.${server.folder}]`,
    `command = ${tomlString(command)}`,
    `args = [${args.map(tomlString).join(", ")}]`,
    ...(env.length
      ? [
          `env = { ${env
            .map((name) => `${name} = ${tomlString(placeholder(name))}`)
            .join(", ")} }`,
        ]
      : []),
  ].join("\n")
}

export function cursorJson(server: McpServer): string {
  const { command, args } = splitCommand(server.installCommand)
  const env = snippetEnv(server)
  return JSON.stringify(
    {
      mcpServers: {
        [server.folder]: {
          command,
          args,
          ...(env.length
            ? {
                env: Object.fromEntries(
                  env.map((name) => [name, placeholder(name)]),
                ),
              }
            : {}),
        },
      },
    },
    null,
    2,
  )
}

/** README sections that explain how each server signs in. */
const AUTH_SECTIONS: Record<string, string> = {
  "slack-mcp": "authenticate",
  "telegram-mcp": "authenticate",
  "discord-mcp": "discord-bot-setup",
}

/** The server README on GitHub, at its sign-in section when known. */
export function authDocsUrl(server: McpServer): string {
  const readme = `${server.sourceUrl.replace("/tree/", "/blob/")}/README.md`
  const section = AUTH_SECTIONS[server.slug]
  return section ? `${readme}#${section}` : readme
}

/** Tools named `*_unsafe` drop a guard that their plain twin keeps. */
export const unsafeTools = <T extends { name: string }>(tools: T[]) =>
  tools.filter((tool) => tool.name.endsWith("_unsafe"))

/** Pages elsewhere on the site that belong to one server. */
export const RELATED_PAGES: Record<string, { href: string; label: string }[]> =
  {
    "discord-mcp": [
      { href: "/discord-mcp", label: "Discord bot policy and intent review" },
      { href: "/discord-mcp/privacy-policy", label: "Privacy policy" },
      { href: "/discord-mcp/terms", label: "Terms of service" },
    ],
  }

export interface Breadcrumb {
  name: string
  path: string
}

export const catalogBreadcrumbs = (): Breadcrumb[] => [
  { name: "Home", path: "/" },
  { name: MCP_CATALOG_TITLE, path: MCP_CATALOG_PATH },
]

export const serverBreadcrumbs = (server: McpServer): Breadcrumb[] => [
  ...catalogBreadcrumbs(),
  { name: server.title, path: serverPath(server.slug) },
]

/** Absolute URL without a trailing slash, matching the sitemap. */
export function absolute(path: string, site: string): string {
  const url = new URL(path, site)
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "")
  return url.href
}

type JsonLd = Record<string, unknown>

const person = (site: string): JsonLd => ({
  "@type": "Person",
  "@id": `${absolute("/", site)}#person`,
  name: MAINTAINER,
  url: absolute("/", site),
})

const catalogId = (site: string) => `${absolute(MCP_CATALOG_PATH, site)}#page`
const softwareId = (slug: string, site: string) =>
  `${absolute(serverPath(slug), site)}#software`

function breadcrumbList(crumbs: Breadcrumb[], site: string): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path, site),
    })),
  }
}

export function softwareApplication(server: McpServer, site: string): JsonLd {
  return {
    "@type": "SoftwareApplication",
    "@id": softwareId(server.slug, site),
    name: server.title,
    description: server.description,
    url: absolute(serverPath(server.slug), site),
    softwareVersion: server.version,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Model Context Protocol server",
    operatingSystem: "Linux, macOS, Windows",
    softwareRequirements: server.runtime,
    license: `https://spdx.org/licenses/${server.license}`,
    downloadUrl: server.registryUrl,
    installUrl: server.registryUrl,
    sameAs: [server.registryUrl, server.sourceUrl],
    author: { "@id": person(site)["@id"] },
    maintainer: { "@id": person(site)["@id"] },
    isPartOf: {
      "@type": "CollectionPage",
      "@id": catalogId(site),
      url: absolute(MCP_CATALOG_PATH, site),
    },
  }
}

/** `/mcp`: the catalog page, its ordered list, each server, and crumbs. */
export function catalogJsonLd(servers: McpServer[], site: string): JsonLd {
  const listId = `${absolute(MCP_CATALOG_PATH, site)}#servers`
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(site),
      {
        "@type": "CollectionPage",
        "@id": catalogId(site),
        url: absolute(MCP_CATALOG_PATH, site),
        name: MCP_CATALOG_TITLE,
        description: MCP_CATALOG_DESCRIPTION,
        author: { "@id": person(site)["@id"] },
        mainEntity: { "@id": listId },
        hasPart: servers.map((server) => ({
          "@id": softwareId(server.slug, site),
        })),
        breadcrumb: breadcrumbList(catalogBreadcrumbs(), site),
      },
      {
        "@type": "ItemList",
        "@id": listId,
        name: `MCP servers maintained by ${MAINTAINER}`,
        numberOfItems: servers.length,
        itemListElement: servers.map((server, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: server.title,
          url: absolute(serverPath(server.slug), site),
        })),
      },
      ...servers.map((server) => softwareApplication(server, site)),
    ],
  }
}

/** `/mcp/<slug>`: the server, its maintainer, and crumbs. */
export function serverJsonLd(server: McpServer, site: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(site),
      softwareApplication(server, site),
      breadcrumbList(serverBreadcrumbs(server), site),
    ],
  }
}

/** JSON for a `<script type="application/ld+json">` body. */
export const jsonLdScript = (data: JsonLd) =>
  JSON.stringify(data).replace(/</g, "\\u003c")
