export function postPermalink({
  slug,
  publishDate,
  kind = "article",
  permalink,
}: {
  slug: string
  publishDate: Date
  kind?: "article" | "page"
  permalink?: string
}): string {
  if (!Number.isFinite(publishDate.valueOf()))
    throw new Error(`Missing or invalid publication date: ${slug}`)
  if (kind === "page") {
    if (!permalink?.startsWith("/") || permalink.includes("//"))
      throw new Error(`Standing page needs an absolute permalink: ${slug}`)
    return permalink.replace(/^\/+|\/+$/g, "")
  }
  if (permalink)
    throw new Error(`Article cannot override its dated URL: ${slug}`)
  const prefix = publishDate.toISOString().slice(2, 10)
  if (!new RegExp(`^${prefix}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(slug))
    throw new Error(
      `Article slug must start with its UTC publication date ${prefix}: ${slug}`,
    )
  return `blog/${slug}`
}

export function assertUniquePermalinks(posts: { permalink: string }[]) {
  const seen = new Set<string>()
  for (const post of posts) {
    if (seen.has(post.permalink))
      throw new Error(`Duplicate permalink: ${post.permalink}`)
    seen.add(post.permalink)
  }
}
