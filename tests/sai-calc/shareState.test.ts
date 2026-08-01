import { describe, expect, test } from "bun:test"

import type { CalculatorRecord } from "../../src/components/sai-calc/model.ts"
import {
  buildSharedCalculationsUrl,
  decodeSharedCalculations,
  encodeSharedCalculations,
  mergeSharedCalculations,
  readSharedCalculationsUrl,
  removeSharedCalculationsFromUrl,
} from "../../src/components/sai-calc/shareState.ts"

const record = (
  id: string,
  overrides: Partial<CalculatorRecord> = {},
): CalculatorRecord => ({
  id,
  label: "Partner scenario",
  costBasisUsd: "5000",
  feeBps: "8",
  revSharePercent: "65",
  perMillionPayout: "100",
  ...overrides,
})

describe("calculator share state", () => {
  test("encodes the exact compact separator format", () => {
    expect(encodeSharedCalculations([record("one", { label: "Fade" })])).toBe(
      "5e3-8-65-100-Fade",
    )
  })

  test("uses the shortest exact integer or scientific representation", () => {
    const payload = encodeSharedCalculations([
      record("one", {
        label: "Fractional",
        feeBps: "7.5",
        revSharePercent: "0.01",
        perMillionPayout: "0",
      }),
    ])

    expect(payload).toBe("5e3-75e-1-1e-2-0-Fractional")
    expect(decodeSharedCalculations(payload, () => "decoded")).toEqual([
      record("decoded", {
        label: "Fractional",
        costBasisUsd: "5e3",
        feeBps: "75e-1",
        revSharePercent: "1e-2",
        perMillionPayout: "0",
      }),
    ])
  })

  test("round-trips four calculations and escaped labels", () => {
    const inputs = [
      record("source-1", { label: "提携先 🚀" }),
      record("source-2", { label: "under__score" }),
      record("source-3", { label: "hyphen-label" }),
      record("source-4", { label: "Fourth", revSharePercent: "50" }),
    ]
    const payload = encodeSharedCalculations(inputs)

    expect(payload.split("__")).toHaveLength(4)
    expect(payload).toContain("under_0_0score")
    let id = 0
    expect(decodeSharedCalculations(payload, () => `shared-${++id}`)).toEqual(
      inputs.map((input, index) => ({
        ...input,
        id: `shared-${index + 1}`,
        costBasisUsd: "5e3",
      })),
    )
  })

  test("builds a fragment link while preserving query and fragment values", () => {
    const url = buildSharedCalculationsUrl(
      [record("one")],
      "https://uniquedivine.com/sai-calc?theme=test#note=keep",
    )
    const parsed = new URL(url)

    expect(parsed.searchParams.get("theme")).toBe("test")
    const fragment = new URLSearchParams(parsed.hash.slice(1))
    expect(fragment.get("note")).toBe("keep")
    expect(fragment.get("calcs")).toBe("5e3-8-65-100-Partner scenario")
  })

  test("reads valid links into full records with fresh IDs", () => {
    const url = buildSharedCalculationsUrl(
      [record("source")],
      "https://uniquedivine.com/sai-calc",
    )

    expect(readSharedCalculationsUrl(url, () => "recipient")).toEqual({
      status: "valid",
      calculations: [record("recipient", { costBasisUsd: "5e3" })],
    })
  })

  test("rejects empty and excessive shares", () => {
    expect(() => encodeSharedCalculations([])).toThrow(/between 1 and 4/)
    expect(() =>
      encodeSharedCalculations(
        Array.from({ length: 5 }, (_, index) => record(String(index))),
      ),
    ).toThrow(/between 1 and 4/)
    expect(() => decodeSharedCalculations("")).toThrow(/between 1 and 4/)
  })

  test("rejects incomplete and semantically invalid calculations", () => {
    expect(() =>
      encodeSharedCalculations([record("blank", { feeBps: "" })]),
    ).toThrow(/complete, valid/)
    expect(() =>
      encodeSharedCalculations([
        record("impossible", { feeBps: "1", revSharePercent: "90" }),
      ]),
    ).toThrow(/complete, valid/)
    expect(() => decodeSharedCalculations("5e3-1-90-100-impossible")).toThrow(
      /invalid deal terms/,
    )
  })

  test("rejects malformed, non-canonical, and former Base64 payloads", () => {
    expect(() => decodeSharedCalculations("5e3-7.5-65-100-decimal")).toThrow(
      /compact format/,
    )
    expect(() => decodeSharedCalculations("5e3-75e--1-65-100-bad")).toThrow(
      /compact format/,
    )
    expect(() =>
      decodeSharedCalculations("5000-8-65-100-not-shortest"),
    ).toThrow(/non-canonical/)
    expect(() => decodeSharedCalculations("5e3-8-65-100-bad_escape")).toThrow(
      /invalid escape/,
    )
    expect(() =>
      decodeSharedCalculations(
        "eyJ2IjoxLCJjIjpbeyJsIjoiT2xkIEJhc2U2NCBsaW5rIn1dfQ",
      ),
    ).toThrow(/compact format/)
  })

  test("rejects overlong labels and links", () => {
    expect(() =>
      encodeSharedCalculations([record("long", { label: "x".repeat(201) })]),
    ).toThrow(/label is too long/)
    expect(() =>
      buildSharedCalculationsUrl(
        [record("one")],
        `https://uniquedivine.com/sai-calc?padding=${"x".repeat(8_200)}`,
      ),
    ).toThrow(/too long/)
  })

  test("replaces one automatic blank local card when importing", () => {
    const blank = record("blank", {
      label: "",
      costBasisUsd: "",
      feeBps: "",
      revSharePercent: "",
      perMillionPayout: "",
    })
    const shared = [record("shared")]
    const merged = mergeSharedCalculations([blank], shared, () => "imported")

    expect(merged).toEqual([record("imported")])
    expect(shared).toEqual([record("shared")])
  })

  test("appends shared calculations and intentionally preserves duplicates", () => {
    const local = [record("local")]
    const shared = [record("shared")]
    const merged = mergeSharedCalculations(local, shared, () => "imported")

    expect(merged).toEqual([record("local"), record("imported")])
    expect(local).toEqual([record("local")])
    expect(shared).toEqual([record("shared")])
  })

  test("removes only the shared fragment value", () => {
    expect(
      removeSharedCalculationsFromUrl(
        "https://uniquedivine.com/sai-calc?mode=x#note=keep&calcs=payload",
      ),
    ).toBe("/sai-calc?mode=x#note=keep")
  })
})
