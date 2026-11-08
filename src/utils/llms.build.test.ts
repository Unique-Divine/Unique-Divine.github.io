import { expect } from "bun:test"
import { existsSync, readdirSync, readFileSync } from "node:fs"

import { llmsLinks } from "~/utils/llms"
import { mdxLeftovers } from "~/utils/markdown-copy"
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

/** Whether a link is a generated Markdown copy rather than a SKILL.md. */
const isCopy = (link: string) =>
  link.endsWith(".md") && !new URL(link).pathname.startsWith("/ai-skills-")

/** The HTML page a Markdown copy stands for: `/blog/x.md` is `/blog/x`. */
const canonicalPage = (link: string) =>
  isCopy(link) ? link.replace(/\.md$/, "") : link

/** Generated copies that llms.txt links to. */
const copyLinks = () => llmsLinks(read("llms.txt")).filter(isCopy)

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
    // Feeds and SKILL.md sources are resources, not pages, so the sitemap
    // does not list them. A Markdown copy's HTML page must be listed.
    if (link.endsWith(".xml") || link.endsWith("/SKILL.md")) continue
    if (new URL(link).pathname !== "/") expect(link.endsWith("/")).toBe(false)
    expect(listed.has(canonicalPage(link))).toBe(true)
  }
})

buildTest("posts and projects link to built Markdown copies", () => {
  const text = read("llms.txt")
  const section = (title: string) =>
    llmsLinks(text.split(`## ${title}\n\n`)[1].split("\n\n")[0])
  expect(section("Writing").every(isCopy)).toBe(true)
  // The first project link is the HTML index of all projects.
  const [index, ...projects] = section("Projects")
  expect(index).toBe(`${site}/code/projects`)
  expect(projects.length).toBeGreaterThan(0)
  expect(projects.every(isCopy)).toBe(true)
  const [skillIndex, ...skills] = section("Agent skills")
  expect(skillIndex).toBe(`${site}/ai-skills`)
  for (const skill of skills)
    expect(new URL(skill).pathname).toMatch(
      /^\/ai-skills-source\/[a-z0-9-]+\/SKILL\.md$/,
    )
  // Standing pages and indexes keep their HTML links.
  expect(section("Site").some((link) => link.endsWith(".md"))).toBe(false)
})

buildTest("every Markdown copy is plain Markdown for a sitemap page", () => {
  const listed = sitemapLocs()
  const links = copyLinks()
  expect(links.length).toBeGreaterThan(10)
  for (const link of links) {
    const text = readFileSync(builtFile(link), "utf8")
    const [title, blank, facts, gap] = text.split("\n")
    expect(title).toMatch(/^# \S/)
    expect(blank).toBe("")
    const url = facts.match(/^Web page: (\S+)/)?.[1]
    expect(url).toBe(canonicalPage(link))
    expect(listed.has(url!)).toBe(true)
    expect(gap).toBe("")
    expect([link, mdxLeftovers(text)]).toEqual([link, []])
  }
  // Every generated copy is listed: none is built for an unlisted page.
  const built = ["blog/", "code/projects/"].flatMap((dir) =>
    readdirSync(new URL(dir, dist))
      .filter((file) => file.endsWith(".md"))
      .map((file) => new URL(`${dir}${file}`, `${site}/`).href),
  )
  expect(built.sort()).toEqual([...links].sort())
})

buildTest("llms.txt lists the canonical links from the issue", () => {
  const links = llmsLinks(read("llms.txt"))
  for (const path of [
    "/",
    "/about",
    "/blog",
    "/rss.xml",
    "/blog/26-10-19-block-latency.md",
    "/blog/23-08-12-github-git-gh.md",
    "/blog/20-09-02-why-learn-japanese.md",
  ])
    expect(links).toContain(new URL(path, site).href)
})

buildTest("llms.txt lists every published article newest first", () => {
  const text = read("llms.txt")
  const writing = text.split("## Writing\n\n")[1].split("\n\n")[0]
  // Writing links to Markdown copies; compare the pages they stand for.
  const posts = llmsLinks(writing).map(canonicalPage)
  const rss = [...read("rss.xml").matchAll(/<link>([^<]+)<\/link>/g)]
    .map((m) => m[1])
    .filter((link) => link.startsWith(`${site}/blog/`))
  expect(posts).toEqual(rss)
})
