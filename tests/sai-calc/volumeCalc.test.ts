import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import BigNumber from "bignumber.js"
import { describe, expect, test } from "bun:test"

import {
  calculateFeeCoverage,
  formatFeeCoverageSummary,
  formatUsd,
  type FeeCoverageInput,
} from "../../src/components/sai-calc/volumeCalc.ts"

function expectUsd(actual: BigNumber, expected: string): void {
  expect(formatUsd(actual)).toBe(expected)
}

describe("calculateFeeCoverage", () => {
  test("50% revenue share, $100 per million", () => {
    const result = calculateFeeCoverage({
      label: "50% revenue share, $100 per million",
      cost_basis_usd: "5000",
      fee_bps: "8",
      rev_share_pct: "0.50",
      per_mil_payout: "100",
      millions: "1000000",
    })

    expectUsd(result.volume_usd, "$16,666,666.67")
    expectUsd(result.gross_fee_revenue_usd, "$13,333.33")
    expectUsd(result.external_rev_share_usd, "$6,666.67")
    expectUsd(result.retained_fee_revenue_usd, "$6,666.67")
    expectUsd(result.volume_cost_usd, "$1,666.67")
    expectUsd(result.net_earnings_usd, "$5,000.00")
  })

  test("65% revenue share, $100 per million", () => {
    const result = calculateFeeCoverage({
      label: "65% revenue share, $100 per million",
      cost_basis_usd: "5000",
      fee_bps: "8",
      rev_share_pct: "0.65",
      per_mil_payout: "100",
      millions: "1000000",
    })

    expectUsd(result.volume_usd, "$27,777,777.78")
    expectUsd(result.net_earnings_usd, "$5,000.00")
  })

  test("65% revenue share, no per-volume payout", () => {
    const result = calculateFeeCoverage({
      label: "65% revenue share, no per-volume payout",
      cost_basis_usd: "5000",
      fee_bps: "8",
      rev_share_pct: "0.65",
      per_mil_payout: "0",
      millions: "1000000",
    })

    // net rate = 8 bps * 0.35 = 2.8 bps = 0.00028
    // V = 5000 / 0.00028 ≈ 17,857,142.86
    expectUsd(result.volume_usd, "$17,857,142.86")
    expectUsd(result.volume_cost_usd, "$0.00")
    expectUsd(result.net_earnings_usd, "$5,000.00")
  })

  test("rejects non-recoverable deals", () => {
    expect(() =>
      calculateFeeCoverage({
        label: "impossible",
        cost_basis_usd: "5000",
        fee_bps: "1",
        rev_share_pct: "0.90",
        per_mil_payout: "100",
      }),
    ).toThrow(/cannot recover the cost basis/)
  })

  test("rejects rev_share_pct >= 1", () => {
    expect(() =>
      calculateFeeCoverage({
        label: "bad share",
        cost_basis_usd: "5000",
        fee_bps: "8",
        rev_share_pct: "1",
        per_mil_payout: "0",
      }),
    ).toThrow(/rev_share_pct/)
  })

  test("fixture JSON loads and produces summaries", () => {
    const fixturePath = resolve(import.meta.dir, "fixtures/fee-calcs.json")
    const inputs = JSON.parse(
      readFileSync(fixturePath, "utf8"),
    ) as FeeCoverageInput[]

    expect(inputs).toHaveLength(3)

    const summary = formatFeeCoverageSummary(calculateFeeCoverage(inputs[0]!))
    expect(summary).toContain("Required volume:")
    expect(summary).toContain("$16,666,666.67")
  })
})
