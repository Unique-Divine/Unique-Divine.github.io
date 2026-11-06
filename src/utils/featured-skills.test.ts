import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import yaml from "js-yaml"
import { repoPath } from "~/utils/repo-paths"

import {
  HOME_SKILL_PICKS,
  pickFeaturedSkills,
  type SkillSummarySource,
} from "~/utils/featured-skills"

const skill = (
  name: string,
  kind: SkillSummarySource["kind"] = "skill",
): SkillSummarySource => ({ name, route: `${name}-route`, kind })

describe("home page featured skills", () => {
  test("keeps pick order and links to each skill page", () => {
    const featured = pickFeaturedSkills(
      [skill("b"), skill("a")],
      [
        { name: "a", summary: "First." },
        { name: "b", summary: "Second." },
      ],
    )
    expect(featured).toEqual([
      { name: "a", href: "/ai-skills/a-route", summary: "First." },
      { name: "b", href: "/ai-skills/b-route", summary: "Second." },
    ])
  })

  test("drops picks that are missing or only reference pages", () => {
    const featured = pickFeaturedSkills(
      [skill("a", "reference"), skill("c")],
      [
        { name: "a", summary: "Reference only." },
        { name: "b", summary: "Missing." },
        { name: "c", summary: "Present." },
      ],
    )
    expect(featured.map(({ name }) => name)).toEqual(["c"])
  })

  test("every home page pick exists in the published collection", async () => {
    const dir = repoPath("src/content/skill/")
    const files = (await readdir(dir)).filter((file) => file.endsWith(".md"))
    const skills = await Promise.all(
      files.map(async (file) => {
        const raw = await readFile(`${dir}${file}`, "utf8")
        return yaml.load(raw.split("---")[1]) as SkillSummarySource
      }),
    )
    const featured = pickFeaturedSkills(skills)
    expect(featured.map(({ name }) => name)).toEqual(
      HOME_SKILL_PICKS.map(({ name }) => name),
    )
  })
})
