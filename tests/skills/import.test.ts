import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { createMarkdownProcessor } from "@astrojs/markdown-remark"
import yaml from "js-yaml"

import { prepareSkills } from "../../scripts/import-skills"
import manifest from "../../src/data/skills-provenance.json"

const entry = (folder: string, body = "## Usage\n\nHello.", extra = "") => ({
  source: `${folder}/SKILL.md`,
  raw: `---\nname: ${folder}\ndescription: A useful skill.\n${extra}---\n\n# Title\n\n${body}\n`,
})

describe("public skills import", () => {
  test("all snapshot page links resolve to Astro's rendered heading IDs", async () => {
    const root = fileURLToPath(new URL("../../", import.meta.url))
    const compiler = await createMarkdownProcessor()
    const files = await Promise.all(
      Object.values(manifest.pages).map(async (page) => ({
        source: page.source,
        raw: await readFile(
          `${root}public/ai-skills-source/${page.source}`,
          "utf8",
        ),
      })),
    )
    const pages = prepareSkills(files)
    const rendered = new Map(
      await Promise.all(
        pages.map(async (page) => {
          const result = await compiler.render(page.content)
          return [`/ai-skills/${page.route}`, result] as const
        }),
      ),
    )
    for (const [route, result] of rendered) {
      for (const match of result.code.matchAll(/href="([^"]+)"/g)) {
        if (!match[1].startsWith("#") && !match[1].startsWith("/ai-skills/"))
          continue
        const link = new URL(match[1], `https://example.com${route}`)
        const target = rendered.get(link.pathname)
        expect(target, `${route}: ${match[1]}`).toBeDefined()
        if (link.hash)
          expect(
            target!.metadata.headings.map((h) => h.slug),
            `${route}: ${match[1]}`,
          ).toContain(decodeURIComponent(link.hash.slice(1)))
      }
    }
  })

  test("rewrites Markdown links while preserving original code and source", async () => {
    const main = entry(
      "sample",
      "[Reference](references/detail.md#details)\n\n`references/detail.md`\n\n```md\n[Example](references/detail.md)\n```",
    )
    const pages = prepareSkills([
      main,
      {
        source: "sample/references/detail.md",
        raw: "# Reference\n\n[Back](../SKILL.md)\n\n## Details\n\nUseful details.",
      },
    ])
    const skill = pages.find((p) => p.kind === "skill")!
    const reference = pages.find((p) => p.kind === "reference")!
    expect(skill.route).toBe("sample")
    expect(reference.route).toBe("sample/detail")
    expect(skill.content).toContain("/ai-skills/sample/detail#details")
    expect(reference.content).toContain("/ai-skills/sample")
    expect(skill.content).toContain("[Example](references/detail.md)")
    expect(skill.raw).toBe(main.raw)
    expect(skill.content).not.toContain("# Title")
    const rendered = await (
      await createMarkdownProcessor()
    ).render(reference.content)
    expect(rendered.metadata.headings).toContainEqual({
      depth: 2,
      slug: "details",
      text: "Details",
    })
  })

  test("rejects collisions and missing internal references before replacing a snapshot", () => {
    expect(() =>
      prepareSkills([
        entry("sample"),
        { source: "sample/detail.md", raw: "One" },
        { source: "sample/references/detail.md", raw: "Two" },
      ]),
    ).toThrow("Duplicate skill route")
    expect(() =>
      prepareSkills([entry("sample", "[Missing](references/missing.md)")]),
    ).toThrow("Missing or excluded")
  })

  test("omits private skill directories and ignores orphan references", () => {
    const pages = prepareSkills([
      entry("hidden", "Secret", "metadata:\n  private: true\n"),
      { source: "hidden/reference.md", raw: "Hidden" },
      { source: "orphan/reference.md", raw: "Orphan" },
      entry("public"),
    ])
    expect(pages.map((p) => p.folder)).toEqual(["public"])
  })

  test("preserves folder URLs when declared skill names differ", () => {
    const file = entry("justfile")
    file.raw = file.raw.replace("name: justfile", "name: just")
    const page = prepareSkills([file])[0]
    expect(page.route).toBe("justfile")
    expect(page.name).toBe("just")
  })

  test("every imported page and raw Markdown file agrees with the manifest", async () => {
    const root = fileURLToPath(new URL("../../", import.meta.url))
    let skills = 0
    for (const [route, page] of Object.entries(manifest.pages)) {
      const raw = await readFile(
        `${root}public/ai-skills-source/${page.source}`,
        "utf8",
      )
      expect(createHash("sha256").update(raw).digest("hex")).toBe(page.sha256)
      const generated = await readFile(
        `${root}src/content/skill/${route}.md`,
        "utf8",
      )
      const data = yaml.load(
        generated.match(/^---\n([\s\S]*?)\n---/)![1],
      ) as Record<string, unknown>
      expect(data.route).toBe(route)
      expect(data.source).toBe(page.source)
      expect(data.stickyToc).toBe(true)
      if (data.kind === "skill") skills++
    }
    expect(skills).toBe(
      Object.values(manifest.pages).filter((page) =>
        page.source.endsWith("/SKILL.md"),
      ).length,
    )
    expect(skills).toBeGreaterThan(0)
  })
})
