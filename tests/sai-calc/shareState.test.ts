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

const encodeTestJson = (value: unknown): string =>
  btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")

describe("calculator share state", () => {
  test("round-trips multiple compact calculations and Unicode labels", () => {
    const inputs = [
      record("source-1", { label: "提携先 🚀" }),
      record("source-2", { label: "Second", revSharePercent: "50" }),
    ]
    const payload = encodeSharedCalculations(inputs)

    expect(payload).not.toContain("costBasisUsd")
    let id = 0
    const decoded = decodeSharedCalculations(payload, () => `shared-${++id}`)

    expect(decoded).toEqual([
      { ...inputs[0], id: "shared-1" },
      { ...inputs[1], id: "shared-2" },
    ])
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
    expect(fragment.get("calcs")).toBeTruthy()
  })

  test("reads valid links directly into full records with fresh IDs", () => {
    const url = buildSharedCalculationsUrl(
      [record("source")],
      "https://uniquedivine.com/sai-calc",
    )
    const result = readSharedCalculationsUrl(url, () => "recipient")

    expect(result).toEqual({
      status: "valid",
      calculations: [record("recipient")],
    })
  })

  test("rejects malformed, unsupported, and invalid compact payloads", () => {
    expect(() => decodeSharedCalculations("not+base64")).toThrow(/base64url/)
    expect(() =>
      decodeSharedCalculations(encodeTestJson({ v: 2, c: [] })),
    ).toThrow(/unsupported version/)
    expect(() =>
      decodeSharedCalculations(
        encodeTestJson({
          v: 1,
          c: [{ l: "bad", b: 5, f: "8", r: "65", p: "100" }],
        }),
      ),
    ).toThrow(/invalid fields/)
  })

  test("rejects empty, excessive, and overlong shares", () => {
    expect(() => encodeSharedCalculations([])).toThrow(/between 1 and 10/)
    expect(() =>
      encodeSharedCalculations(
        Array.from({ length: 11 }, (_, index) => record(String(index))),
      ),
    ).toThrow(/between 1 and 10/)
    expect(() =>
      encodeSharedCalculations([record("long", { label: "x".repeat(201) })]),
    ).toThrow(/invalid fields/)
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
