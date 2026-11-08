import { expect } from "bun:test"
import { existsSync, readdirSync, readFileSync } from "node:fs"

import { llmsLinks } from "~/utils/llms"
import { buildTest, repoUrl } from "~/utils/repo-paths"

const dist = repoUrl("dist/")
const site = "https://uniquedivine.com"
const read = (file: string) => readFileSync(new URL(file, dist), "utf8")

/** Every `<loc>` in the XML sitemaps that `sitemap-index.xml` lists. */
const sitemapLocs = (): Set<string> =>
  new Set(
    readdirSync(dist)
      .filter((file) => /^sitemap-\d+\.xml$/.test(file))
      .flatMap((file) =>
        [...read(file).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
      ),
  )

/** The built file Firebase serves for a URL under cleanUrls. */
const builtFile = (url: string): URL => {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, "")
  if (!path) return new URL("index.html", dist)
  if (/\.[a-z0-9]+$/i.test(path)) return new URL(path, dist)
  const html = new URL(`${path}.html`, dist)
  return existsSync(html) ? html : new URL(`${path}/index.html`, dist)
}

buildTest("dist/llms.txt has one H1, a summary, and llmstxt.org links", () => {
  const text = read("llms.txt")
  const lines = text.split("\n")
  expect(lines[0]).toBe("# Unique Divine")
  expect(lines.filter((line) => /^# /.test(line))).toHaveLength(1)
  expect(lines.some((line) => /^> \S/.test(line))).toBe(true)
  for (const line of lines.filter((line) => line.startsWith("- ")))
    expect(line).toMatch(/^- \[.+\]\(https:\/\/\S+\)(: \S.*)?$/)
})

buildTest("every llms.txt link is unique, built, and in the sitemap", () => {
  const links = llmsLinks(read("llms.txt"))
  const listed = sitemapLocs()
  expect(links.length).toBeGreaterThan(10)
  expect(new Set(links).size).toBe(links.length)
  for (const link of links) {
    expect(link.startsWith(`${site}/`)).toBe(true)
    expect(existsSync(builtFile(link))).toBe(true)
    // Feeds are resources, not pages, so the sitemap does not list them.
    if (link.endsWith(".xml")) continue
    if (new URL(link).pathname !== "/") expect(link.endsWith("/")).toBe(false)
    expect(listed.has(link)).toBe(true)
  }
})

buildTest("llms.txt lists the canonical links from the issue", () => {
  const links = llmsLinks(read("llms.txt"))
  for (const path of [
    "/",
    "/about",
    "/blog",
    "/rss.xml",
    "/blog/26-10-19-block-latency",
    "/blog/23-08-12-github-git-gh",
    "/blog/20-09-02-why-learn-japanese",
  ])
    expect(links).toContain(new URL(path, site).href)
})

buildTest("llms.txt lists every published article newest first", () => {
  const text = read("llms.txt")
  const writing = text.split("## Writing\n\n")[1].split("\n\n")[0]
  const posts = llmsLinks(writing)
  const rss = [...read("rss.xml").matchAll(/<link>([^<]+)<\/link>/g)]
    .map((m) => m[1])
    .filter((link) => link.startsWith(`${site}/blog/`))
  expect(posts).toEqual(rss)
})
