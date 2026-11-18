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

/** Names only. A manifest that carries a value fails the strict object. */
const envVar = z.strictObject({
  name: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  required: z.boolean(),
  secret: z.boolean(),
})

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
  sourceUrl: z.url(),
  registryUrl: z.url(),
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
  if (!m.installCommand.includes(`${m.package}@${m.version}`))
    problems.push(`installCommand must pin ${m.package}@${m.version}`)
  const text = JSON.stringify(m)
  for (const pattern of SERVICE_TEXT)
    if (pattern.test(text)) problems.push(`service text matches ${pattern}`)
  return problems
}
