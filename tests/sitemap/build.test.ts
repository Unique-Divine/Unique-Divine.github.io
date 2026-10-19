import { afterEach, expect, test } from "bun:test"
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { parse } from "ultrahtml"
import { querySelector, querySelectorAll } from "ultrahtml/selector"

import { SITE } from "../../src/utils/config"
import {
  readPageMetadata,
  validateBuiltSitemap,
} from "../../src/utils/sitemap-build.mjs"

const built = new URL("../../dist/", import.meta.url)
const copies: string[] = []
const config = (outDir = built) => ({
  site: SITE.site,
  base: SITE.base,
  trailingSlash: SITE.trailingSlash ? "always" : "never",
  build: { format: "directory" },
  outDir,
})
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "ud-sitemap-test-"))
  copies.push(dir)
  cpSync(built, dir, {
    recursive: true,
    filter: (source) =>
      !/\.(?:css|js|png|jpg|jpeg|webp|svg|woff2?|json|md|txt)$/.test(source) ||
      source.endsWith("robots.txt"),
  })
  return pathToFileURL(`${dir}/`)
}
afterEach(() => {
  for (const dir of copies.splice(0))
    rmSync(dir, { recursive: true, force: true })
})

test("HTML, XML, canonical pages, resources, and footers agree after the real build", () => {
  expect(validateBuiltSitemap(config()).pages).toBeGreaterThan(20)
  const sitemap = readFileSync(new URL("sitemap/index.html", built), "utf8")
  expect(sitemap).toContain('data-sitemap-section="tags"')
  expect(sitemap).toContain('href="/tag/japanese"')
  expect(sitemap).toContain("Self-Improvement and Productivity")
  for (const path of ["tag/coding", "category/coding", "blog"]) {
    expect(
      readPageMetadata(
        readFileSync(new URL(`${path}/index.html`, built), "utf8"),
      ).index,
    ).toBe(true)
    expect(
      readPageMetadata(
        readFileSync(new URL(`${path}/2/index.html`, built), "utf8"),
      ).index,
    ).toBe(false)
  }
})

test("blog entries are grouped under category headings and the TOC targets real headings", () => {
  const sitemap = readFileSync(new URL("sitemap/index.html", built), "utf8")
  const document = parse(sitemap)
  const groups = querySelectorAll(
    querySelector(document, '[data-sitemap-section="blog"]'),
    "h3",
  )
  expect(groups.map((node) => node.attributes.id)).toEqual([
    "sitemap-blog-category-coding",
    "sitemap-blog-category-nibiru",
    "sitemap-blog-category-self-improvement",
    "sitemap-blog-uncategorized",
  ])
  expect(
    querySelector(
      querySelector(
        document,
        '[data-sitemap-group="sitemap-blog-category-coding"]',
      ),
      'a[href="/code/python"]',
    ),
  ).toBeTruthy()
  expect(
    querySelector(
      querySelector(
        document,
        '[data-sitemap-group="sitemap-blog-uncategorized"]',
      ),
      'a[href="/media"]',
    ),
  ).toBeTruthy()
  expect(
    querySelectorAll(document, '[data-sitemap-section="categories"]'),
  ).toHaveLength(0)
  const main = querySelector(document, "main")
  const headings = [
    ...querySelectorAll(main, "h2"),
    ...querySelectorAll(main, "h3"),
  ]
  const ids = querySelectorAll(document, "[id]").map(
    (node) => node.attributes.id,
  )
  expect(new Set(ids).size).toBe(ids.length)
  const links = querySelectorAll(
    querySelector(document, "[data-article-contents]"),
    "a",
  )
  expect(links).toHaveLength((headings.length + 1) * 2)
  for (const heading of headings) {
    expect(
      links.filter(
        (node) =>
          decodeURIComponent(node.attributes.href.slice(1)) ===
          heading.attributes.id,
      ),
    ).toHaveLength(2)
  }
  const tagLinks = querySelectorAll(
    querySelector(document, '[data-sitemap-section="tags"]'),
    "a",
  )
  for (const link of tagLinks) {
    const label = link.children
      .map((node) => node.value ?? "")
      .join("")
      .trim()
    expect(label.startsWith("On ")).toBe(false)
    expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase())
  }
})

test("validation rejects a missing target", () => {
  const dir = fixture()
  rmSync(new URL("sai-calc/index.html", dir))
  expect(() => validateBuiltSitemap(config(dir))).toThrow("mismatch")
})

test("validation rejects duplicate HTML entries", () => {
  const dir = fixture()
  const file = new URL("sitemap/index.html", dir)
  writeFileSync(
    file,
    readFileSync(file, "utf8").replace(
      "</main>",
      '<a data-sitemap-kind="page" href="/sai-calc">Duplicate</a></main>',
    ),
  )
  expect(() => validateBuiltSitemap(config(dir))).toThrow("duplicate")
})

test("validation rejects XML inventory drift", () => {
  const dir = fixture()
  const file = new URL("sitemap-0.xml", dir)
  writeFileSync(file, readFileSync(file, "utf8").replace(/<url>.*?<\/url>/, ""))
  expect(() => validateBuiltSitemap(config(dir))).toThrow(
    "XML sitemap mismatch",
  )
})

test("validation rejects a page that becomes noindex", () => {
  const dir = fixture()
  const file = new URL("sai-calc/index.html", dir)
  writeFileSync(
    file,
    readFileSync(file, "utf8").replace(
      "</head>",
      '<meta name="robots" content="noindex"></head>',
    ),
  )
  expect(() => validateBuiltSitemap(config(dir))).toThrow("mismatch")
})
