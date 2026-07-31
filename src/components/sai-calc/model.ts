import BigNumber from "bignumber.js"

import { calculateFeeCoverage, type FeeCoverageResult } from "./volumeCalc.ts"

export const CALCULATOR_STORAGE_KEY = "sai-deal-desk:fee-coverage-calculator:v1"

export interface CalculatorRecord {
  id: string
  label: string
  costBasisUsd: string
  feeBps: string
  revSharePercent: string
  perMillionPayout: string
}

export interface CalculatorState {
  version: 1
  calculations: CalculatorRecord[]
}

export type CalculationView =
  | { status: "pending" }
  | { status: "error"; message: string }
  | { status: "success"; result: FeeCoverageResult }

export const createBlankCalculation = (
  id: string = crypto.randomUUID(),
): CalculatorRecord => ({
  id,
  label: "",
  costBasisUsd: "",
  feeBps: "",
  revSharePercent: "",
  perMillionPayout: "",
})

const isCalculatorRecord = (value: unknown): value is CalculatorRecord => {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<CalculatorRecord>
  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.label === "string" &&
    typeof record.costBasisUsd === "string" &&
    typeof record.feeBps === "string" &&
    typeof record.revSharePercent === "string" &&
    typeof record.perMillionPayout === "string"
  )
}

export const readCalculatorState = (
  stored: string | null,
  idFactory: () => string = () => crypto.randomUUID(),
): CalculatorState => {
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored) as Partial<CalculatorState>
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.calculations) &&
        parsed.calculations.every(isCalculatorRecord)
      ) {
        return { version: 1, calculations: parsed.calculations }
      }
    } catch {
      // Fall through to a clean state when browser storage is malformed.
    }
  }

  return {
    version: 1,
    calculations: [createBlankCalculation(idFactory())],
  }
}

export const calculateRecord = (record: CalculatorRecord): CalculationView => {
  const requiredValues = [
    record.costBasisUsd,
    record.feeBps,
    record.revSharePercent,
    record.perMillionPayout,
  ]
  if (requiredValues.some((value) => value.trim() === "")) {
    return { status: "pending" }
  }

  try {
    const revShareFraction = new BigNumber(record.revSharePercent)
      .dividedBy(100)
      .toString()
    const result = calculateFeeCoverage({
      label: record.label.trim() || "Untitled calculation",
      cost_basis_usd: record.costBasisUsd,
      fee_bps: record.feeBps,
      rev_share_pct: revShareFraction,
      per_mil_payout: record.perMillionPayout,
      millions: "1000000",
    })
    return { status: "success", result }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    }
  }
}
