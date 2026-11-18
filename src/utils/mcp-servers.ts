import { getCollection } from "astro:content"

import provenance from "~/data/mcp-provenance.json"

/** Every imported MCP server, by title. */
export async function getMcpServers() {
  return (await getCollection("mcp"))
    .map((entry) => entry.data)
    .sort((a, b) => a.title.localeCompare(b.title, "en"))
}

/**
 * True while the snapshot comes from `scripts/fixtures/mcp-jiyuu` instead of
 * a jiyuu import. The pages show a notice so fixture data can't pass as real.
 */
export const MCP_FIXTURE = provenance.fixture
