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

import provenance from "~/content/mcp/_provenance.json"
import { manifestProblems, mcpManifest } from "~/utils/mcp-schema"
import { repoPath } from "~/utils/repo-paths"

import {
  FIXTURE_REVISION,
  importMcp,
  isFixtureSet,
  MANIFEST_FILE,
  nodeSwapFs,
  prepareManifests,
  PROVENANCE_FILE,
  readManifests,
  recoverSnapshot,
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
    await importMcp(root, site)
    const output = path.join(site, "src/content/mcp")
    expect(readdirSync(output).sort()).toEqual([
      PROVENANCE_FILE,
      "discord-mcp.json",
      "slack-mcp.json",
    ])
    const provenancePath = path.join(site, "src/content/mcp", PROVENANCE_FILE)
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
    const provenancePath = path.join(site, "src/content/mcp", PROVENANCE_FILE)
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
  /** An old snapshot and a staged new one, each with its own provenance. */
  function staged() {
    const output = path.join(tempDir(), "mcp")
    for (const [dir, label] of [
      [output, "old"],
      [`${output}.next`, "new"],
    ]) {
      mkdirSync(dir)
      writeFileSync(path.join(dir, `${label}.json`), label)
      writeFileSync(path.join(dir, PROVENANCE_FILE), `${label} provenance`)
    }
    const state = () => ({
      files: readdirSync(output).sort(),
      provenance: readFileSync(path.join(output, PROVENANCE_FILE), "utf8"),
      leftovers: [".prev", ".next"].filter((s) => existsSync(output + s)),
    })
    return { output, state }
  }
  const OLD = [PROVENANCE_FILE, "old.json"].sort()
  const NEW = [PROVENANCE_FILE, "new.json"].sort()

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

  test("swaps content and provenance together and removes .prev", async () => {
    const { output, state } = staged()
    await swapSnapshot(output)
    expect(state()).toEqual({
      files: NEW,
      provenance: "new provenance",
      leftovers: [],
    })
  })

  for (const [n, step] of [
    [1, "moving the current snapshot to .prev"],
    [2, "moving .next into place"],
  ] as const)
    test(`a failure while ${step} keeps the old pair`, async () => {
      const { output, state } = staged()
      await expect(swapSnapshot(output, failingRename(n))).rejects.toThrow(
        `injected rename ${n} failure`,
      )
      expect(state().files).toEqual(OLD)
      expect(state().provenance).toBe("old provenance")
      expect(state().leftovers).not.toContain(".prev")
    })

  test("a crash between the two renames recovers the old pair", async () => {
    const { output, state } = staged()
    renameSync(output, `${output}.prev`)
    await recoverSnapshot(output)
    expect(state()).toEqual({
      files: OLD,
      provenance: "old provenance",
      leftovers: [],
    })
  })

  test("a crash after the new snapshot lands keeps the new pair", async () => {
    // The point the review reproduced: new content in place, .prev not yet
    // removed. Provenance moved with the content, so they still agree.
    const { output, state } = staged()
    renameSync(output, `${output}.prev`)
    renameSync(`${output}.next`, output)
    await recoverSnapshot(output)
    expect(state()).toEqual({
      files: NEW,
      provenance: "new provenance",
      leftovers: [],
    })
  })

  test("an import after a crash restores the .prev snapshot first", async () => {
    const site = tempDir()
    const root = jiyuu({ slack: fixture("slack") })
    await importMcp(root, site)
    const output = path.join(site, "src/content/mcp")
    renameSync(output, `${output}.prev`)
    const broken = fixture("slack")
    broken.toolCount = 1
    await expect(importMcp(jiyuu({ slack: broken }), site)).rejects.toThrow(
      "toolCount",
    )
    expect(readdirSync(output).sort()).toEqual([
      PROVENANCE_FILE,
      "slack-mcp.json",
    ])
    expect(existsSync(`${output}.prev`)).toBe(false)
  })
})

describe("committed MCP snapshot", () => {
  const content = repoPath("src/content/mcp")
  const files = readdirSync(content).filter(
    (f) => f.endsWith(".json") && f !== PROVENANCE_FILE,
  )

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

describe("env var notes", () => {
  const withNote = (note: string) =>
    source("telegram", (m) => (m.envVars[2].note = note))

  test("accepts plain notes that name alternatives", () => {
    expect(() =>
      prepareManifests([
        withNote(
          "Set this or TELEGRAM_SESSION_NAME. For several accounts, set " +
            "TELEGRAM_SESSION_STRING_<LABEL> per account instead.",
        ),
      ]),
    ).not.toThrow()
  })

  test("rejects value-shaped notes the way jiyuu's checkNote does", () => {
    for (const [note, why] of [
      ["Set TELEGRAM_API_HASH=abc to sign in.", "an assignment"],
      ["Use API_HASH = abc.", "an assignment"],
      ["Example: xoxc-1234", "a Slack token"],
      ["Hash 0123456789abcdef0123456789abcdef here.", "a long hex run"],
      [`Session ${"Ab1+".repeat(10)}==`, "a long base64 run"],
      ["Token ghp_abc", "a known secret prefix"],
      ["Token github_pat_abc", "a known secret prefix"],
      ["Token glpat-abc", "a known secret prefix"],
      ["Token npm_abc", "a known secret prefix"],
      ["Key sk-abc", "a known secret prefix"],
      ["Key AKIAABC", "a known secret prefix"],
      ["Key AIzaABC", "a known secret prefix"],
      ["-----BEGIN PRIVATE KEY-----", "a known secret prefix"],
    ])
      expect(() => prepareManifests([withNote(note)])).toThrow(
        `envVars[2].note looks like it holds ${why}`,
      )
  })

  test("caps notes at 300 characters", () => {
    expect(() => prepareManifests([withNote("a ".repeat(150))])).not.toThrow()
    expect(() => prepareManifests([withNote("a ".repeat(150) + "b")])).toThrow(
      "envVars.2.note",
    )
  })
})
