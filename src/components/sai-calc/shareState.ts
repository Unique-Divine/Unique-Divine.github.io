import BigNumber from "bignumber.js"

import { calculateRecord, type CalculatorRecord } from "./model.ts"

export const SHARED_CALCULATIONS_HASH_KEY = "calcs"
export const MAX_SHARED_CALCULATIONS = 4
export const MAX_SHARED_LINK_LENGTH = 8_192

const MAX_LABEL_LENGTH = 200
const MAX_NUMERIC_LENGTH = 100

const FIELD_SEPARATOR = "-"
const CALCULATION_SEPARATOR = "__"
const COMPACT_NUMBER_PATTERN = "(?:0|[1-9]\\d*)(?:e-?(?:[1-9]\\d*))?"
const COMPACT_CALCULATION_PATTERN = new RegExp(
  `^(${COMPACT_NUMBER_PATTERN})-(${COMPACT_NUMBER_PATTERN})-(${COMPACT_NUMBER_PATTERN})-(${COMPACT_NUMBER_PATTERN})-(.*)$`,
  "s",
)

export type SharedLinkReadResult =
  | { status: "absent" }
  | { status: "invalid"; message: string }
  | { status: "valid"; calculations: CalculatorRecord[] }

const compactNumber = (value: string): string => {
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_NUMERIC_LENGTH) {
    throw new Error("Shared calculation numbers must be valid and bounded.")
  }

  const number = new BigNumber(trimmed)
  if (!number.isFinite() || number.isNegative()) {
    throw new Error(
      "Shared calculation numbers must be non-negative and finite.",
    )
  }
  if (number.isZero()) return "0"

  const exponential = number.toExponential()
  const match = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(exponential)
  if (!match)
    throw new Error("A shared calculation number could not be encoded.")

  const fraction = match[2] ?? ""
  const coefficient = `${match[1]}${fraction}`
  const exponent = Number(match[3]) - fraction.length
  const scientific = exponent === 0 ? coefficient : `${coefficient}e${exponent}`

  if (
    number.isInteger() &&
    number.e !== null &&
    number.e < MAX_NUMERIC_LENGTH
  ) {
    const integer = number.toFixed(0)
    if (integer.length <= scientific.length) return integer
  }
  if (scientific.length > MAX_NUMERIC_LENGTH) {
    throw new Error("A shared calculation number is too long.")
  }
  return scientific
}

const escapeLabel = (label: string): string => {
  if (label.length > MAX_LABEL_LENGTH) {
    throw new Error("A shared calculation label is too long.")
  }
  return label.replaceAll("_", "_0")
}

const unescapeLabel = (label: string): string => {
  let decoded = ""
  for (let index = 0; index < label.length; index += 1) {
    const character = label[index]
    if (character !== "_") {
      decoded += character
      continue
    }
    if (label[index + 1] !== "0") {
      throw new Error("A shared calculation label has an invalid escape.")
    }
    decoded += "_"
    index += 1
  }
  if (decoded.length > MAX_LABEL_LENGTH) {
    throw new Error("A shared calculation label is too long.")
  }
  return decoded
}

const assertCalculationCount = (
  count: number,
  action: "Select" | "contain",
): void => {
  if (count === 0 || count > MAX_SHARED_CALCULATIONS) {
    const subject =
      action === "Select" ? "Select" : "A shared link must contain"
    const suffix = action === "Select" ? " to share" : ""
    throw new Error(
      `${subject} between 1 and ${MAX_SHARED_CALCULATIONS} calculations${suffix}.`,
    )
  }
}

const compactCalculation = (record: CalculatorRecord): string => {
  if (calculateRecord(record).status !== "success") {
    throw new Error("Only complete, valid calculations can be shared.")
  }
  return [
    compactNumber(record.costBasisUsd),
    compactNumber(record.feeBps),
    compactNumber(record.revSharePercent),
    compactNumber(record.perMillionPayout),
    escapeLabel(record.label),
  ].join(FIELD_SEPARATOR)
}

export const encodeSharedCalculations = (
  calculations: CalculatorRecord[],
): string => {
  assertCalculationCount(calculations.length, "Select")
  return calculations.map(compactCalculation).join(CALCULATION_SEPARATOR)
}

export const decodeSharedCalculations = (
  payload: string,
  idFactory: () => string = () => crypto.randomUUID(),
): CalculatorRecord[] => {
  if (payload.length > MAX_SHARED_LINK_LENGTH) {
    throw new Error("The shared calculation payload is too long.")
  }
  if (payload.length === 0) assertCalculationCount(0, "contain")
  const compactCalculations = payload.split(CALCULATION_SEPARATOR)
  assertCalculationCount(compactCalculations.length, "contain")

  return compactCalculations.map((compact) => {
    const match = COMPACT_CALCULATION_PATTERN.exec(compact)
    if (!match) {
      throw new Error("A shared calculation has an invalid compact format.")
    }
    const numbers = match.slice(1, 5)
    if (
      numbers.some(
        (number) =>
          number === undefined ||
          number.length > MAX_NUMERIC_LENGTH ||
          compactNumber(number) !== number,
      )
    ) {
      throw new Error("A shared calculation has a non-canonical number.")
    }
    const record: CalculatorRecord = {
      id: idFactory(),
      costBasisUsd: numbers[0]!,
      feeBps: numbers[1]!,
      revSharePercent: numbers[2]!,
      perMillionPayout: numbers[3]!,
      label: unescapeLabel(match[5] ?? ""),
    }
    if (calculateRecord(record).status !== "success") {
      throw new Error("A shared calculation contains invalid deal terms.")
    }
    return record
  })
}

export const buildSharedCalculationsUrl = (
  calculations: CalculatorRecord[],
  currentHref: string,
): string => {
  const url = new URL(currentHref)
  const fragment = new URLSearchParams(url.hash.slice(1))
  fragment.set(
    SHARED_CALCULATIONS_HASH_KEY,
    encodeSharedCalculations(calculations),
  )
  url.hash = fragment.toString()
  const result = url.toString()
  if (result.length > MAX_SHARED_LINK_LENGTH) {
    throw new Error(
      "The share link is too long. Select fewer calculations or shorten their labels.",
    )
  }
  return result
}

export const readSharedCalculationsUrl = (
  currentHref: string,
  idFactory: () => string = () => crypto.randomUUID(),
): SharedLinkReadResult => {
  const url = new URL(currentHref)
  const payload = new URLSearchParams(url.hash.slice(1)).get(
    SHARED_CALCULATIONS_HASH_KEY,
  )
  if (payload === null) return { status: "absent" }
  try {
    return {
      status: "valid",
      calculations: decodeSharedCalculations(payload, idFactory),
    }
  } catch (error) {
    return {
      status: "invalid",
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

export const removeSharedCalculationsFromUrl = (
  currentHref: string,
): string => {
  const url = new URL(currentHref)
  const fragment = new URLSearchParams(url.hash.slice(1))
  fragment.delete(SHARED_CALCULATIONS_HASH_KEY)
  const nextFragment = fragment.toString()
  url.hash = nextFragment ? `#${nextFragment}` : ""
  return `${url.pathname}${url.search}${url.hash}`
}

export const isBlankCalculation = (record: CalculatorRecord): boolean =>
  [
    record.label,
    record.costBasisUsd,
    record.feeBps,
    record.revSharePercent,
    record.perMillionPayout,
  ].every((value) => value.trim() === "")

export const mergeSharedCalculations = (
  localCalculations: CalculatorRecord[],
  sharedCalculations: CalculatorRecord[],
  idFactory: () => string = () => crypto.randomUUID(),
): CalculatorRecord[] => {
  const imported = sharedCalculations.map((record) => ({
    ...record,
    id: idFactory(),
  }))
  if (
    localCalculations.length === 1 &&
    localCalculations[0] &&
    isBlankCalculation(localCalculations[0])
  ) {
    return imported
  }
  return [...localCalculations.map((record) => ({ ...record })), ...imported]
}
