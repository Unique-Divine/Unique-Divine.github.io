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
import yaml from "js-yaml"
import type { Nodes, Root } from "mdast"
import { toString } from "mdast-util-to-string"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import { unified } from "unified"

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify)
const repository = "https://github.com/Unique-Divine/jiyuu"
const hash = (value: string) => createHash("sha256").update(value).digest("hex")

// Existing source TOCs contain a few stale fragments. Correct presentation links
// without changing the original skill files or their downloadable snapshots.
const fragmentCorrections: Record<string, Record<string, string>> = {
  "nibiru-gql/db-staking.md": {
    "7-lineage--dependency-flow-go-→-indexer-→-ts":
      "7-lineage--dependency-flow-go--indexer--ts",
    "8-cli-mapping-nibiru-↔-indexer": "8-cli-mapping-nibiru--indexer",
  },
  "nibiru-gql/db-user-balances.md": {
    "6-pagination--limits": "6-pagination-and-limits",
  },
  "sai-perps/references/sai-contracts.md": {
    "fee-config-validation-1": "fee-configuration-validation",
  },
  "sai-perps/references/sai-vaults.md": {
    "daily-risk-params": "daily-risk-parameters",
  },
  "sai-perps/references/sai-rest.md": {
    "24h-time-window-semantics": "24-hour-time-window-semantics",
    "get-": "get",
  },
}

interface Frontmatter {
  name?: string
  description?: string
  metadata?: { private?: boolean }
}
export interface SourceFile {
  source: string
  raw: string
}
export interface SkillPage {
  source: string
  route: string
  folder: string
  name: string
  title: string
  description: string
  kind: "skill" | "reference"
  content: string
  raw: string
  sha256: string
}

function splitMarkdown(raw: string): { data: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match
    ? {
        data: (yaml.load(match[1]) as Frontmatter) ?? {},
        body: raw.slice(match[0].length),
      }
    : { data: {}, body: raw }
}

export function skillRoute(source: string): string {
  const parts = source.split("/")
  if (parts[1] === "references") parts.splice(1, 1)
  if (parts.at(-1) === "SKILL.md") parts.pop()
  else
    parts[parts.length - 1] = parts.at(-1)!.replace(/\.md$/i, "").toLowerCase()
  return parts.join("/")
}

function walk(node: Nodes, action: (node: Nodes) => void) {
  action(node)
  if ("children" in node) for (const child of node.children) walk(child, action)
}

export function prepareSkills(files: SourceFile[]): SkillPage[] {
  const entries = new Map(
    files
      .filter((f) => f.source.endsWith("/SKILL.md"))
      .map((f) => [f.source.split("/")[0], splitMarkdown(f.raw).data]),
  )
  const included = files.filter(
    (f) =>
      entries.has(f.source.split("/")[0]) &&
      !entries.get(f.source.split("/")[0])?.metadata?.private,
  )
  const routes = new Map<string, string>()
  const sources = new Map<string, string>()
  for (const file of included) {
    const route = skillRoute(file.source)
    if (routes.has(route)) throw new Error(`Duplicate skill route: ${route}`)
    routes.set(route, file.source)
    sources.set(file.source, route)
  }
  return included
    .map(({ source, raw }) => {
      const folder = source.split("/")[0]
      const entry = entries.get(folder)!
      if (!entry.name || !entry.description)
        throw new Error(`Missing name or description: ${folder}`)
      const { body } = splitMarkdown(raw)
      const tree = processor.parse(body) as Root
      const heading = tree.children.find(
        (node) => node.type === "heading" && node.depth === 1,
      )
      const kind = source.endsWith("/SKILL.md") ? "skill" : "reference"
      const title = heading
        ? toString(heading)
        : kind === "skill"
          ? entry.name
          : path.posix.basename(source, ".md")
      if (heading) tree.children.splice(tree.children.indexOf(heading), 1)
      walk(tree, (node) => {
        if (
          !("url" in node) ||
          !node.url ||
          /^(?:[a-z][\w+.-]*:|\/)/i.test(node.url)
        )
          return
        const match = node.url.match(/^([^?#]*)([?#].*)?$/)!
        const target = match[1]
          ? path.posix.normalize(
              path.posix.join(
                path.posix.dirname(source),
                decodeURIComponent(match[1]),
              ),
            )
          : source
        let suffix = match[2] ?? ""
        if (suffix.startsWith("#")) {
          const fragment = decodeURIComponent(suffix.slice(1))
          const corrected = fragmentCorrections[target]?.[fragment]
          if (corrected) suffix = `#${corrected}`
        }
        if (!match[1]) {
          node.url = suffix
          return
        }
        const route = sources.get(target)
        if (route) node.url = `/ai-skills/${route}${suffix}`
        else if (target.endsWith(".md") && entries.has(target.split("/")[0])) {
          throw new Error(
            `Missing or excluded Markdown target in ${source}: ${node.url}`,
          )
        } else
          node.url = `${repository}/blob/main/${path.posix.normalize(`ai-skills/${target}`)}${suffix}`
      })
      return {
        source,
        route: sources.get(source)!,
        folder,
        name: entry.name,
        title,
        description:
          kind === "skill"
            ? entry.description
            : `Supporting reference for ${entry.name}.`,
        kind,
        content: processor.stringify(tree),
        raw,
        sha256: hash(raw),
      }
    })
    .sort((a, b) => a.source.localeCompare(b.source))
}

async function markdownFiles(root: string, prefix = ""): Promise<SourceFile[]> {
  const result: SourceFile[] = []
  for (const item of await readdir(path.join(root, prefix), {
    withFileTypes: true,
  })) {
    if (item.name.startsWith(".")) continue
    const source = path.posix.join(prefix, item.name)
    if (item.isDirectory()) result.push(...(await markdownFiles(root, source)))
    else if (item.isFile() && item.name.endsWith(".md"))
      result.push({
        source,
        raw: await readFile(path.join(root, source), "utf8"),
      })
  }
  return result
}

export async function importSkills(source: string, siteRoot: string) {
  const root = path.resolve(source)
  const pages = prepareSkills(await markdownFiles(path.join(root, "ai-skills")))
  if (!pages.length) throw new Error("No public skills found")
  const output = path.join(siteRoot, "src/content/skill")
  const rawOutput = path.join(siteRoot, "public/ai-skills-source")
  const manifestPath = path.join(siteRoot, "src/data/skills-provenance.json")
  let previous: { pages?: Record<string, { publishDate: string }> } = {}
  try {
    previous = JSON.parse(await readFile(manifestPath, "utf8"))
  } catch {
    /* First import. */
  }
  const date = new Date().toISOString().slice(0, 10)
  const manifest = {
    repository,
    revision: execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    dirty: Boolean(
      execFileSync(
        "git",
        ["-C", root, "status", "--porcelain", "--", "ai-skills"],
        { encoding: "utf8" },
      ).trim(),
    ),
    pages: {} as Record<
      string,
      { source: string; sha256: string; publishDate: string }
    >,
  }
  // Prepare the whole snapshot before replacing the generated directories.
  for (const dir of [output, rawOutput]) {
    await rm(`${dir}.next`, { recursive: true, force: true })
    await mkdir(`${dir}.next`, { recursive: true })
  }
  for (const page of pages) {
    const publishDate = previous.pages?.[page.route]?.publishDate ?? date
    const metadata = {
      title: page.title,
      description: page.description,
      name: page.name,
      folder: page.folder,
      source: page.source,
      route: page.route,
      kind: page.kind,
      stickyToc: true,
      publishDate,
    }
    const dest = path.join(`${output}.next`, `${page.route}.md`)
    const rawDest = path.join(`${rawOutput}.next`, page.source)
    await mkdir(path.dirname(dest), { recursive: true })
    await mkdir(path.dirname(rawDest), { recursive: true })
    await writeFile(
      dest,
      `---\n${yaml.dump(metadata, { lineWidth: -1 })}---\n\n${page.content}`,
    )
    await writeFile(rawDest, page.raw)
    manifest.pages[page.route] = {
      source: page.source,
      sha256: page.sha256,
      publishDate,
    }
  }
  for (const dir of [output, rawOutput]) {
    await rm(dir, { recursive: true, force: true })
    await rename(`${dir}.next`, dir)
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  console.log(
    `Imported ${pages.filter((p) => p.kind === "skill").length} skills and ${pages.filter((p) => p.kind === "reference").length} references.`,
  )
}

if (import.meta.main) {
  if (!process.argv[2])
    throw new Error("Usage: just skills-import /path/to/jiyuu")
  await importSkills(
    process.argv[2],
    fileURLToPath(new URL("../", import.meta.url)),
  )
}
