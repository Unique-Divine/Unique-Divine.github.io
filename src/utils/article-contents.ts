import type { MarkdownHeading } from "astro"

export interface ContentsItem {
  id: string
  label: string
  depth: 2 | 3
}

/** Use Astro's compiled IDs so navigation and rendered headings cannot diverge. */
export function getArticleContents(
  headings: readonly MarkdownHeading[] = [],
  enabled = false,
): { overviewId?: string; items: ContentsItem[] } {
  const eligible = headings.filter(({ depth }) => depth === 2 || depth === 3)
  if (!enabled || !eligible.length) return { items: [] }

  const ids = new Set(headings.map(({ slug }) => slug))
  let overviewId = "article-overview"
  let suffix = 0
  while (ids.has(overviewId)) overviewId = `article-overview-${++suffix}`

  return {
    overviewId,
    items: [
      { id: overviewId, label: "Overview", depth: 2 },
      ...eligible.map(
        ({ slug, text, depth }): ContentsItem => ({
          id: slug,
          label: text,
          depth: depth === 3 ? 3 : 2,
        }),
      ),
    ],
  }
}
