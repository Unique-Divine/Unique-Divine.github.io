import { readdirSync, readFileSync } from "node:fs"
import { relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import sitemap from "@astrojs/sitemap"
import { parse } from "ultrahtml"
import { querySelector, querySelectorAll } from "ultrahtml/selector"

import { isDiscoverablePage } from "./sitemap-policy.mjs"

export function readPageMetadata(html) {
  const document = parse(html)
  const robots = querySelectorAll(document, "meta")
    .filter((node) =>
      ["robots", "googlebot"].includes(node.attributes.name?.toLowerCase()),
    )
    .map((node) => node.attributes.content?.toLowerCase() ?? "")
    .join(",")
  return {
    index: !robots
      .split(/[\s,]+/)
      .some((token) => token === "noindex" || token === "none"),
    canonical: querySelector(document, 'link[rel="canonical"]')?.attributes
      .href,
    redirect: querySelectorAll(document, "meta").some(
      (node) => node.attributes["http-equiv"]?.toLowerCase() === "refresh",
    ),
  }
}

function htmlPath(url, config) {
  const pathname = new URL(url).pathname
  const base = new URL(config.base, config.site).pathname.replace(/\/$/, "")
  const local = decodeURIComponent(pathname.slice(base.length)).replace(
    /^\/|\/$/g,
    "",
  )
  return new URL(
    local
      ? `${local}${config.build.format === "file" ? ".html" : "/index.html"}`
      : "index.html",
    config.outDir,
  )
}

/** Keep Astro's XML generator, filtering with the final rendered SEO metadata. */
export function canonicalSitemap() {
  let config
  const integration = sitemap({
    filter: (url) => isDiscoverablePage(url, { site: config.site }),
    serialize: (entry) => {
      const metadata = readPageMetadata(
        readFileSync(htmlPath(entry.url, config), "utf8"),
      )
      return isDiscoverablePage(entry.url, { site: config.site, ...metadata })
        ? entry
        : undefined
    },
  })
  return {
    ...integration,
    hooks: {
      ...integration.hooks,
      "astro:config:done": async (args) => {
        config = args.config
        await integration.hooks["astro:config:done"]?.(args)
      },
    },
  }
}

function textContent(node) {
  return node.value ?? node.children?.map(textContent).join("") ?? ""
}

function xmlLocations(file) {
  return querySelectorAll(parse(readFileSync(file, "utf8")), "loc").map(
    textContent,
  )
}

function assertUnique(urls, label) {
  if (new Set(urls).size !== urls.length)
    throw new Error(`${label} contains duplicate URLs`)
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name)
    return entry.isDirectory()
      ? htmlFiles(path)
      : entry.name.endsWith(".html")
        ? [path]
        : []
  })
}

/** Also runs after compression and robots generation, including direct Astro builds. */
export function validateBuiltSitemap(config) {
  const site = new URL(config.base, config.site)
  const root = fileURLToPath(config.outDir)
  const toUrl = (path) => {
    let route = relative(root, path)
      .split(sep)
      .join("/")
      .replace(/(?:^|\/)index\.html$/, "")
      .replace(/\.html$/, "")
    if (config.trailingSlash === "always" && route) route += "/"
    return new URL(route, site).href
  }
  const expected = htmlFiles(root)
    .map((path) => ({ url: toUrl(path), html: readFileSync(path, "utf8") }))
    .filter(({ url, html }) =>
      isDiscoverablePage(url, { site, ...readPageMetadata(html) }),
    )
    .map(({ url }) => url)
  const sitemapUrl =
    new URL("sitemap", site).href +
    (config.trailingSlash === "always" ? "/" : "")
  const document = parse(readFileSync(htmlPath(sitemapUrl, config), "utf8"))
  const links = querySelectorAll(document, 'a[data-sitemap-kind="page"]').map(
    (node) => new URL(node.attributes.href, site).href,
  )
  const resources = querySelectorAll(
    document,
    'a[data-sitemap-kind="resource"]',
  ).map((node) => new URL(node.attributes.href, site))
  for (const url of resources) {
    if (url.origin !== site.origin || url.search || url.hash)
      throw new Error(`Invalid sitemap resource: ${url}`)
    readFileSync(
      new URL(url.pathname.slice(site.pathname.length), config.outDir),
    )
  }
  const index = new URL("sitemap-index.xml", config.outDir)
  const xml = xmlLocations(index).flatMap((url) => {
    const location = new URL(url)
    if (
      location.origin !== site.origin ||
      !location.pathname.startsWith(site.pathname)
    )
      throw new Error(`Invalid XML sitemap location: ${url}`)
    return xmlLocations(
      new URL(location.pathname.slice(site.pathname.length), config.outDir),
    )
  })
  if (!xml.length || !links.length)
    throw new Error("Sitemap inventories must not be empty")
  assertUnique(links, "HTML sitemap")
  assertUnique(xml, "XML sitemap")
  const expectedSet = new Set(expected)
  for (const [label, urls] of [
    ["HTML", links],
    ["XML", xml],
  ]) {
    const actual = new Set(urls)
    const missing = expected.filter((url) => !actual.has(url))
    const extra = urls.filter((url) => !expectedSet.has(url))
    if (missing.length || extra.length)
      throw new Error(
        `${label} sitemap mismatch. Missing: ${missing.join(", ")}; unexpected: ${extra.join(", ")}`,
      )
  }
  for (const url of links) {
    const html = readFileSync(htmlPath(url, config), "utf8")
    const canonical = readPageMetadata(html).canonical
    if (!canonical || new URL(canonical, url).href !== url)
      throw new Error(`Missing or incorrect canonical: ${url}`)
    const footers = querySelectorAll(parse(html), "footer")
    if (
      !footers.some((footer) =>
        querySelectorAll(footer, "a").some(
          (node) => new URL(node.attributes.href, site).href === sitemapUrl,
        ),
      )
    )
      throw new Error(`Missing footer sitemap link: ${url}`)
  }
  const robots = readFileSync(new URL("robots.txt", config.outDir), "utf8")
  if (!robots.includes(`Sitemap: ${new URL("sitemap-index.xml", site).href}`))
    throw new Error("robots.txt must declare the XML sitemap index")
  return { pages: links.length, resources: resources.length }
}

export function sitemapValidation() {
  let config
  return {
    name: "validate-public-sitemap",
    hooks: {
      "astro:config:done": ({ config: resolved }) => {
        config = resolved
      },
      "astro:build:done": ({ logger }) => {
        const result = validateBuiltSitemap(config)
        logger.info(
          `Verified ${result.pages} sitemap pages and ${result.resources} resources`,
        )
      },
    },
  }
}
