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

- a `site-manifest.json` that isn't a regular file, such as a symlink
- counts that disagree with the tool list
- a slug other than `<folder>-mcp`
- an install command other than exactly `bunx <package>@latest` for npm or
  `uvx <package>@latest` for PyPI. A version pin goes stale with the next
  release, so the site never shows one. Field `version` still names the
  release the page describes.
- a source or registry URL other than the jiyuu tree path and the
  package's npm or PyPI page
- env var entries with anything besides a name, two flags, and a note
- a note over 300 characters or one shaped like a value: `NAME=`, a Slack
  token, a long hex or base64 run, or a known secret prefix. These rules
  copy `checkNote` in jiyuu's `mcp/scripts/site-manifest.ts`.
- hosted-service or pricing text
- fixture manifests mixed with real ones

It reports every problem at once and stages the new snapshot in
`src/content/mcp.next`, provenance included. Provenance lives in the snapshot
directory as `src/content/mcp/_provenance.json`, which the `mcp` collection
skips, so content and provenance always move together. The swap renames the
current directory to `mcp.prev`, renames `mcp.next` into place, and removes
`mcp.prev`. A failed rename puts the old directory back. If an import dies
between the renames, the next run restores `mcp.prev` before it reads
anything; if it dies after them, the next run removes the stale `mcp.prev`.

The provenance records the jiyuu checkout's `HEAD`, whether its `mcp/`
directory was dirty, and for each server its version, hash, and
`generatedFrom.revision`. Revisions are per server: jiyuu keeps the commit
that last touched each server's inputs, so they can differ. An unchanged
reimport keeps the file byte-for-byte.

## Fixtures

Directory `scripts/fixtures/mcp-jiyuu` is a jiyuu-shaped tree of test
manifests with `generatedFrom.revision` set to `fixture`. The importer tests
read it. Importing it sets `fixture: true` in the provenance, and every MCP
page then shows a "Preview data" notice. Reimport from jiyuu before
publishing.

## Pages and Discovery

Each server page has install snippets for Claude Code, Codex, and Cursor,
built from `installCommand`. The snippets carry a `<NAME>` placeholder for
each required or secret env var, never a value, and the page links to the
README section on signing in. The page also lists every env var name with
its note, safety notes, a searchable
tools table, and cards for the other servers. The catalog and server pages
carry `SoftwareApplication`, `ItemList`, and `BreadcrumbList` JSON-LD through
the layout's `head` slot. The XML sitemap, the HTML sitemap, `llms.txt`, and
the header menu list the catalog, and the sitemaps and `llms.txt` list each
server.

The Discord bot policy page stays at `/discord-mcp`. It links to
`/mcp/discord-mcp`, and the server page links back through `RELATED_PAGES` in
`src/utils/mcp.ts`.
