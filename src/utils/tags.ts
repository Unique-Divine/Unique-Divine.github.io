import { getSectionTitleOverride } from "../data/blogSections"
import { cleanSlug } from "./slugs"

export const TAG_MAP: Record<string, string> = {
  japanese: "Japanese (日本語)",
}

export const tagMapName = (slug: string) => TAG_MAP[slug] ?? slug

export const getTagTitle = (slug: string) =>
  getSectionTitleOverride("tag", slug) ?? `On ${tagMapName(slug)}`

/** Compact topic label for the sitemap; archive titles keep their existing wording. */
export const getSitemapTagLabel = (slug: string) => {
  const override = getSectionTitleOverride("tag", slug) ?? TAG_MAP[slug]
  if (override) return override.replace(/^On\s+/, "")
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export interface TaggedArticle {
  id: string
  title: string
  draft?: boolean
  tags?: string[]
}

export function getTagInventory(articles: TaggedArticle[]) {
  const tags = new Map<
    string,
    {
      spellings: Set<string>
      published: TaggedArticle[]
      drafts: TaggedArticle[]
    }
  >()
  for (const article of articles) {
    const seen = new Set<string>()
    for (const rawTag of article.tags ?? []) {
      const slug = cleanSlug(rawTag)
      const tag = tags.get(slug) ?? {
        spellings: new Set<string>(),
        published: [],
        drafts: [],
      }
      tag.spellings.add(rawTag)
      if (!seen.has(slug))
        (article.draft ? tag.drafts : tag.published).push(article)
      tags.set(slug, tag)
      seen.add(slug)
    }
  }
  return [...tags]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([slug, tag]) => ({
      slug,
      title: getTagTitle(slug),
      spellings: [...tag.spellings].sort((a, b) => a.localeCompare(b, "en")),
      published: tag.published.sort((a, b) => a.id.localeCompare(b.id, "en")),
      drafts: tag.drafts.sort((a, b) => a.id.localeCompare(b.id, "en")),
      collision: tag.spellings.size > 1,
    }))
}
