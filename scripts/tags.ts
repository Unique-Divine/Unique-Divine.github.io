import { Glob } from "bun"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { load } from "js-yaml"

import { getTagInventory, type TaggedArticle } from "../src/utils/tags"

const contentDir = fileURLToPath(
  new URL("../src/content/post/", import.meta.url),
)
const articles: TaggedArticle[] = []
for await (const id of new Glob("**/*.{md,mdx}").scan(contentDir)) {
  const source = await readFile(`${contentDir}/${id}`, "utf8")
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
  if (!frontmatter) throw new Error(`Missing frontmatter: ${id}`)
  const data = load(frontmatter[1]) as {
    title?: unknown
    tags?: unknown
    draft?: unknown
  }
  if (
    typeof data?.title !== "string" ||
    (data.tags !== undefined &&
      (!Array.isArray(data.tags) ||
        data.tags.some((tag) => typeof tag !== "string")))
  )
    throw new Error(`Invalid title or tags: ${id}`)
  articles.push({
    id,
    title: data.title,
    draft: data.draft === true,
    tags: data.tags as string[] | undefined,
  })
}

const inventory = getTagInventory(articles)
for (const [label, rows] of [
  ["Published tags", inventory.filter((tag) => tag.published.length > 0)],
  ["Draft-only tags", inventory.filter((tag) => tag.published.length === 0)],
] as const) {
  console.log(`\n${label}`)
  for (const tag of rows) {
    console.log(
      `\n${tag.slug || "<empty slug>"} | ${tag.title} | ${tag.published.length} published | ${tag.drafts.length} drafts${tag.collision ? " | NORMALIZATION COLLISION" : ""}`,
    )
    console.log(
      `  Spellings: ${tag.spellings.map((raw) => JSON.stringify(raw)).join(", ")}`,
    )
    for (const article of tag.published)
      console.log(`  ${article.id}: ${article.title}`)
    for (const article of tag.drafts)
      console.log(`  [draft] ${article.id}: ${article.title}`)
  }
}
