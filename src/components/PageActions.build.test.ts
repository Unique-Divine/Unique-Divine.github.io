import { expect } from "bun:test"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { parse } from "ultrahtml"
import { querySelectorAll } from "ultrahtml/selector"

import { buildTest, repoUrl } from "~/utils/repo-paths"

const dist = repoUrl("dist/")
const read = (file: string) => readFileSync(new URL(file, dist), "utf8")

/** Props of the page's Copy for LLM island, or undefined when it has none. */
function buttonProps(
  page: string,
): { markdown: string; intro: string } | undefined {
  const html = read(page ? `${page.slice(1)}/index.html` : "index.html")
  const island = querySelectorAll(parse(html), "astro-island").find((node) =>
    /\/CopyForLLM\.[\w-]+\.js$/.test(String(node.attributes["component-url"])),
  )
  if (!island) return undefined
  const json = String(island.attributes.props)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
  // Astro serializes each prop as [type, value]; 0 is a plain value.
  const props = JSON.parse(json) as Record<string, [number, string]>
  return { markdown: props.markdown[1], intro: props.intro[1] }
}

/** Every built HTML page, as site paths such as `/blog/x`; `` is `/`. */
function allPages(): string[] {
  return readdirSync(dist, { recursive: true })
    .map(String)
    .filter((file) => file === "index.html" || file.endsWith("/index.html"))
    .map((file) => `/${file}`.replace(/\/?index\.html$/, ""))
}

/**
 * Pages whose `.md` copy the build wrote, such as `/blog/x` for
 * `blog/x.md` beside `blog/x/index.html`. Other `.md` files, such as raw
 * `SKILL.md` sources, have no page of their own.
 */
function pagesWithCopies(): string[] {
  return readdirSync(dist, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".md"))
    .map((file) => `/${file.replace(/\.md$/, "")}`)
    .filter((page) => existsSync(new URL(`${page.slice(1)}/index.html`, dist)))
    .sort()
}

buildTest("the button copies the same Markdown as the page's .md copy", () => {
  for (const page of [
    "/blog/26-10-19-block-latency",
    "/ai-skills/gh-pr",
    "/mcp/slack-mcp",
  ]) {
    const props = buttonProps(page)
    const copy = read(`${page.slice(1)}.md`)
    expect([page, props?.markdown]).toEqual([page, copy])
    expect(props?.intro).toMatch(/^This is ".+", a page on uniquedivine\.com/)
  }
})

buildTest("every page with a Markdown copy shows the button", () => {
  const pages = pagesWithCopies()
  for (const page of [
    "/mcp",
    "/mcp/slack-mcp",
    "/ai-skills",
    "/ai-skills/gh-rev/cli",
    "/discord-mcp",
    "/discord-mcp/privacy-policy",
    "/discord-mcp/terms",
    "/code/projects/sai",
    "/blog/26-10-19-block-latency",
  ])
    expect(pages).toContain(page)
  const skills = pages.filter((page) => page.startsWith("/ai-skills/"))
  expect(skills.length).toBeGreaterThan(10)
  for (const page of pages) {
    expect(existsSync(new URL(`${page.slice(1)}/index.html`, dist))).toBe(true)
    expect([page, buttonProps(page)?.markdown]).toEqual([
      page,
      read(`${page.slice(1)}.md`),
    ])
  }
})

buildTest("pages without copyForLlm show no button", () => {
  const copies = new Set(pagesWithCopies())
  const extra = allPages().filter(
    (page) => !copies.has(page) && buttonProps(page),
  )
  expect(extra).toEqual([])
  for (const page of ["", "/about", "/contact", "/blog", "/code/projects"])
    expect([page, buttonProps(page)]).toEqual([page, undefined])
})
