import { describe, expect, test } from "bun:test"

import { pageMarkdown } from "./CopyForLLM"

describe("pageMarkdown", () => {
  const intro = 'This is "Block Latency", a page on uniquedivine.com.'
  const page = "https://uniquedivine.com/blog/block-latency"

  test("puts the intro and page URL before the trimmed Markdown", () => {
    const text = pageMarkdown(
      { intro, markdown: "\n# Block Latency\n\nBody text.\n\n" },
      page,
    )
    expect(text).toBe(
      `${intro} Page: ${page}\n\n# Block Latency\n\nBody text.\n`,
    )
  })

  test("drops the URL fragment", () => {
    const text = pageMarkdown({ intro, markdown: "Body" }, `${page}#results`)
    expect(text).toContain(`Page: ${page}\n`)
  })

  test("makes site-relative links absolute and keeps external links", () => {
    const text = pageMarkdown(
      {
        intro,
        markdown: "[Projects](/code/projects) and [Nibiru](https://nibiru.fi)",
      },
      page,
    )
    expect(text).toContain("[Projects](https://uniquedivine.com/code/projects)")
    expect(text).toContain("[Nibiru](https://nibiru.fi)")
  })
})
