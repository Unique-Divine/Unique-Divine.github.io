import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  lstat,
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
  /** HEAD of the jiyuu checkout at import, or null for fixtures. */
  checkout: string | null
  dirty: boolean | null
  fixture: boolean
  servers: Record<
    string,
    {
      source: string
      version: string
      /** The jiyuu commit this server's manifest was generated from. */
      revision: string
      sha256: string
      importDate: string
    }
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
 * Symlinks are refused, so the importer never reads outside `mcp/`.
 */
export async function readManifests(root: string): Promise<ManifestSource[]> {
  const mcpDir = path.join(root, "mcp")
  const sources: ManifestSource[] = []
  const entries = await readdir(mcpDir, { withFileTypes: true })
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue
    const file = path.join(mcpDir, entry.name, MANIFEST_FILE)
    try {
      if (!(await lstat(file)).isFile())
        throw new Error(
          `Not a regular file: mcp/${entry.name}/${MANIFEST_FILE}`,
        )
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue
      throw error
    }
    sources.push({ folder: entry.name, raw: await readFile(file, "utf8") })
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
 * Whether the manifests are fixtures. Each server keeps the revision of the
 * last jiyuu commit that touched its inputs, so real revisions may differ;
 * fixtures and real manifests must not mix.
 */
export function isFixtureSet(manifests: McpManifest[]): boolean {
  const fixtures = manifests.filter(
    (m) => m.generatedFrom.revision === FIXTURE_REVISION,
  ).length
  if (fixtures && fixtures !== manifests.length)
    throw new Error("Fixture and jiyuu manifests can't be imported together")
  return fixtures > 0
}

/** The filesystem calls `swapSnapshot` makes, so tests can inject failures. */
export interface SwapFs {
  rename: (from: string, to: string) => Promise<void>
  rm: (
    target: string,
    options: { recursive: true; force: true },
  ) => Promise<void>
  writeFile: (target: string, text: string) => Promise<void>
  exists: (target: string) => Promise<boolean>
}

const exists = async (target: string) => {
  try {
    await lstat(target)
    return true
  } catch {
    return false
  }
}

export const nodeSwapFs: SwapFs = { rename, rm, writeFile, exists }

/**
 * Restores `<output>.prev` when a crash left it without `<output>`, and
 * clears leftovers from an earlier run.
 */
export async function recoverSnapshot(
  output: string,
  provenancePath: string,
  fs: SwapFs = nodeSwapFs,
) {
  if (!(await fs.exists(output)) && (await fs.exists(`${output}.prev`)))
    await fs.rename(`${output}.prev`, output)
  await fs.rm(`${output}.prev`, { recursive: true, force: true })
  await fs.rm(`${output}.next`, { recursive: true, force: true })
  await fs.rm(`${provenancePath}.next`, { recursive: true, force: true })
}

/**
 * Moves `<output>.next` into place with its provenance. The old directory
 * and provenance stay until both new ones are in place; any failure puts
 * them back and rethrows.
 */
export async function swapSnapshot(
  output: string,
  provenancePath: string,
  provenance: string,
  fs: SwapFs = nodeSwapFs,
) {
  const next = `${output}.next`
  const prev = `${output}.prev`
  const provenanceNext = `${provenancePath}.next`
  await fs.writeFile(provenanceNext, provenance)
  const hadOutput = await fs.exists(output)
  let moved = false
  try {
    if (hadOutput) await fs.rename(output, prev)
    await fs.rename(next, output)
    moved = true
    await fs.rename(provenanceNext, provenancePath)
  } catch (error) {
    try {
      if (moved) await fs.rename(output, next)
      if (hadOutput && (await fs.exists(prev))) await fs.rename(prev, output)
    } finally {
      await fs.rm(provenanceNext, { recursive: true, force: true })
    }
    throw error
  }
  await fs.rm(prev, { recursive: true, force: true })
}

export async function importMcp(
  source: string,
  siteRoot: string,
  fs: SwapFs = nodeSwapFs,
) {
  const root = path.resolve(source)
  const output = path.join(siteRoot, "src/content/mcp")
  const provenancePath = path.join(siteRoot, "src/data/mcp-provenance.json")
  // Repair an interrupted earlier import before anything else can fail.
  await recoverSnapshot(output, provenancePath, fs)
  const sources = await readManifests(root)
  const manifests = prepareManifests(sources)
  if (!manifests.length)
    throw new Error(`No ${MANIFEST_FILE} files in ${root}/mcp`)
  const fixture = isFixtureSet(manifests)
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
    checkout: fixture ? null : git(root, ["rev-parse", "HEAD"]),
    dirty: status === null ? null : Boolean(status),
    fixture,
    servers: {},
  }
  const raw = new Map(sources.map((s) => [s.folder, s.raw]))
  // Write the whole snapshot beside the old one, then swap directories.
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
      revision: manifest.generatedFrom.revision,
      sha256,
      // Keep the date while the manifest is unchanged, so reimports are stable.
      importDate: prior?.sha256 === sha256 ? prior.importDate : date,
    }
  }
  await swapSnapshot(
    output,
    provenancePath,
    JSON.stringify(provenance, null, 2) + "\n",
    fs,
  )
  console.log(
    `Imported ${manifests.length} MCP servers from ${fixture ? "fixtures" : root}.`,
  )
}

if (import.meta.main) {
  if (!process.argv[2]) throw new Error("Usage: just mcp-import /path/to/jiyuu")
  await importMcp(
    process.argv[2],
    fileURLToPath(new URL("../", import.meta.url)),
  )
}
