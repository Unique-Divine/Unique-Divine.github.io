# MCP Server Pages

The catalog is `/mcp`, with one page per server at `/mcp/<slug>`, such as
`/mcp/slack-mcp`. The pages build from the `mcp` content collection, a JSON
snapshot in `src/content/mcp/`. The build needs no jiyuu checkout or network
access.

Refresh the snapshot from the website checkout:

```sh
just mcp-import ../boku/jiyuu
just mcp-test
just build
```

## Import

Script `scripts/import-mcp.ts` reads `<jiyuu>/mcp/<folder>/site-manifest.json`
for each folder and no other file. Jiyuu's `just mcp-manifest` generates those
manifests; a server that opts out has none and gets no page. Module
`src/utils/mcp-schema.ts` holds the schema that both the importer and the
collection use. The importer also rejects:

- counts that disagree with the tool list
- a slug other than `<folder>-mcp`
- an install command that doesn't pin `<package>@<version>`
- env var entries with anything besides a name and two flags
- hosted-service or pricing text

It reports every problem at once, writes the new snapshot to
`src/content/mcp.next`, and swaps directories only after every file is
written. File `src/data/mcp-provenance.json` records the jiyuu revision from
the manifests, whether jiyuu's `mcp/` directory was dirty, and each
manifest's hash and version. An unchanged reimport keeps the file
byte-for-byte.

## Fixtures

Directory `scripts/fixtures/mcp-jiyuu` is a jiyuu-shaped tree of test
manifests with `generatedFrom.revision` set to `fixture`. The importer tests
read it. Importing it sets `fixture: true` in the provenance, and every MCP
page then shows a "Preview data" notice. Reimport from jiyuu before
publishing.

## Pages and Discovery

Each server page has install snippets for Claude Code, Codex, and Cursor,
built from `installCommand`, plus env var names, safety notes, a searchable
tools table, and cards for the other servers. The catalog and server pages
carry `SoftwareApplication`, `ItemList`, and `BreadcrumbList` JSON-LD through
the layout's `head` slot. The XML sitemap, the HTML sitemap, `llms.txt`, and
the header menu list the catalog, and the sitemaps and `llms.txt` list each
server.

The Discord bot policy page stays at `/discord-mcp`. It links to
`/mcp/discord-mcp`, and the server page links back through `RELATED_PAGES` in
`src/utils/mcp.ts`.
