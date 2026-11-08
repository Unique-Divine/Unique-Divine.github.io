import { expect, test } from "bun:test"

import { byFilePath, newestFirst } from "./content-order"

test("byFilePath compares full paths, extension included", () => {
  const entries = [
    { filePath: "src/content/skill/gh-pr.md" },
    { filePath: "src/content/skill/herdr/reference.md" },
    { filePath: "src/content/skill/gh-pr-review.md" },
    { filePath: "src/content/skill/herdr.md" },
  ]
  // "-" sorts before ".", so gh-pr-review.md precedes gh-pr.md, as it did
  // when Astro 4 listed collection files by path.
  expect(entries.sort(byFilePath).map(({ filePath }) => filePath)).toEqual([
    "src/content/skill/gh-pr-review.md",
    "src/content/skill/gh-pr.md",
    "src/content/skill/herdr.md",
    "src/content/skill/herdr/reference.md",
  ])
})

test("newestFirst keeps Astro 4's order for skills published the same day", () => {
  const publishDate = new Date("2026-10-19")
  const posts = [
    { id: "older", publishDate: new Date("2026-01-01"), filePath: "a.md" },
    { id: "gh-pr", publishDate, filePath: "src/content/skill/gh-pr.md" },
    {
      id: "gh-pr-review",
      publishDate,
      filePath: "src/content/skill/gh-pr-review.md",
    },
  ]
  expect(posts.sort(newestFirst).map(({ id }) => id)).toEqual([
    "gh-pr-review",
    "gh-pr",
    "older",
  ])
})
