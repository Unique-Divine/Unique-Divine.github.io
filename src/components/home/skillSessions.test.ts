import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import yaml from "js-yaml"
import { repoPath } from "~/utils/repo-paths"

import {
  buildTimeline,
  DEFAULT_PACE,
  fallbackScript,
  formatElapsed,
  lineLength,
  seededRandom,
  SKILL_SESSION_SCRIPTS,
  sliceSpans,
  visibleCount,
} from "~/components/home/skillSessions"
import { HOME_SKILL_PICKS } from "~/utils/featured-skills"

const script = fallbackScript("demo", "Does the thing.")

describe("skill session typing timeline", () => {
  test("times every character in ascending order", () => {
    const timeline = buildTimeline(script, DEFAULT_PACE, seededRandom(1))
    const all = timeline.lines.flatMap((line) => line.times)
    expect(all.length).toBe(timeline.totalChars)
    expect(all.length).toBe(
      script.lines.reduce((sum, line) => sum + lineLength(line), 0),
    )
    expect(all).toEqual([...all].sort((a, b) => a - b))
    expect(timeline.end).toBe(all[all.length - 1])
  })

  test("the agent starts after the prompt and a thinking pause", () => {
    const timeline = buildTimeline(script, DEFAULT_PACE, seededRandom(2))
    const [promptLine, agentLine] = timeline.lines
    expect(timeline.promptEnd).toBe(promptLine.times.at(-1)!)
    expect(agentLine.times[0] - timeline.promptEnd).toBeGreaterThanOrEqual(
      DEFAULT_PACE.thinkPause,
    )
  })

  test("a seed reproduces the same rhythm", () => {
    const a = buildTimeline(script, DEFAULT_PACE, seededRandom(7))
    const b = buildTimeline(script, DEFAULT_PACE, seededRandom(7))
    expect(a).toEqual(b)
  })

  test("visibleCount counts characters shown by a given time", () => {
    const times = [10, 20, 20, 35]
    expect(visibleCount(times, 0)).toBe(0)
    expect(visibleCount(times, 20)).toBe(3)
    expect(visibleCount(times, 99)).toBe(4)
  })

  test("sliceSpans cuts across spans and keeps tones", () => {
    const spans = [
      { text: "gh-rev", tone: "cmd" as const },
      { text: " open", tone: "dim" as const },
    ]
    expect(sliceSpans(spans, 8)).toEqual([
      { text: "gh-rev", tone: "cmd" },
      { text: " o", tone: "dim" },
    ])
    expect(sliceSpans(spans, 0)).toEqual([])
  })

  test("formatElapsed matches the Claude Code spinner", () => {
    expect(formatElapsed(9.7)).toBe("9s")
    expect(formatElapsed(62)).toBe("1m 02s")
  })
})

describe("skill session scripts", () => {
  test("every home page pick has a transcript", () => {
    const names = SKILL_SESSION_SCRIPTS.map(({ name }) => name)
    for (const pick of HOME_SKILL_PICKS) expect(names).toContain(pick.name)
  })

  test("each transcript opens with its own slash command", () => {
    for (const { name, lines } of SKILL_SESSION_SCRIPTS) {
      expect(lines[0].kind).toBe("prompt")
      expect(lines[0].spans[0].text.startsWith(`/${name} `)).toBe(true)
      expect(lines.length).toBeGreaterThanOrEqual(3)
    }
  })

  test("every transcript names a published skill", async () => {
    const dir = repoPath("src/content/skill/")
    const files = (await readdir(dir)).filter((file) => file.endsWith(".md"))
    const names = await Promise.all(
      files.map(async (file) => {
        const raw = await readFile(`${dir}${file}`, "utf8")
        return (yaml.load(raw.split("---")[1]) as { name: string }).name
      }),
    )
    for (const { name } of SKILL_SESSION_SCRIPTS) expect(names).toContain(name)
  })
})
