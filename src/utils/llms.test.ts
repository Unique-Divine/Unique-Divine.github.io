import { expect, test } from "bun:test"

import {
  absoluteUrl,
  buildLlmsIndex,
  escapeLinkText,
  llmsLinks,
  oneLine,
  postDescription,
  renderLlmsTxt,
  type LlmsPost,
  type LlmsSource,
} from "~/utils/llms"

const site = "https://uniquedivine.com"

const article = (slug: string, excerpt?: string): LlmsPost => ({
  title: `Post ${slug}`,
  permalink: `blog/${slug}`,
  excerpt,
  kind: "article",
})

const source = (overrides: Partial<LlmsSource> = {}): LlmsSource => ({
  name: "Unique Divine",
  description: "Programmer and creator.\nCo-founder building Nibiru.",
  about: {
    title: "About Unique Divine",
    permalink: "/about",
    excerpt: "",
    kind: "page",
    headings: [
      { depth: 2, slug: "intro", text: "I'm a programmer that makes music." },
    ],
  },
  pages: [
    {
      title: "Code",
      permalink: "/code",
      excerpt: "Software I've built.",
      kind: "page",
    },
  ],
  posts: [
    article("26-10-19-block-latency", "Where block time goes."),
    {
      title: "drill-spec",
      permalink: "ai-skills/drill-spec",
      excerpt: "Interview the user about a plan.",
      kind: "skill",
    },
    article("20-09-02-why-learn-japanese"),
  ],
  projects: [
    {
      id: "jiyuu",
      data: {
        title: "Jiyuu (自由)",
        summary: "A long summary.",
        tagline: "Monorepo of tools I use daily.",
      },
    },
  ],
  ...overrides,
})

test("oneLine collapses whitespace and keeps whole sentences under the cap", () => {
  expect(oneLine("  a\n  b\tc ")).toBe("a b c")
  expect(oneLine(undefined)).toBe("")
  const long = "First sentence here. Second sentence is longer than that."
  expect(oneLine(long, 30)).toBe("First sentence here.")
  // Dots inside words, such as `.github`, do not end a sentence.
  const path = "Use when editing files under `.github/workflows/`. Then lint."
  expect(oneLine(path, 55)).toBe(
    "Use when editing files under `.github/workflows/`.",
  )
  const words = "one two three four five six seven eight nine ten"
  const cut = oneLine(words, 20)
  expect(cut.endsWith("…")).toBe(true)
  expect(cut.length).toBeLessThanOrEqual(20)
  expect(words.startsWith(cut.slice(0, -1))).toBe(true)
})

test("absoluteUrl drops trailing slashes except on the root", () => {
  expect(absoluteUrl("/", site)).toBe("https://uniquedivine.com/")
  expect(absoluteUrl("/about/", site)).toBe("https://uniquedivine.com/about")
  expect(absoluteUrl("/rss.xml", site)).toBe("https://uniquedivine.com/rss.xml")
})

test("escapeLinkText keeps brackets from closing link text", () => {
  expect(escapeLinkText("A [draft] title")).toBe("A \\[draft\\] title")
})

test("postDescription uses a first h2 only for standing pages", () => {
  const heading = { depth: 2, slug: "init", text: "Init" }
  expect(
    postDescription({ ...article("24-06-08-golang"), headings: [heading] }),
  ).toBe("")
})

test("postDescription falls back from excerpt to metadata to first h2", () => {
  const post = source().about!
  expect(postDescription(post)).toBe("I'm a programmer that makes music.")
  expect(
    postDescription({ ...post, metadata: { description: "From SEO." } }),
  ).toBe("From SEO.")
  expect(postDescription({ ...post, excerpt: "From excerpt." })).toBe(
    "From excerpt.",
  )
})

test("renderLlmsTxt follows the llmstxt.org layout", () => {
  const text = renderLlmsTxt(buildLlmsIndex(source()), site)
  const lines = text.split("\n")
  expect(lines[0]).toBe("# Unique Divine")
  expect(lines.filter((line) => /^# /.test(line))).toHaveLength(1)
  expect(lines[2]).toBe("> Programmer and creator. Co-founder building Nibiru.")
  expect(lines.filter((line) => line.startsWith("## "))).toEqual([
    "## Site",
    "## Feeds",
    "## Writing",
    "## Projects",
    "## Agent skills",
  ])
  for (const line of lines.filter((line) => line.startsWith("- ")))
    expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/uniquedivine\.com\/\S*\)/)
})

test("primary links, feed, and sections land where the issue asks", () => {
  const text = renderLlmsTxt(buildLlmsIndex(source()), site)
  const section = (title: string) =>
    text.split(`## ${title}\n\n`)[1].split("\n\n")[0]
  expect(llmsLinks(section("Site"))).toEqual([
    "https://uniquedivine.com/",
    "https://uniquedivine.com/about",
    "https://uniquedivine.com/blog",
    "https://uniquedivine.com/code",
  ])
  expect(llmsLinks(section("Feeds"))).toEqual([
    "https://uniquedivine.com/rss.xml",
  ])
  expect(llmsLinks(section("Writing"))).toEqual([
    "https://uniquedivine.com/blog/26-10-19-block-latency",
    "https://uniquedivine.com/blog/20-09-02-why-learn-japanese",
  ])
  expect(section("Writing")).toContain(
    "(https://uniquedivine.com/blog/26-10-19-block-latency): " +
      "Where block time goes.",
  )
  // A post without any description renders as a bare link.
  expect(
    section("Writing").endsWith(
      "(https://uniquedivine.com/blog/20-09-02-why-learn-japanese)",
    ),
  ).toBe(true)
  expect(section("Projects")).toContain(
    "- [Jiyuu (自由)](https://uniquedivine.com/code/projects/jiyuu): " +
      "Monorepo of tools I use daily.",
  )
  expect(llmsLinks(section("Agent skills"))).toEqual([
    "https://uniquedivine.com/ai-skills",
    "https://uniquedivine.com/ai-skills/drill-spec",
  ])
})

test("renderLlmsTxt skips repeated URLs and drops empty sections", () => {
  const index = buildLlmsIndex(source({ posts: [], pages: [source().about!] }))
  const text = renderLlmsTxt(index, site)
  expect(text).not.toContain("## Writing")
  const links = llmsLinks(text)
  expect(new Set(links).size).toBe(links.length)
})

test("llmsLinks reads every link target", () => {
  expect(
    llmsLinks("- [A](https://x.test/a): d\n- [B \\[c\\]](https://x.test/b)"),
  ).toEqual(["https://x.test/a", "https://x.test/b"])
})
