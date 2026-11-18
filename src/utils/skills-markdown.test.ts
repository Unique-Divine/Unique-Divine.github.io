import { expect, test } from "bun:test"

import { reduceMarkdown } from "~/utils/markdown-copy"
import { skillsCatalogMarkdown } from "~/utils/skills-markdown"

const site = "https://uniquedivine.com"
const repository = "https://github.com/Unique-Divine/jiyuu"

test("the skills catalog lists each skill with its page and copy", async () => {
  const text = skillsCatalogMarkdown(
    [
      { name: "gh-pr", description: "Writes PR\n bodies.", route: "gh-pr" },
      { name: "gh-rev", description: "Keeps a ledger.", route: "gh-rev" },
    ],
    repository,
  )
  expect(text).toContain(`\`\`\`sh\nnpx skills add ${repository}\n\`\`\``)
  expect(text).toContain("2 skills.")
  expect(text).toContain(
    "- [gh-pr](/ai-skills/gh-pr): Writes PR bodies. " +
      "([Markdown](/ai-skills/gh-pr.md))",
  )
  const page = `${site}/ai-skills`
  const reduced = await reduceMarkdown(text, { mdx: false, page, site })
  expect(reduced).toContain(`[gh-rev](${site}/ai-skills/gh-rev)`)
})
