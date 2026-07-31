import { describe, expect, test } from "bun:test"

import {
  calculateRecord,
  createBlankCalculation,
  readCalculatorState,
  type CalculatorRecord,
} from "../../src/components/sai-calc/model.ts"
import { formatUsd } from "../../src/components/sai-calc/volumeCalc.ts"

const completeRecord = (
  overrides: Partial<CalculatorRecord> = {},
): CalculatorRecord => ({
  id: "calc-1",
  label: "65% revenue share",
  costBasisUsd: "5000",
  feeBps: "8",
  revSharePercent: "65",
  perMillionPayout: "100",
  ...overrides,
})

describe("calculator browser model", () => {
  test("converts a human percentage and calculates the shared result", () => {
    const view = calculateRecord(completeRecord())
    expect(view.status).toBe("success")
    if (view.status === "success") {
      expect(view.result.rev_share_pct.toString()).toBe("0.65")
      expect(formatUsd(view.result.volume_usd)).toBe("$27,777,777.78")
    }
  })

  test("keeps an incomplete blank calculation pending", () => {
    expect(calculateRecord(createBlankCalculation("blank"))).toEqual({
      status: "pending",
    })
  })

  test("returns useful errors for non-recoverable terms", () => {
    const view = calculateRecord(
      completeRecord({ feeBps: "1", revSharePercent: "90" }),
    )
    expect(view.status).toBe("error")
    if (view.status === "error") {
      expect(view.message).toContain("cannot recover the cost basis")
    }
  })

  test("restores valid versioned browser state", () => {
    const record = completeRecord()
    const state = readCalculatorState(
      JSON.stringify({ version: 1, calculations: [record] }),
    )
    expect(state).toEqual({ version: 1, calculations: [record] })
  })

  test("falls back to one blank card for malformed browser state", () => {
    const state = readCalculatorState("not-json", () => "fallback")
    expect(state.calculations).toEqual([createBlankCalculation("fallback")])
  })
})
