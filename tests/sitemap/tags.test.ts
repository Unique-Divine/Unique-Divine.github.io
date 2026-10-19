import { expect, test } from "bun:test"

import { cleanSlug } from "../../src/utils/slugs"
import {
  getSitemapTagLabel,
  getTagInventory,
  getTagTitle,
} from "../../src/utils/tags"

test("sitemap labels use sentence case and preserve manual names without the On prefix", () => {
  expect(getSitemapTagLabel("meta-learning")).toBe("Meta-learning")
  expect(getSitemapTagLabel("coding")).toBe("Coding")
  expect(getSitemapTagLabel("japanese")).toBe("Japanese (日本語)")
  expect(getSitemapTagLabel("self-improvement")).toBe(
    "Self-Improvement and Productivity",
  )
  expect(getTagTitle("self-improvement")).toBe(
    "On Self-Improvement and Productivity",
  )
})

test("tag titles use the same existing overrides and labels as archive pages", () => {
  expect(getTagTitle("self-improvement")).toBe(
    "On Self-Improvement and Productivity",
  )
  expect(getTagTitle("japanese")).toBe("On Japanese (日本語)")
  expect(getTagTitle("python")).toBe("On python")
})

test("inventory groups normalized spellings, counts each article once, and separates drafts", () => {
  const inventory = getTagInventory([
    {
      id: "winning/01.md",
      title: "Structured Freedom",
      tags: ["Self Improvement", "self-improvement"],
    },
    { id: "winning/02.md", title: "Advice", tags: ["self-improvement"] },
    {
      id: "draft.mdx",
      title: "Draft",
      draft: true,
      tags: ["Self Improvement", "Front End"],
    },
  ])
  const tag = inventory.find((row) => row.slug === "self-improvement")!
  expect(tag.spellings).toEqual(
    ["self-improvement", "Self Improvement"].sort((a, b) =>
      a.localeCompare(b, "en"),
    ),
  )
  expect(tag.collision).toBe(true)
  expect(tag.published.map((article) => article.id)).toEqual([
    "winning/01.md",
    "winning/02.md",
  ])
  expect(tag.drafts).toHaveLength(1)
  const draftOnly = inventory.find((row) => row.slug === "front-end")!
  expect(draftOnly.published).toHaveLength(0)
  expect(draftOnly.drafts).toHaveLength(1)
  expect(cleanSlug("/Self Improvement/")).toBe(tag.slug)
})
