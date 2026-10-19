import { describe, expect, test } from "bun:test"

import { readPageMetadata } from "../../src/utils/sitemap-build.mjs"
import { isDiscoverablePage } from "../../src/utils/sitemap-policy.mjs"

const site = "https://uniquedivine.com"

describe("public sitemap publication policy", () => {
  test("includes published pages and topic archives", () => {
    for (const path of [
      "/",
      "/sitemap",
      "/tag/japanese",
      "/category/coding",
      "/blog/23-08-12-python",
      "/code/projects/nibiru-typescript-sdk",
      "/discord-mcp/terms",
    ]) {
      expect(isDiscoverablePage(path, { site })).toBe(true)
    }
  })

  test("excludes demos, errors, redirects, and noncanonical URL variants", () => {
    for (const path of [
      "/about-astro",
      "/services/",
      "/contact",
      "/pricing",
      "/landing/product",
      "/jp/personal",
      "/jp/saas",
      "/jp/startup",
      "/jp/mobile-app",
      "/404",
      "/500",
      "/discord-mcp/intent-review",
      "/tag/coding?page=2",
      "/sitemap#tags",
      "https://example.com/code/python",
    ]) {
      expect(isDiscoverablePage(path, { site })).toBe(false)
    }
  })

  test("respects draft, robots, redirects, and canonical overrides", () => {
    expect(
      isDiscoverablePage("/blog/23-08-12-python", { site, draft: true }),
    ).toBe(false)
    expect(isDiscoverablePage("/tag/coding/2", { site, index: false })).toBe(
      false,
    )
    expect(
      isDiscoverablePage("/category/coding/2", { site, index: false }),
    ).toBe(false)
    expect(isDiscoverablePage("/blog/2", { site, index: false })).toBe(false)
    expect(isDiscoverablePage("/old", { site, redirect: true })).toBe(false)
    expect(
      isDiscoverablePage("/blog/23-08-12-python", {
        site,
        canonical: "https://example.com/python",
      }),
    ).toBe(false)
    expect(
      isDiscoverablePage("/blog/23-08-12-python", {
        site,
        canonical: "/blog/24-06-08-golang",
      }),
    ).toBe(false)
    expect(
      isDiscoverablePage("/blog/23-08-12-python", {
        site,
        canonical: `${site}/blog/23-08-12-python`,
      }),
    ).toBe(true)
    expect(isDiscoverablePage("/", { site, canonical: site })).toBe(true)
  })

  test("reads actual SEO markup regardless of case, spacing, or attribute order", () => {
    expect(
      readPageMetadata(
        '<meta content="NOINDEX, follow" name="robots"><link href="https://uniquedivine.com/tag/coding/2" rel="canonical">',
      ),
    ).toEqual({
      index: false,
      canonical: `${site}/tag/coding/2`,
      redirect: false,
    })
    expect(
      readPageMetadata('<meta name="googlebot" content="none">').index,
    ).toBe(false)
    expect(
      readPageMetadata('<meta name="robots" content="index, follow">').index,
    ).toBe(true)
    expect(
      readPageMetadata(
        '<meta content="0;url=/discord-mcp" http-equiv="Refresh">',
      ).redirect,
    ).toBe(true)
  })
})
