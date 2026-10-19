import { describe, expect, test } from "bun:test"
import { createMarkdownProcessor } from "@astrojs/markdown-remark"

import { getArticleContents } from "../../src/utils/article-contents"

describe("compiler-generated article contents", () => {
  test("links to actual Markdown IDs, including duplicates and Unicode", async () => {
    const processor = await createMarkdownProcessor()
    const { code, metadata } = await processor.render(
      [
        "# Page title",
        "## Repeat",
        "### Using `code` and **emphasis**",
        "## Repeat",
        "## 日本語",
        "#### Too deep",
      ].join("\n\n"),
    )
    const { items } = getArticleContents(metadata.headings, true)
    expect(items.map(({ id }) => id)).toEqual([
      "article-overview",
      "repeat",
      "using-code-and-emphasis",
      "repeat-1",
      "日本語",
    ])
    expect(items[2].label).toBe("Using code and emphasis")
    expect(items[2].depth).toBe(3)
    for (const { id } of items.slice(1)) expect(code).toContain(`id="${id}"`)
  })

  test("is opt-in and omits navigation when there are no section headings", () => {
    const headings = [{ depth: 2, slug: "section", text: "Section" }]
    expect(getArticleContents(headings).items).toEqual([])
    expect(getArticleContents(headings, false).overviewId).toBeUndefined()
    expect(getArticleContents([], true).items).toEqual([])
    expect(
      getArticleContents([{ depth: 1, slug: "title", text: "Title" }], true)
        .items,
    ).toEqual([])
  })

  test("preserves supplied compiler IDs and avoids an Overview collision", () => {
    const { overviewId, items } = getArticleContents(
      [
        { depth: 2, slug: "article-overview", text: "Article overview" },
        { depth: 4, slug: "article-overview-1", text: "Hidden level" },
        { depth: 2, slug: "custom-stable-id", text: "Different label" },
      ],
      true,
    )
    expect(overviewId).toBe("article-overview-2")
    expect(items.at(-1)?.id).toBe("custom-stable-id")
  })
})
