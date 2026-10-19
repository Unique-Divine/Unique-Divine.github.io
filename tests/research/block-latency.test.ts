import { describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import {
  data,
  PRIMARY,
  scenarios,
  upgradeTable,
} from "../../src/components/research/block-latency/model"
import { getSectionTitleOverride } from "../../src/data/blogSections"

describe("fixed production capture", () => {
  test("retains the accounting baseline and separate opportunity calculations", () => {
    expect(data.normal[PRIMARY].block_observations.delta).toBe(114057)
    const rows = scenarios(PRIMARY)
    expect(rows.map((row) => Number(row.value.toFixed(2)))).toEqual([
      1515.04, 592.55, 1190.19, 267.7,
    ])
    expect(rows.map((row) => row.status)).toEqual([
      "Measured",
      "Hypothetical",
      "Hypothetical",
      "Hypothetical",
    ])
    for (const profile of Object.values(data.normal)) {
      const phaseSum = profile.phases.reduce(
        (sum, phase) => sum + (phase.contribution_ms_per_block ?? 0),
        0,
      )
      expect(phaseSum + profile.residual_ms).toBeCloseTo(
        profile.block_mean_ms,
        8,
      )
    }
  })

  test("retains absent versus zero states and incomplete observer coverage", () => {
    const validatorWait = data.normal[PRIMARY].phases.find(
      (p) => p.state === "PrevoteWait",
    )!
    const snapshot = data.normal["cataclysm-1-snapshot-0"]
    const observedWait = snapshot.phases.find((p) => p.state === "PrevoteWait")!
    expect(validatorWait.contribution_ms_per_block).toBeNull()
    expect(validatorWait.observed).toBe(false)
    expect(observedWait.contribution_ms_per_block).toBe(0)
    expect(observedWait.observed).toBe(true)
    expect(snapshot.complete).toBe(false)
    expect(
      data.normal_bins["cataclysm-1-snapshot-0"].filter((b) => b.complete),
    ).toHaveLength(95)
  })

  test("keeps restart transitions and negative residuals separate from recovery", () => {
    expect(data.upgrades["v2.20.0"].recovery.seconds_from_anchor).toBe(36600)
    expect(data.upgrades["v2.21.0"].recovery.seconds_from_anchor).toBe(5700)
    expect(data.upgrades["v2.20.0"].tables.later.residual_ms).toBeLessThan(0)
    for (const version of ["v2.20.0", "v2.21.0"] as const) {
      expect(data.upgrades[version].tables.transition.complete).toBe(false)
      expect(upgradeTable(version)).toContain("INCOMPLETE")
    }
  })

  test("downloadable and build-time data match, and every asset matches its hash", () => {
    const root = fileURLToPath(
      new URL("../../public/research/261019-block-latency/", import.meta.url),
    )
    expect(
      JSON.parse(readFileSync(`${root}measurements.json`, "utf8")),
    ).toEqual(data)
    const manifest = JSON.parse(
      readFileSync(`${root}provenance.json`, "utf8"),
    ) as { source_report_sha256: string; artifacts: Record<string, string> }
    expect(manifest.source_report_sha256).toBe(data.source_sha256)
    expect(Object.keys(data.figures)).toHaveLength(12)
    for (const [path, hash] of Object.entries(manifest.artifacts)) {
      expect(
        createHash("sha256")
          .update(readFileSync(root + path))
          .digest("hex"),
      ).toBe(hash)
    }
  })
})

test("section headings override display only and leave unmapped sections alone", () => {
  expect(getSectionTitleOverride("category", "nibiru")).toBe(
    "On Nibiru and Sai",
  )
  expect(getSectionTitleOverride("tag", "self-improvement")).toBe(
    "On Self-Improvement and Productivity",
  )
  expect(getSectionTitleOverride("tag", "japanese")).toBeUndefined()
  expect(getSectionTitleOverride("category", "coding")).toBeUndefined()
  expect(getSectionTitleOverride("tag", "nibiru")).toBeUndefined()
  expect(getSectionTitleOverride("tag", "constructor")).toBeUndefined()
})
