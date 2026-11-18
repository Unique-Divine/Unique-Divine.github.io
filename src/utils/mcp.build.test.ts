import { expect } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { parse } from "ultrahtml"
import { querySelector, querySelectorAll } from "ultrahtml/selector"

import { llmsLinks } from "~/utils/llms"
import { buildTest, repoPath, repoUrl } from "~/utils/repo-paths"

/** The JSON-LD fields these tests read. */
interface LdItem {
  position: number
  name: string
  url?: string
  item?: string
}
interface LdNode {
  "@type": string
  "@id"?: string
  url?: string
  numberOfItems?: number
  hasPart?: { "@id": string }[]
  mainEntity?: { "@id": string }
  isPartOf?: { "@id": string }
  breadcrumb?: LdNode
  itemListElement: LdItem[]
  [key: string]: unknown
}

const dist = repoUrl("dist/")
const site = "https://uniquedivine.com"
const read = (file: string) => readFileSync(new URL(file, dist), "utf8")
const slugs = readdirSync(repoPath("src/content/mcp"))
  .filter((file) => file.endsWith(".json") && !file.startsWith("_"))
  .map((file) => file.replace(/\.json$/, ""))
  .sort()

const page = (path: string) => parse(read(`${path}/index.html`))
const hrefs = (document: ReturnType<typeof parse>) =>
  new Set(querySelectorAll(document, "a").map((a) => a.attributes.href))
const jsonLd = (document: ReturnType<typeof parse>) =>
  JSON.parse(
    querySelector(document, 'script[type="application/ld+json"]').children[0]
      .value,
  )

buildTest("the catalog links every server and lists them in JSON-LD", () => {
  const document = page("mcp")
  const links = hrefs(document)
  for (const slug of slugs) expect(links.has(`/mcp/${slug}`)).toBe(true)
  const graph = jsonLd(document)["@graph"]
  const list = graph.find((node: LdNode) => node["@type"] === "ItemList")
  expect(list.itemListElement.map((item: LdItem) => item.url).sort()).toEqual(
    slugs.map((slug) => `${site}/mcp/${slug}`),
  )
})

buildTest(
  "each server page has SEO tags, crumbs, and links to the rest",
  () => {
    for (const slug of slugs) {
      const document = page(`mcp/${slug}`)
      const meta = (selector: string) =>
        querySelector(document, selector)?.attributes
      expect(meta('link[rel="canonical"]')?.href).toBe(`${site}/mcp/${slug}`)
      expect(meta('meta[property="og:url"]')?.content).toBe(
        `${site}/mcp/${slug}`,
      )
      expect(meta('meta[property="og:title"]')?.content).toBeTruthy()
      expect(meta('meta[name="description"]')?.content).toBeTruthy()
      const graph = jsonLd(document)["@graph"]
      const app = graph.find(
        (node: LdNode) => node["@type"] === "SoftwareApplication",
      )
      expect(app.url).toBe(`${site}/mcp/${slug}`)
      expect(app.isPartOf["@id"]).toBe(`${site}/mcp#page`)
      const crumbs = graph.find(
        (node: LdNode) => node["@type"] === "BreadcrumbList",
      )
      expect(crumbs.itemListElement.map((item: LdItem) => item.item)).toEqual([
        `${site}/`,
        `${site}/mcp`,
        `${site}/mcp/${slug}`,
      ])
      const links = hrefs(document)
      for (const other of slugs)
        if (other !== slug) expect(links.has(`/mcp/${other}`)).toBe(true)
      expect(read(`mcp/${slug}/index.html`)).toContain(
        "Maintained by Unique Divine",
      )
    }
  },
)

buildTest("the Discord policy page and server page link to each other", () => {
  if (!slugs.includes("discord-mcp")) return
  expect(hrefs(page("discord-mcp")).has("/mcp/discord-mcp")).toBe(true)
  expect(hrefs(page("mcp/discord-mcp")).has("/discord-mcp")).toBe(true)
})

buildTest("sitemaps and llms.txt list the catalog and every server", () => {
  const locs = readdirSync(dist)
    .filter((file) => /^sitemap-\d+\.xml$/.test(file))
    .map(read)
    .join("\n")
  const html = read("sitemap/index.html")
  const llms = read("llms.txt")
  const section = llmsLinks(
    llms.split("## MCP servers\n\n")[1].split("\n\n")[0],
  )
  expect(section).toEqual([
    `${site}/mcp`,
    ...slugs.map((slug) => `${site}/mcp/${slug}`),
  ])
  for (const path of ["/mcp", ...slugs.map((slug) => `/mcp/${slug}`)]) {
    expect(locs).toContain(`<loc>${site}${path}</loc>`)
    expect(html).toContain(`href="${path}"`)
  }
})
