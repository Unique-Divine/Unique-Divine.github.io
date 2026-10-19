import { expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { parse } from "ultrahtml"
import { querySelector } from "ultrahtml/selector"

import hosting from "../../firebase.json"

const dist = new URL("../../dist/", import.meta.url)
const html = (route: string) =>
  readFileSync(new URL(`${route.replace(/^\//, "")}/index.html`, dist), "utf8")
const standing = ["/about", "/about/media", "/about/nibiru", "/code"]

test("legacy Firebase redirects land directly on built canonical pages", () => {
  const sources = new Set(hosting.hosting.redirects.map((r) => r.source))
  expect(sources.has("/winning/01-structured-freedom")).toBe(true)
  expect(sources.has("/261019-block-latency")).toBe(true)
  expect(sources.has("/tag/about")).toBe(true)
  for (const redirect of hosting.hosting.redirects) {
    expect(redirect.type).toBe(301)
    expect(sources.has(redirect.destination)).toBe(false)
    const document = parse(html(redirect.destination))
    expect(
      querySelector(document, 'link[rel="canonical"]')?.attributes.href,
    ).toBe(`https://uniquedivine.com${redirect.destination}`)
    const xml = readFileSync(new URL("sitemap-0.xml", dist), "utf8")
    expect(xml).not.toContain(
      `<loc>https://uniquedivine.com${redirect.source}</loc>`,
    )
    if (!redirect.source.endsWith("/"))
      expect(html(redirect.source)).toMatch(/http-equiv="refresh"/i)
  }
})

test("standing pages remain in the sitemap but outside blog archives and RSS", () => {
  const sitemap = parse(html("/sitemap"))
  const site = querySelector(sitemap, '[data-sitemap-section="site"]')!
  const articles = querySelector(sitemap, '[data-sitemap-section="blog"]')!
  const rss = readFileSync(new URL("rss.xml", dist), "utf8")
  for (const route of standing) {
    expect(querySelector(site, `a[href="${route}"]`)).toBeTruthy()
    expect(querySelector(articles, `a[href="${route}"]`)).toBeFalsy()
    expect(rss).not.toContain(`<link>https://uniquedivine.com${route}</link>`)
  }
  for (const file of readdirSync(new URL("blog/", dist))) {
    if (!/^\d+$/.test(file) && file !== "index.html") continue
    const document = parse(
      file === "index.html" ? html("/blog") : html("/blog/" + file),
    )
    for (const route of standing)
      expect(
        querySelector(document, `.post-card-link[href="${route}"]`),
      ).toBeFalsy()
  }
})
