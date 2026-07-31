import BigNumber from "bignumber.js"

// Copied from boku/epics/tools/sai-deal-desk/src/volumeCalc.ts. Keep the
// fixture expectations in model.test.ts aligned when the deal-desk formula
// changes.

BigNumber.config({
  DECIMAL_PLACES: 40,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
})

export type NumericValue = string | number | BigNumber

export interface FeeCoverageInput {
  label: string

  cost_basis_usd: NumericValue
  fee_bps: NumericValue

  /**
   * Revenue percentage paid to the external party.
   *
   * Examples:
   *   0.50 = 50% goes to the external party
   *   0.65 = 65% goes to the external party
   */
  rev_share_pct: NumericValue

  /**
   * Dollar cost incurred per `millions` dollars of volume.
   */
  per_mil_payout: NumericValue

  /**
   * Normally 1,000,000.
   */
  millions?: NumericValue
}

export interface FeeCoverageResult {
  label: string

  cost_basis_usd: BigNumber
  fee_bps: BigNumber
  rev_share_pct: BigNumber
  per_mil_payout: BigNumber
  millions: BigNumber

  gross_fee_rate: BigNumber
  retained_revenue_pct: BigNumber
  retained_fee_rate: BigNumber
  volume_cost_rate: BigNumber
  net_earnings_rate: BigNumber

  volume_usd: BigNumber

  gross_fee_revenue_usd: BigNumber
  external_rev_share_usd: BigNumber
  retained_fee_revenue_usd: BigNumber
  volume_cost_usd: BigNumber
  net_earnings_usd: BigNumber
}

const ONE = new BigNumber(1)
const BPS_AS_RATE = new BigNumber("1e-4")
const DEFAULT_MILLIONS = new BigNumber(1_000_000)

function parseNumber(value: NumericValue, fieldName: string): BigNumber {
  const parsed = new BigNumber(value)

  if (!parsed.isFinite() || parsed.isNaN()) {
    throw new Error(`${fieldName} must be a finite number`)
  }

  return parsed
}

/**
 * Required volume to recover `cost_basis_usd` after fee revenue share and
 * per-million volume payouts.
 *
 *   V = cost_basis_usd / (
 *     (fee_bps × 10^-4) × (1 - rev_share_pct)
 *     - (per_mil_payout / millions)
 *   )
 */
export function calculateFeeCoverage(
  input: FeeCoverageInput,
): FeeCoverageResult {
  const cost_basis_usd = parseNumber(input.cost_basis_usd, "cost_basis_usd")

  const fee_bps = parseNumber(input.fee_bps, "fee_bps")

  const rev_share_pct = parseNumber(input.rev_share_pct, "rev_share_pct")

  const per_mil_payout = parseNumber(input.per_mil_payout, "per_mil_payout")

  const millions = parseNumber(input.millions ?? DEFAULT_MILLIONS, "millions")

  if (cost_basis_usd.isNegative()) {
    throw new Error("cost_basis_usd cannot be negative")
  }

  if (fee_bps.isNegative()) {
    throw new Error("fee_bps cannot be negative")
  }

  if (rev_share_pct.isNegative() || rev_share_pct.isGreaterThanOrEqualTo(ONE)) {
    throw new Error(
      "rev_share_pct must be greater than or equal to 0 and less than 1",
    )
  }

  if (per_mil_payout.isNegative()) {
    throw new Error("per_mil_payout cannot be negative")
  }

  if (millions.isLessThanOrEqualTo(0)) {
    throw new Error("millions must be greater than 0")
  }

  const gross_fee_rate = fee_bps.times(BPS_AS_RATE)

  const retained_revenue_pct = ONE.minus(rev_share_pct)

  const retained_fee_rate = gross_fee_rate.times(retained_revenue_pct)

  const volume_cost_rate = per_mil_payout.dividedBy(millions)

  const net_earnings_rate = retained_fee_rate.minus(volume_cost_rate)

  if (net_earnings_rate.isLessThanOrEqualTo(0)) {
    throw new Error(
      [
        "The calculation cannot recover the cost basis.",
        `Retained fee rate: ${retained_fee_rate.toString()}`,
        `Volume cost rate: ${volume_cost_rate.toString()}`,
        `Net earnings rate: ${net_earnings_rate.toString()}`,
      ].join(" "),
    )
  }

  const volume_usd = cost_basis_usd.dividedBy(net_earnings_rate)

  const gross_fee_revenue_usd = volume_usd.times(gross_fee_rate)

  const external_rev_share_usd = gross_fee_revenue_usd.times(rev_share_pct)

  const retained_fee_revenue_usd = gross_fee_revenue_usd.minus(
    external_rev_share_usd,
  )

  const volume_cost_usd = volume_usd.dividedBy(millions).times(per_mil_payout)

  const net_earnings_usd = retained_fee_revenue_usd.minus(volume_cost_usd)

  return {
    label: input.label,

    cost_basis_usd,
    fee_bps,
    rev_share_pct,
    per_mil_payout,
    millions,

    gross_fee_rate,
    retained_revenue_pct,
    retained_fee_rate,
    volume_cost_rate,
    net_earnings_rate,

    volume_usd,

    gross_fee_revenue_usd,
    external_rev_share_usd,
    retained_fee_revenue_usd,
    volume_cost_usd,
    net_earnings_usd,
  }
}

function formatDecimal(value: BigNumber, decimalPlaces: number): string {
  const fixed = value.toFixed(decimalPlaces)
  const negative = fixed.startsWith("-")
  const unsigned = negative ? fixed.slice(1) : fixed

  const [whole = "", fraction] = unsigned.split(".")
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  return [
    negative ? "-" : "",
    groupedWhole,
    fraction === undefined ? "" : `.${fraction}`,
  ].join("")
}

export function formatUsd(value: BigNumber): string {
  return `$${formatDecimal(value, 2)}`
}

export function formatPercent(rate: BigNumber, decimalPlaces = 4): string {
  return `${formatDecimal(rate.times(100), decimalPlaces)}%`
}

export function formatBps(rate: BigNumber, decimalPlaces = 4): string {
  return `${formatDecimal(rate.times(10_000), decimalPlaces)} bps`
}

export function formatFeeCoverageSummary(result: FeeCoverageResult): string {
  return [
    result.label,
    "",
    "Formula:",
    "  Volume (V) = cost_basis_usd × [",
    "    (fee_bps × 10^-4) × (1 - rev_share_pct)",
    "    - (per_mil_payout / millions)",
    "  ]^-1",
    "",
    "Inputs:",
    `  Cost basis:             ${formatUsd(result.cost_basis_usd)}`,
    `  Gross fee:              ${formatDecimal(result.fee_bps, 4)} bps`,
    `  External revenue share: ${formatPercent(result.rev_share_pct, 2)}`,
    `  Retained revenue share: ${formatPercent(result.retained_revenue_pct, 2)}`,
    `  Volume payout:          ${formatUsd(result.per_mil_payout)} per ${formatUsd(result.millions)}`,
    "",
    "Effective rates:",
    `  Gross fee rate:         ${formatBps(result.gross_fee_rate)} (${formatPercent(result.gross_fee_rate)})`,
    `  Retained fee rate:      ${formatBps(result.retained_fee_rate)} (${formatPercent(result.retained_fee_rate)})`,
    `  Volume cost rate:       ${formatBps(result.volume_cost_rate)} (${formatPercent(result.volume_cost_rate)})`,
    `  Net earnings rate:      ${formatBps(result.net_earnings_rate)} (${formatPercent(result.net_earnings_rate)})`,
    "",
    `Required volume:          ${formatUsd(result.volume_usd)}`,
    "",
    "At required volume:",
    `  Gross fee revenue:      ${formatUsd(result.gross_fee_revenue_usd)}`,
    `  External revenue share: ${formatUsd(result.external_rev_share_usd)}`,
    `  Retained fee revenue:   ${formatUsd(result.retained_fee_revenue_usd)}`,
    `  Volume-based payout:    ${formatUsd(result.volume_cost_usd)}`,
    `  Net earnings:           ${formatUsd(result.net_earnings_usd)}`,
  ].join("\n")
}
