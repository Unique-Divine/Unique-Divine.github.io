/** Template routes remain available but are not promoted in either sitemap. */
export const EXCLUDED_PAGES = new Set([
  "/about-astro",
  "/contact",
  "/services",
  "/pricing",
  "/landing/product",
  "/jp/mobile-app",
  "/jp/personal",
  "/jp/saas",
  "/jp/startup",
  "/404",
  "/500",
  "/discord-mcp/intent-review",
])

export function isDiscoverablePage(
  href,
  { site, index = true, canonical, draft = false, redirect = false },
) {
  const url = new URL(href, site)
  const path = url.pathname.replace(/\/+$/, "") || "/"
  return (
    !draft &&
    !redirect &&
    index !== false &&
    url.origin === new URL(site).origin &&
    !url.search &&
    !url.hash &&
    !EXCLUDED_PAGES.has(path) &&
    (!canonical || new URL(canonical, url).href === url.href)
  )
}
