/**
 * Schema for `mcp/<folder>/site-manifest.json` files that jiyuu generates.
 * `scripts/import-mcp.ts` validates each manifest with it before writing the
 * snapshot, and `src/content.config.ts` validates the snapshot again at build.
 */
import { z } from "astro/zod"

export const MCP_SCHEMA_VERSION = 1

const toolParam = z.strictObject({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
})

export const mcpTool = z.strictObject({
  name: z.string().regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().min(1),
  description: z.string(),
  readOnly: z.boolean(),
  destructive: z.boolean(),
  params: z.array(toolParam),
})

/** Matches `NOTE_MAX_LENGTH` in jiyuu's `mcp/scripts/site-manifest.ts`. */
export const NOTE_MAX_LENGTH = 300

/**
 * Value-shaped text a note must not hold. A copy of `NOTE_REJECTS` in jiyuu's
 * `mcp/scripts/site-manifest.ts`; keep the two lists identical.
 */
export const NOTE_REJECTS: [RegExp, string][] = [
  [/[A-Z][A-Z0-9_]*\s*=/, "an assignment such as NAME=value"],
  [/xox[a-z]-/i, "a Slack token"],
  [/[0-9a-f]{32,}/i, "a long hex run"],
  [/[A-Za-z0-9+/_-]{40,}={0,2}/, "a long base64 run"],
  [
    /\b(gh[pousr]_|github_pat_|glpat-|npm_|sk-|AKIA|AIza)|-----BEGIN/,
    "a known secret prefix",
  ],
]

/** Why a note is refused, or null. Mirrors jiyuu's `checkNote`. */
export function noteProblem(note: string): string | null {
  if (note.trim() === "") return "must be a non-empty string"
  if (note.length > NOTE_MAX_LENGTH)
    return `is ${note.length} characters; the limit is ${NOTE_MAX_LENGTH}`
  for (const [pattern, why] of NOTE_REJECTS)
    if (pattern.test(note)) return `looks like it holds ${why}; notes name only`
  return null
}

/** Names only. A manifest that carries a value fails the strict object. */
const envVar = z.strictObject({
  name: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  required: z.boolean(),
  secret: z.boolean(),
  /** Plain text, such as the multi-account `_<LABEL>` forms. */
  note: z.string().min(1).max(NOTE_MAX_LENGTH).optional(),
})

/** HTTPS only, so a link can't carry `javascript:` or `data:`. */
const httpsUrl = z.url({ protocol: /^https$/ })

export const mcpManifest = z.strictObject({
  schemaVersion: z.literal(MCP_SCHEMA_VERSION),
  folder: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*-mcp$/),
  title: z.string().min(1),
  description: z.string().min(1),
  registry: z.enum(["npm", "pypi"]),
  package: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+(?:[-+.][0-9A-Za-z.-]+)?$/),
  installCommand: z.string().min(1),
  runtime: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: httpsUrl,
  registryUrl: httpsUrl,
  envVars: z.array(envVar),
  toolCount: z.number().int().nonnegative(),
  readOnlyCount: z.number().int().nonnegative(),
  writeCount: z.number().int().nonnegative(),
  tools: z.array(mcpTool),
  installMarkdown: z.string(),
  generatedFrom: z.strictObject({ revision: z.string().min(1) }),
})

export type McpManifest = z.infer<typeof mcpManifest>
export type McpTool = z.infer<typeof mcpTool>

/**
 * Text that belongs to a hosted or paid service. Manifests must carry none;
 * the generator strips it, and the importer rejects anything that slips by.
 */
const SERVICE_TEXT = [/\bhosted\b/i, /\bpricing\b/i, /\bfree tier\b/i, /\$\d/]

const PACKAGE_NAME: Record<McpManifest["registry"], RegExp> = {
  npm: /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
  pypi: /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/,
}

/** Runner for each registry's published packages. */
const RUNNER: Record<McpManifest["registry"], string> = {
  npm: "bunx",
  pypi: "uvx",
}

/**
 * The only install command and links a manifest may carry. Each is built from
 * the registry, package, and folder, so nothing else can ride along into a
 * copy button or link. The command names the `latest` tag rather than the
 * manifest's version, so a published release never invalidates it.
 */
export function expectedUrls(
  m: Pick<McpManifest, "registry" | "package" | "folder">,
) {
  return {
    installCommand: `${RUNNER[m.registry]} ${m.package}@latest`,
    sourceUrl: `https://github.com/Unique-Divine/jiyuu/tree/main/mcp/${m.folder}`,
    registryUrl:
      m.registry === "npm"
        ? `https://www.npmjs.com/package/${m.package}`
        : `https://pypi.org/project/${m.package}/`,
  }
}

/**
 * Rules the shape alone can't express. Returns one message per problem, so
 * the importer can report every broken manifest at once.
 */
export function manifestProblems(m: McpManifest, folder: string): string[] {
  const problems: string[] = []
  const readOnly = m.tools.filter((tool) => tool.readOnly).length
  const names = new Set(m.tools.map((tool) => tool.name))
  if (m.folder !== folder) problems.push(`folder is "${m.folder}"`)
  if (m.slug !== `${m.folder}-mcp`)
    problems.push(`slug must be ${m.folder}-mcp`)
  if (names.size !== m.tools.length) problems.push("tool names repeat")
  if (m.toolCount !== m.tools.length)
    problems.push(`toolCount ${m.toolCount} != ${m.tools.length} tools`)
  if (m.readOnlyCount !== readOnly)
    problems.push(`readOnlyCount ${m.readOnlyCount} != ${readOnly}`)
  if (m.writeCount !== m.tools.length - readOnly)
    problems.push(`writeCount ${m.writeCount} != ${m.tools.length - readOnly}`)
  if (m.tools.some((tool) => tool.readOnly && tool.destructive))
    problems.push("a read-only tool is marked destructive")
  if (!PACKAGE_NAME[m.registry].test(m.package))
    problems.push(`package "${m.package}" is not a valid ${m.registry} name`)
  const expected = expectedUrls(m)
  if (m.installCommand !== expected.installCommand)
    problems.push(`installCommand must be "${expected.installCommand}"`)
  if (m.sourceUrl !== expected.sourceUrl)
    problems.push(`sourceUrl must be ${expected.sourceUrl}`)
  if (m.registryUrl !== expected.registryUrl)
    problems.push(`registryUrl must be ${expected.registryUrl}`)
  m.envVars.forEach((env, index) => {
    const problem = env.note === undefined ? null : noteProblem(env.note)
    if (problem) problems.push(`envVars[${index}].note ${problem}`)
  })
  const text = JSON.stringify(m)
  for (const pattern of SERVICE_TEXT)
    if (pattern.test(text)) problems.push(`service text matches ${pattern}`)
  return problems
}
