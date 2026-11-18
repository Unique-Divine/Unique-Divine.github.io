import { afterEach, describe, expect, test } from "bun:test"
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import provenance from "~/data/mcp-provenance.json"
import { manifestProblems, mcpManifest } from "~/utils/mcp-schema"
import { repoPath } from "~/utils/repo-paths"

import {
  FIXTURE_REVISION,
  importMcp,
  MANIFEST_FILE,
  manifestRevision,
  prepareManifests,
  readManifests,
} from "./import-mcp"

const fixtures = repoPath("scripts/fixtures/mcp-jiyuu")
const fixture = (folder: string) =>
  JSON.parse(
    readFileSync(path.join(fixtures, "mcp", folder, MANIFEST_FILE), "utf8"),
  )
// Tests break manifests on purpose, so edits work on untyped JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any
const source = (folder: string, edit: (m: Json) => void = () => {}) => {
  const manifest = fixture(folder)
  edit(manifest)
  return { folder, raw: JSON.stringify(manifest) }
}

const temps: string[] = []
const tempDir = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-import-test-"))
  temps.push(dir)
  return dir
}
afterEach(() => {
  for (const dir of temps.splice(0))
    rmSync(dir, { recursive: true, force: true })
})

/** A jiyuu-shaped tree with the given manifests and some files to ignore. */
function jiyuu(manifests: Record<string, unknown>) {
  const root = tempDir()
  for (const [folder, manifest] of Object.entries(manifests)) {
    const dir = path.join(root, "mcp", folder)
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, MANIFEST_FILE), JSON.stringify(manifest))
  }
  // An opted-out server and files the importer must never pick up.
  mkdirSync(path.join(root, "mcp/opted-out"), { recursive: true })
  writeFileSync(path.join(root, "mcp/opted-out/package.json"), "{}")
  writeFileSync(path.join(root, "mcp/slack/.env"), "SLACK_TOKEN=xoxc-test")
  writeFileSync(path.join(root, "mcp/slack/other.json"), "{}")
  writeFileSync(path.join(root, "mcp/README.md"), "# MCP")
  return root
}

describe("MCP manifest validation", () => {
  test("accepts the slack, telegram, and discord fixtures", () => {
    const manifests = prepareManifests(
      ["slack", "telegram", "discord"].map((folder) => source(folder)),
    )
    expect(manifests.map((m) => m.slug)).toEqual([
      "discord-mcp",
      "slack-mcp",
      "telegram-mcp",
    ])
    expect(manifests.map((m) => m.registry)).toEqual(["npm", "npm", "pypi"])
  })

  test("rejects counts that disagree with the tool list", () => {
    expect(() =>
      prepareManifests([source("slack", (m) => (m.toolCount += 1))]),
    ).toThrow("toolCount")
    expect(() =>
      prepareManifests([
        source("slack", (m) => {
          m.readOnlyCount -= 1
          m.writeCount += 1
        }),
      ]),
    ).toThrow("readOnlyCount")
  })

  test("rejects a slug, folder, or install command that breaks the contract", () => {
    expect(() =>
      prepareManifests([source("slack", (m) => (m.slug = "slack"))]),
    ).toThrow("slug")
    expect(() =>
      prepareManifests([{ ...source("slack"), folder: "x" }]),
    ).toThrow('folder is "slack"')
    expect(() =>
      prepareManifests([
        source(
          "slack",
          (m) => (m.installCommand = "bunx @uniquedivine/mcp-slack"),
        ),
      ]),
    ).toThrow("installCommand must pin")
  })

  test("rejects env var values, extra keys, and unknown registries", () => {
    expect(() =>
      prepareManifests([
        source("slack", (m) => (m.envVars[0].value = "xoxc-secret")),
      ]),
    ).toThrow("envVars.0")
    expect(() =>
      prepareManifests([source("slack", (m) => (m.upstream = "someone/else"))]),
    ).toThrow("Invalid MCP manifests")
    expect(() =>
      prepareManifests([source("slack", (m) => (m.registry = "cargo"))]),
    ).toThrow("registry")
  })

  test("rejects hosted-service and pricing text", () => {
    expect(() =>
      prepareManifests([
        source("slack", (m) => (m.tools[0].description += " Pro $19/mo.")),
      ]),
    ).toThrow("service text")
    expect(() =>
      prepareManifests([
        source("slack", (m) => (m.tools[0].title = "Smart Search (hosted)")),
      ]),
    ).toThrow("service text")
  })

  test("reports every broken manifest in one error", () => {
    let message = ""
    try {
      prepareManifests([
        { folder: "slack", raw: "{" },
        source("discord", (m) => (m.toolCount = 0)),
        source("telegram"),
      ])
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain("mcp/slack/site-manifest.json: invalid JSON")
    expect(message).toContain("mcp/discord/site-manifest.json: toolCount")
    expect(message).not.toContain("mcp/telegram")
  })

  test("requires one generator revision across manifests", () => {
    const manifests = prepareManifests([
      source("slack"),
      source("discord", (m) => (m.generatedFrom.revision = "abc123")),
    ])
    expect(() => manifestRevision(manifests)).toThrow("disagree")
  })
})

describe("MCP import", () => {
  test("reads only mcp/*/site-manifest.json and skips folders without one", async () => {
    const root = jiyuu({ slack: fixture("slack"), discord: fixture("discord") })
    const sources = await readManifests(root)
    expect(sources.map((s) => s.folder)).toEqual(["discord", "slack"])
    for (const { raw } of sources) expect(raw).not.toContain("xoxc-test")
  })

  test("writes the snapshot and provenance, and reimports stably", async () => {
    const root = jiyuu({ slack: fixture("slack"), discord: fixture("discord") })
    const site = tempDir()
    mkdirSync(path.join(site, "src/data"), { recursive: true })
    await importMcp(root, site)
    const output = path.join(site, "src/content/mcp")
    expect(readdirSync(output).sort()).toEqual([
      "discord-mcp.json",
      "slack-mcp.json",
    ])
    const provenancePath = path.join(site, "src/data/mcp-provenance.json")
    const first = readFileSync(provenancePath, "utf8")
    const record = JSON.parse(first)
    expect(record.fixture).toBe(true)
    expect(record.revision).toBe(FIXTURE_REVISION)
    expect(record.servers["slack-mcp"].source).toBe(
      "mcp/slack/site-manifest.json",
    )
    await importMcp(root, site)
    expect(readFileSync(provenancePath, "utf8")).toBe(first)
    expect(readdirSync(path.dirname(output))).toEqual(["mcp"])
  })

  test("a failed import leaves the previous snapshot in place", async () => {
    const site = tempDir()
    mkdirSync(path.join(site, "src/data"), { recursive: true })
    await importMcp(jiyuu({ slack: fixture("slack") }), site)
    const before = readFileSync(
      path.join(site, "src/content/mcp/slack-mcp.json"),
      "utf8",
    )
    const broken = fixture("slack")
    broken.toolCount = 1
    await expect(importMcp(jiyuu({ slack: broken }), site)).rejects.toThrow(
      "toolCount",
    )
    expect(
      readFileSync(path.join(site, "src/content/mcp/slack-mcp.json"), "utf8"),
    ).toBe(before)
  })

  test("records a real jiyuu revision as not a fixture", async () => {
    const real = (folder: string) => {
      const m = fixture(folder)
      m.generatedFrom.revision = "0123456789abcdef"
      return m
    }
    const site = tempDir()
    mkdirSync(path.join(site, "src/data"), { recursive: true })
    await importMcp(jiyuu({ slack: real("slack") }), site)
    const record = JSON.parse(
      readFileSync(path.join(site, "src/data/mcp-provenance.json"), "utf8"),
    )
    expect(record.fixture).toBe(false)
    expect(record.revision).toBe("0123456789abcdef")
  })
})

describe("committed MCP snapshot", () => {
  const content = repoPath("src/content/mcp")
  const files = readdirSync(content).filter((f) => f.endsWith(".json"))

  test("every server file is valid and listed in the provenance", () => {
    expect(files.length).toBeGreaterThan(0)
    expect(files.map((f) => f.replace(/\.json$/, "")).sort()).toEqual(
      Object.keys(provenance.servers).sort(),
    )
    for (const file of files) {
      const manifest = mcpManifest.parse(
        JSON.parse(readFileSync(path.join(content, file), "utf8")),
      )
      expect(manifestProblems(manifest, manifest.folder)).toEqual([])
      const record =
        provenance.servers[manifest.slug as keyof typeof provenance.servers]
      expect(record.version).toBe(manifest.version)
      expect(manifest.generatedFrom.revision).toBe(provenance.revision)
    }
  })

  test("a fixture snapshot matches the committed fixtures exactly", async () => {
    if (!provenance.fixture) return
    const sources = await readManifests(fixtures)
    const expected = prepareManifests(sources)
    for (const manifest of expected)
      expect(
        JSON.parse(
          readFileSync(path.join(content, `${manifest.slug}.json`), "utf8"),
        ),
      ).toEqual(manifest)
  })
})
