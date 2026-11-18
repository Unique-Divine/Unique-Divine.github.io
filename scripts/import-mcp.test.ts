import { afterEach, describe, expect, test } from "bun:test"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
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
  isFixtureSet,
  MANIFEST_FILE,
  nodeSwapFs,
  prepareManifests,
  readManifests,
  swapSnapshot,
  type SwapFs,
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
  mkdirSync(path.join(root, "mcp/slack"), { recursive: true })
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
    ).toThrow("installCommand must be")
  })

  test("accepts only the exact install command for the registry", () => {
    for (const command of [
      "bunx @uniquedivine/mcp-slack@4.5.2 && rm -rf ~",
      "echo hi; bunx @uniquedivine/mcp-slack@4.5.2",
      "npx @uniquedivine/mcp-slack@4.5.2",
      "bunx  @uniquedivine/mcp-slack@4.5.2",
    ])
      expect(() =>
        prepareManifests([
          source("slack", (m) => (m.installCommand = command)),
        ]),
      ).toThrow("installCommand must be")
    expect(() =>
      prepareManifests([
        source(
          "telegram",
          (m) => (m.installCommand = "bunx uniquedivine-telegram-mcp@2.0.2"),
        ),
      ]),
    ).toThrow('installCommand must be "uvx uniquedivine-telegram-mcp@2.0.2"')
    expect(() =>
      prepareManifests([
        source("slack", (m) => {
          m.package = "@uniquedivine/mcp-slack;id"
          m.installCommand = `bunx ${m.package}@${m.version}`
        }),
      ]),
    ).toThrow("not a valid npm name")
  })

  test("accepts only https links to the expected hosts and paths", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "http://www.npmjs.com/package/@uniquedivine/mcp-slack",
    ])
      expect(() =>
        prepareManifests([source("slack", (m) => (m.registryUrl = url))]),
      ).toThrow("registryUrl")
    expect(() =>
      prepareManifests([
        source(
          "slack",
          (m) =>
            (m.registryUrl = "https://evil.example/@uniquedivine/mcp-slack"),
        ),
      ]),
    ).toThrow("registryUrl must be")
    expect(() =>
      prepareManifests([
        source(
          "slack",
          (m) =>
            (m.sourceUrl =
              "https://github.com/someone/else/tree/main/mcp/slack"),
        ),
      ]),
    ).toThrow("sourceUrl must be")
    expect(() =>
      prepareManifests([
        source(
          "telegram",
          (m) => (m.registryUrl = "https://pypi.org/project/x/"),
        ),
      ]),
    ).toThrow(
      "registryUrl must be https://pypi.org/project/uniquedivine-telegram-mcp/",
    )
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

  test("accepts per-server revisions but not fixtures mixed with real data", () => {
    const real = prepareManifests([
      source("slack", (m) => (m.generatedFrom.revision = "aaa111")),
      source("discord", (m) => (m.generatedFrom.revision = "bbb222")),
    ])
    expect(isFixtureSet(real)).toBe(false)
    expect(isFixtureSet(prepareManifests([source("slack")]))).toBe(true)
    const mixed = prepareManifests([
      source("slack"),
      source("discord", (m) => (m.generatedFrom.revision = "bbb222")),
    ])
    expect(() => isFixtureSet(mixed)).toThrow("can't be imported together")
  })
})

describe("MCP import", () => {
  test("reads only mcp/*/site-manifest.json and skips folders without one", async () => {
    const root = jiyuu({ slack: fixture("slack"), discord: fixture("discord") })
    const sources = await readManifests(root)
    expect(sources.map((s) => s.folder)).toEqual(["discord", "slack"])
    for (const { raw } of sources) expect(raw).not.toContain("xoxc-test")
  })

  test("refuses a symlinked site-manifest.json", async () => {
    const root = jiyuu({ discord: fixture("discord") })
    const outside = path.join(tempDir(), "secret.json")
    writeFileSync(outside, "SLACK_TOKEN=xoxc-test")
    mkdirSync(path.join(root, "mcp/linked"))
    symlinkSync(outside, path.join(root, "mcp/linked", MANIFEST_FILE))
    await expect(readManifests(root)).rejects.toThrow(
      "Not a regular file: mcp/linked/site-manifest.json",
    )
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
    expect(record.checkout).toBeNull()
    expect(record.servers["slack-mcp"].revision).toBe(FIXTURE_REVISION)
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

  test("records each server's revision and reimports one changed server", async () => {
    const real = (folder: string, revision: string) => {
      const m = fixture(folder)
      m.generatedFrom.revision = revision
      return m
    }
    const site = tempDir()
    mkdirSync(path.join(site, "src/data"), { recursive: true })
    const provenancePath = path.join(site, "src/data/mcp-provenance.json")
    await importMcp(
      jiyuu({
        slack: real("slack", "aaa111"),
        discord: real("discord", "bbb222"),
      }),
      site,
    )
    const first = JSON.parse(readFileSync(provenancePath, "utf8"))
    expect(first.fixture).toBe(false)
    expect(first.servers["slack-mcp"].revision).toBe("aaa111")
    expect(first.servers["discord-mcp"].revision).toBe("bbb222")
    // A Slack-only release: Slack moves on, Discord keeps its revision.
    const slack = real("slack", "ccc333")
    slack.description = "Updated description."
    await importMcp(jiyuu({ slack, discord: real("discord", "bbb222") }), site)
    const second = JSON.parse(readFileSync(provenancePath, "utf8"))
    expect(second.servers["slack-mcp"].revision).toBe("ccc333")
    expect(second.servers["slack-mcp"].sha256).not.toBe(
      first.servers["slack-mcp"].sha256,
    )
    expect(second.servers["discord-mcp"]).toEqual(first.servers["discord-mcp"])
  })
})

describe("snapshot swap", () => {
  /** A site with an old snapshot and provenance, plus a staged new one. */
  function staged() {
    const site = tempDir()
    const output = path.join(site, "content")
    const provenancePath = path.join(site, "provenance.json")
    mkdirSync(output)
    writeFileSync(path.join(output, "old.json"), "old")
    writeFileSync(provenancePath, "old provenance")
    mkdirSync(`${output}.next`)
    writeFileSync(path.join(`${output}.next`, "new.json"), "new")
    const state = () => ({
      files: readdirSync(output),
      provenance: readFileSync(provenancePath, "utf8"),
      leftovers: [".prev", ".next"].filter((s) => existsSync(output + s)),
      provenanceNext: existsSync(`${provenancePath}.next`),
    })
    return { output, provenancePath, state }
  }

  /** Real filesystem calls, except the nth rename throws. */
  const failingRename = (n: number): SwapFs => {
    let calls = 0
    return {
      ...nodeSwapFs,
      rename: async (from, to) => {
        if (++calls === n) throw new Error(`injected rename ${n} failure`)
        await nodeSwapFs.rename(from, to)
      },
    }
  }

  test("replaces the snapshot and provenance and removes .prev", async () => {
    const { output, provenancePath, state } = staged()
    await swapSnapshot(output, provenancePath, "new provenance")
    expect(state()).toEqual({
      files: ["new.json"],
      provenance: "new provenance",
      leftovers: [],
      provenanceNext: false,
    })
  })

  for (const [n, step] of [
    [1, "moving the current snapshot to .prev"],
    [2, "moving .next into place"],
    [3, "renaming the provenance into place"],
  ] as const)
    test(`a failure while ${step} restores the old snapshot`, async () => {
      const { output, provenancePath, state } = staged()
      await expect(
        swapSnapshot(
          output,
          provenancePath,
          "new provenance",
          failingRename(n),
        ),
      ).rejects.toThrow(`injected rename ${n} failure`)
      const after = state()
      expect(after.files).toEqual(["old.json"])
      expect(after.provenance).toBe("old provenance")
      expect(after.provenanceNext).toBe(false)
      expect(after.leftovers).not.toContain(".prev")
    })

  test("a provenance write failure leaves everything untouched", async () => {
    const { output, provenancePath, state } = staged()
    const fs: SwapFs = {
      ...nodeSwapFs,
      writeFile: async () => {
        throw new Error("disk full")
      },
    }
    await expect(
      swapSnapshot(output, provenancePath, "new provenance", fs),
    ).rejects.toThrow("disk full")
    expect(state().files).toEqual(["old.json"])
    expect(state().provenance).toBe("old provenance")
  })

  test("an import after a crash restores the .prev snapshot first", async () => {
    const site = tempDir()
    mkdirSync(path.join(site, "src/data"), { recursive: true })
    const root = jiyuu({ slack: fixture("slack") })
    await importMcp(root, site)
    const output = path.join(site, "src/content/mcp")
    // Simulate a crash between the two directory renames.
    renameSync(output, `${output}.prev`)
    const broken = fixture("slack")
    broken.toolCount = 1
    await expect(importMcp(jiyuu({ slack: broken }), site)).rejects.toThrow(
      "toolCount",
    )
    expect(readdirSync(output)).toEqual(["slack-mcp.json"])
    expect(existsSync(`${output}.prev`)).toBe(false)
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
      expect(manifest.generatedFrom.revision).toBe(record.revision)
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
