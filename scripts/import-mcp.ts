import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  manifestProblems,
  mcpManifest,
  type McpManifest,
} from "../src/utils/mcp-schema"

/** The one file the importer reads in each `mcp/<folder>/` directory. */
export const MANIFEST_FILE = "site-manifest.json"
/** `generatedFrom.revision` of hand-made fixtures, never a jiyuu commit. */
export const FIXTURE_REVISION = "fixture"

export interface ManifestSource {
  folder: string
  raw: string
}

export interface McpProvenance {
  repository: string
  revision: string
  dirty: boolean | null
  fixture: boolean
  servers: Record<
    string,
    { source: string; version: string; sha256: string; importDate: string }
  >
}

const repository = "https://github.com/Unique-Divine/jiyuu"
const hash = (value: string) => createHash("sha256").update(value).digest("hex")

/**
 * Parses and checks every manifest. Throws one error naming every problem,
 * so a bad import never replaces the snapshot.
 */
export function prepareManifests(sources: ManifestSource[]): McpManifest[] {
  const problems: string[] = []
  const manifests: McpManifest[] = []
  const slugs = new Set<string>()
  for (const { folder, raw } of sources) {
    const where = `mcp/${folder}/${MANIFEST_FILE}`
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch (error) {
      problems.push(`${where}: invalid JSON (${(error as Error).message})`)
      continue
    }
    const parsed = mcpManifest.safeParse(json)
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        problems.push(`${where}: ${issue.path.join(".")}: ${issue.message}`)
      continue
    }
    for (const problem of manifestProblems(parsed.data, folder))
      problems.push(`${where}: ${problem}`)
    if (slugs.has(parsed.data.slug))
      problems.push(`${where}: duplicate slug ${parsed.data.slug}`)
    slugs.add(parsed.data.slug)
    manifests.push(parsed.data)
  }
  if (problems.length)
    throw new Error(`Invalid MCP manifests:\n- ${problems.join("\n- ")}`)
  return manifests.sort((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Reads `<root>/mcp/<folder>/site-manifest.json` for each folder and nothing
 * else. A folder without the file is a server that opted out of the site.
 */
export async function readManifests(root: string): Promise<ManifestSource[]> {
  const mcpDir = path.join(root, "mcp")
  const sources: ManifestSource[] = []
  const entries = await readdir(mcpDir, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue
    try {
      sources.push({
        folder: entry.name,
        raw: await readFile(
          path.join(mcpDir, entry.name, MANIFEST_FILE),
          "utf8",
        ),
      })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
  return sources
}

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

/**
 * The jiyuu revision the manifests record. They come from one generator run,
 * so they must agree.
 */
export function manifestRevision(manifests: McpManifest[]): string {
  const revisions = new Set(manifests.map((m) => m.generatedFrom.revision))
  if (revisions.size !== 1)
    throw new Error(`Manifests disagree on revision: ${[...revisions]}`)
  return [...revisions][0]
}

export async function importMcp(source: string, siteRoot: string) {
  const root = path.resolve(source)
  const sources = await readManifests(root)
  const manifests = prepareManifests(sources)
  if (!manifests.length)
    throw new Error(`No ${MANIFEST_FILE} files in ${root}/mcp`)
  const revision = manifestRevision(manifests)
  const fixture = revision === FIXTURE_REVISION
  const output = path.join(siteRoot, "src/content/mcp")
  const provenancePath = path.join(siteRoot, "src/data/mcp-provenance.json")
  let previous: Partial<McpProvenance> = {}
  try {
    previous = JSON.parse(await readFile(provenancePath, "utf8"))
  } catch {
    /* First import. */
  }
  const date = new Date().toISOString().slice(0, 10)
  const status = fixture
    ? null
    : git(root, ["status", "--porcelain", "--", "mcp"])
  const provenance: McpProvenance = {
    repository,
    revision,
    dirty: status === null ? null : Boolean(status),
    fixture,
    servers: {},
  }
  const raw = new Map(sources.map((s) => [s.folder, s.raw]))
  // Write the whole snapshot beside the old one, then swap directories.
  await rm(`${output}.next`, { recursive: true, force: true })
  await mkdir(`${output}.next`, { recursive: true })
  for (const manifest of manifests) {
    const text = raw.get(manifest.folder)!
    const sha256 = hash(text)
    const prior = previous.servers?.[manifest.slug]
    await writeFile(
      path.join(`${output}.next`, `${manifest.slug}.json`),
      JSON.stringify(manifest, null, 2) + "\n",
    )
    provenance.servers[manifest.slug] = {
      source: `mcp/${manifest.folder}/${MANIFEST_FILE}`,
      version: manifest.version,
      sha256,
      // Keep the date while the manifest is unchanged, so reimports are stable.
      importDate: prior?.sha256 === sha256 ? prior.importDate : date,
    }
  }
  await rm(output, { recursive: true, force: true })
  await rename(`${output}.next`, output)
  await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + "\n")
  console.log(
    `Imported ${manifests.length} MCP servers from ${fixture ? "fixtures" : `jiyuu ${revision.slice(0, 12)}`}.`,
  )
}

if (import.meta.main) {
  if (!process.argv[2]) throw new Error("Usage: just mcp-import /path/to/jiyuu")
  await importMcp(
    process.argv[2],
    fileURLToPath(new URL("../", import.meta.url)),
  )
}
