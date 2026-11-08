import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import {
  absoluteLink,
  cleanHtml,
  importedModules,
  interactiveNote,
  markdownCopyHref,
  markdownCopyParam,
  mdxLeftovers,
  proseLines,
  reduceMarkdown,
  renderMarkdownCopy,
  type ReduceOptions,
} from "~/utils/markdown-copy"
import { repoUrl } from "~/utils/repo-paths"

const site = "https://uniquedivine.com"
const page = `${site}/blog/26-10-19-block-latency`
const mdx: ReduceOptions = { mdx: true, page, site }
const md: ReduceOptions = { mdx: false, page, site }

test("copy paths add .md to the slashless canonical path", () => {
  expect(markdownCopyHref("/blog/x")).toBe("/blog/x.md")
  expect(markdownCopyHref("/code/projects/sai/")).toBe("/code/projects/sai.md")
  expect(markdownCopyParam("/blog/x")).toBe("blog/x")
  expect(() => markdownCopyHref("/")).toThrow()
  expect(() => markdownCopyHref("blog/x")).toThrow()
})

test("absoluteLink resolves fragments and root paths only", () => {
  expect(absoluteLink("#budget", page, site)).toBe(`${page}#budget`)
  expect(absoluteLink("/about/nibiru", page, site)).toBe(`${site}/about/nibiru`)
  expect(absoluteLink("https://x.test/a", page, site)).toBe("https://x.test/a")
  expect(absoluteLink("//cdn.test/a", page, site)).toBe("//cdn.test/a")
  expect(absoluteLink("mailto:a@b.test", page, site)).toBe("mailto:a@b.test")
})

test("importedModules maps default, named, and renamed imports", () => {
  const modules = importedModules(
    [
      'import Figure from "~/components/Figure.astro"',
      "import { A, B as C } from './ab'",
      'import * as D from "d"',
    ].join("\n"),
  )
  expect(Object.fromEntries(modules)).toEqual({
    Figure: "~/components/Figure.astro",
    A: "./ab",
    C: "./ab",
    D: "d",
  })
})

test("cleanHtml drops comments and makes root paths absolute", () => {
  expect(cleanHtml("<!-- TODO: private -->", site)).toBe("")
  expect(cleanHtml('<img src="/code/x.png" alt="x">', site)).toBe(
    `<img src="${site}/code/x.png" alt="x">`,
  )
  expect(cleanHtml("<a href='//cdn.test/x'>x</a>", site)).toBe(
    "<a href='//cdn.test/x'>x</a>",
  )
})

test("MDX imports, exports, and expressions are removed", async () => {
  const out = await reduceMarkdown(
    [
      'import Budget from "~/components/Budget.astro"',
      "export const meta = { a: 1 }",
      "",
      "Before.",
      "",
      "{/* an MDX comment */}",
      "",
      "Inline {1 + 1} expression.",
      "",
    ].join("\n"),
    mdx,
  )
  expect(out).toBe("Before.\n\nInline  expression.\n")
})

test("wrapper components and HTML elements unwrap to their content", async () => {
  const out = await reduceMarkdown(
    [
      'import Guide from "~/components/Guide.astro"',
      "",
      "<Guide>",
      "",
      "Opening **prose**.",
      "",
      '<div class="glossary">',
      "",
      "| A | B |",
      "| - | - |",
      "| 1 | 2 |",
      "",
      "</div>",
      "",
      "Closing prose.",
      "",
      "</Guide>",
      "",
    ].join("\n"),
    mdx,
  )
  expect(out).toBe(
    "Opening **prose**.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\nClosing prose.\n",
  )
  expect(mdxLeftovers(out)).toEqual([])
})

test("childless components become a note, a mapped text, or an image", async () => {
  const source = [
    'import Budget from "~/components/research/Budget.astro"',
    'import Figure from "~/components/research/Figure.astro"',
    'import Legend from "~/components/research/Legend.astro"',
    "",
    "Select a node.",
    "",
    "<Budget />",
    "",
    "<Legend />",
    "<Figure",
    '  file="cycle.svg"',
    '  alt="One [successful] round"',
    "/>",
    "",
    "Text with <Tip /> inline.",
    "",
    '<Photo alt="A lion" src="/lion.jpg" />',
    "",
  ].join("\n")
  const out = await reduceMarkdown(source, {
    ...mdx,
    components: {
      "~/components/research/Figure.astro": ({ file, alt }) =>
        `![${alt}](${site}/research/${file})`,
      "~/components/research/Legend.astro": () => "",
    },
  })
  expect(out).toBe(
    [
      "Select a node.",
      "",
      interactiveNote(page),
      "",
      `![One [successful] round](${site}/research/cycle.svg)`,
      "",
      "Text with  inline.",
      "",
      `![A lion](${site}/lion.jpg)`,
      "",
    ].join("\n"),
  )
  expect(mdxLeftovers(out)).toEqual([])
})

test("images resolve to absolute URLs or fall back to alt text", async () => {
  const resolveImage = async (url: string) =>
    url === "../../assets/images/a.png"
      ? `${site}/_astro/a.hash.webp`
      : undefined
  const out = await reduceMarkdown(
    [
      "![Optimized](../../assets/images/a.png)",
      "",
      "![Public](/code/b.png)",
      "",
      "![Remote](https://img.test/c.png)",
      "",
      "![Missing](./gone.png) after.",
      "",
    ].join("\n"),
    { ...md, resolveImage },
  )
  expect(out).toBe(
    [
      `![Optimized](${site}/_astro/a.hash.webp)`,
      "",
      `![Public](${site}/code/b.png)`,
      "",
      "![Remote](https://img.test/c.png)",
      "",
      "Missing after.",
      "",
    ].join("\n"),
  )
})

test("links, definitions, and raw HTML get absolute site URLs", async () => {
  const out = await reduceMarkdown(
    [
      "See [the table](#scenarios), [Nibiru](</about/nibiru>), and [x][ref].",
      "",
      "<!-- TODO(Unique): private note -->",
      "",
      '<img src="/code/shot.png">',
      "",
      "[ref]: /code/projects",
      "",
    ].join("\n"),
    md,
  )
  expect(out).toBe(
    [
      `See [the table](${page}#scenarios), [Nibiru](<${site}/about/nibiru>), ` +
        "and [x][ref].",
      "",
      `<img src="${site}/code/shot.png">`,
      "",
      `[ref]: ${site}/code/projects`,
      "",
    ].join("\n"),
  )
})

test("code keeps imports, JSX, and root paths verbatim", async () => {
  const source = [
    "Use `<Budget />` inline.",
    "",
    "```astro",
    'import Budget from "./Budget.astro"',
    "<Budget />",
    "![x](/x.png)",
    "```",
    "",
  ].join("\n")
  expect(await reduceMarkdown(source, mdx)).toBe(source)
  expect(mdxLeftovers(source)).toEqual([])
})

test("mdxLeftovers flags ESM and JSX only outside code", () => {
  expect(
    mdxLeftovers("import X from 'x'\n<Budget />\n<div>ok</div>\na < B"),
  ).toEqual(["import X from 'x'", "<Budget />"])
  expect(proseLines("a\n````md\n```\nb\n````\nc")).toEqual(["a", "c"])
})

test("renderMarkdownCopy writes title, URL and dates, blank line, body", () => {
  const text = renderMarkdownCopy({
    title: "Where a 1.5-second\nblock spends its time",
    url: page,
    publishDate: new Date("2026-10-19T00:00:00Z"),
    updateDate: new Date("2026-11-01T00:00:00Z"),
    body: "\nBody.\n",
  })
  expect(text).toBe(
    [
      "# Where a 1.5-second block spends its time",
      "",
      `Web page: ${page} · Published 2026-10-19 · Updated 2026-11-01`,
      "",
      "Body.",
      "",
    ].join("\n"),
  )
  expect(
    renderMarkdownCopy({
      title: "Sai",
      url: `${site}/code/projects/sai`,
      body: "B",
    }),
  ).toBe(`# Sai\n\nWeb page: ${site}/code/projects/sai\n\nB\n`)
})

test("the block-latency MDX reduces to plain Markdown", async () => {
  const source = readFileSync(
    repoUrl("src/content/post/26-10-19-block-latency.mdx"),
    "utf8",
  ).replace(/^---\n[\s\S]*?\n---\n/, "")
  const out = await reduceMarkdown(source, mdx)
  expect(mdxLeftovers(out)).toEqual([])
  expect(out).not.toMatch(/<\/?(Guide|div)\b/)
  expect(out).toContain("## A block needs agreement, execution, and delivery.")
  expect(out).toContain("| NewHeight |")
  expect(out).toContain(`](${page}#what-would-remain-if-we-removed-the-wait`)
  expect(out).toContain(interactiveNote(page))
})
