import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

import { markdownComponents } from "~/utils/markdown-components"
import {
  absoluteLink,
  cleanHtml,
  importedModules,
  interactiveNote,
  linkDestination,
  markdownCopyHref,
  markdownCopyParam,
  markdownTable,
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

test("removed blocks keep list items and blockquotes intact", async () => {
  const list = "- item\n\n  {/* note */}\n\n  more text\n\n- next\n"
  expect(await reduceMarkdown(list, mdx)).toBe(
    "- item\n\n  more text\n\n- next\n",
  )
  const quote = "> a\n>\n> {/* note */}\n>\n> b\n\nAfter.\n"
  expect(await reduceMarkdown(quote, mdx)).toBe("> a\n>\n> b\n\nAfter.\n")
})

test("multi-line replacements keep their container prefix", async () => {
  const source = [
    'import Box from "~/components/Box.astro"',
    "",
    "> a",
    ">",
    "> <Box />",
    ">",
    "> b",
    "",
    "- item",
    "",
    "  <Box />",
    "",
    "- <Box />",
    "",
    "> - <Box />",
    "",
  ].join("\n")
  const out = await reduceMarkdown(source, {
    ...mdx,
    components: { "~/components/Box.astro": () => "X\n\nY" },
  })
  expect(out).toBe(
    [
      "> a",
      ">",
      "> X",
      ">",
      "> Y",
      ">",
      "> b",
      "",
      "- item",
      "",
      "  X",
      "",
      "  Y",
      "",
      "- X",
      "",
      "  Y",
      "",
      "> - X",
      ">",
      ">   Y",
      "",
    ].join("\n"),
  )
})

test("mapped wrappers keep text around their unwrapped content", async () => {
  const out = await reduceMarkdown(
    [
      'import Guide from "~/components/Guide.astro"',
      "",
      "<Guide>",
      "",
      "Body.",
      "",
      "</Guide>",
      "",
    ].join("\n"),
    {
      ...mdx,
      components: {
        "~/components/Guide.astro": () => ({
          before: "Stats.",
          after: "Data: [JSON](https://x.test/m.json)",
        }),
      },
    },
  )
  expect(out).toBe("Stats.\n\nBody.\n\nData: [JSON](https://x.test/m.json)\n")
})

test("multi-line wrapper text keeps its container prefix", async () => {
  const source = [
    'import Guide from "~/components/Guide.astro"',
    "",
    "- item",
    "",
    "  <Guide>",
    "",
    "  Body.",
    "",
    "  </Guide>",
    "",
    "- next",
    "",
    "> <Guide>",
    ">",
    "> Quoted.",
    ">",
    "> </Guide>",
    "",
    "1. <Guide>",
    "",
    "   On the marker line.",
    "",
    "   </Guide>",
    "",
  ].join("\n")
  const out = await reduceMarkdown(source, {
    ...mdx,
    components: {
      "~/components/Guide.astro": () => ({
        before: "Stats.\n\nMore stats.",
        after: "Data:\n[JSON](https://x.test/m.json)",
      }),
    },
  })
  expect(out).toBe(
    [
      "- item",
      "",
      "  Stats.",
      "",
      "  More stats.",
      "",
      "  Body.",
      "",
      "  Data:",
      "  [JSON](https://x.test/m.json)",
      "",
      "- next",
      "",
      "> Stats.",
      ">",
      "> More stats.",
      ">",
      "> Quoted.",
      ">",
      "> Data:",
      "> [JSON](https://x.test/m.json)",
      "",
      "1. Stats.",
      "",
      "   More stats.",
      "",
      "   On the marker line.",
      "",
      "   Data:",
      "   [JSON](https://x.test/m.json)",
      "",
    ].join("\n"),
  )
})

test("MDX <a href> becomes a Markdown link with an absolute URL", async () => {
  const out = await reduceMarkdown(
    [
      'See <a href="/about">the **about** page</a> and',
      '<a href="#data" target="_blank">the data</a>.',
      "",
      '<a href="https://x.test/a b">',
      "Block link.",
      "</a>",
      "",
      '<a href="https://x.test/d">',
      "",
      "One.",
      "",
      "Two.",
      "",
      "</a>",
      "",
      '## <a name="anchor"></a>Heading',
      "",
      '## <a href="#x" id="x"></a>Linked heading',
      "",
      '<a href="#y" id="y" />',
      "",
    ].join("\n"),
    mdx,
  )
  expect(out).toBe(
    [
      `See [the **about** page](${site}/about) and`,
      `[the data](${page}#data).`,
      "",
      "[Block link.](<https://x.test/a b>)",
      "",
      "One.",
      "",
      "Two.",
      "",
      "## Heading",
      "",
      "## Linked heading",
      "",
    ].join("\n"),
  )
})

test("a linked image keeps both its image and its link", async () => {
  const out = await reduceMarkdown(
    [
      '<a href="https://x.test/pkg">',
      '  <img src="https://x.test/b.svg" alt="badge" />',
      "</a>",
      "",
      '<a href="/ci">',
      '  <img src="/ci.svg" />',
      "</a>",
      "",
      'Inline <a href="/z"><img src="/z.png" alt="z" /></a>.',
      "",
    ].join("\n"),
    mdx,
  )
  expect(out).toBe(
    [
      "[![badge](https://x.test/b.svg)](https://x.test/pkg)",
      "",
      `[![](${site}/ci.svg)](${site}/ci)`,
      "",
      `Inline [![z](${site}/z.png)](${site}/z).`,
      "",
    ].join("\n"),
  )
})

test("childless HTML elements link to their source or become a note", async () => {
  const out = await reduceMarkdown(
    [
      "- item",
      "",
      '  <iframe src="https://www.youtube.com/embed/x" title="Demo talk" />',
      "",
      '<video src="/media/clip.mp4" controls />',
      "",
      '<canvas id="chart" />',
      "",
      "<hr />",
      "",
      'Inline <img src="/i.png" /> and <a href="/x" title="X" /> end.',
      "",
    ].join("\n"),
    mdx,
  )
  expect(out).toBe(
    [
      "- item",
      "",
      "  [Demo talk](https://www.youtube.com/embed/x)",
      "",
      `[Embedded video](${site}/media/clip.mp4)`,
      "",
      interactiveNote(page),
      "",
      `Inline ![](${site}/i.png) and [X](${site}/x) end.`,
      "",
    ].join("\n"),
  )
  expect(linkDestination("https://x.test/a(b)")).toBe("<https://x.test/a(b)>")
})

test("markdownTable escapes pipes and collapses whitespace", () => {
  expect(markdownTable(["A", "B|C"], [["x\ny", 1.5]])).toBe(
    "| A | B\\|C |\n| --- | --- |\n| x y | 1.5 |",
  )
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
  const out = await reduceMarkdown(source, {
    ...mdx,
    components: markdownComponents(site),
  })
  expect(mdxLeftovers(out)).toEqual([])
  expect(out).not.toMatch(/<\/?(Guide|div)\b/)
  // Every heading and fragment link in the source survives, with fragments
  // resolved against the web page.
  for (const heading of source.match(/^#{2,3} .+$/gm) ?? [])
    expect(out).toContain(heading)
  const fragments = [...source.matchAll(/\]\((#[^)\s]+)\)/g)].map((m) => m[1])
  expect(fragments.length).toBeGreaterThan(0)
  for (const fragment of fragments)
    expect(out).toContain(`](${page}${fragment})`)
  // Each component the post imports is mapped, so none becomes the note.
  expect(out).not.toContain(interactiveNote(page))
  // Every Figure in the source becomes an image of its file.
  for (const [, file] of source.matchAll(/<Figure[^>]*?file="([^"]+)"/g))
    expect(out).toContain(`(${site}/research/261019-block-latency/${file})`)
  // The widgets render Markdown tables, and Guide keeps its data links.
  expect(out.match(/^\| --- \|/gm)?.length).toBeGreaterThan(2)
  expect(out).toMatch(/^Data: .*\/tables\.md\)/m)
})
