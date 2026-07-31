import type { CalculatorRecord } from "./model.ts"

export const SHARED_CALCULATIONS_HASH_KEY = "calcs"
export const MAX_SHARED_CALCULATIONS = 10
export const MAX_SHARED_LINK_LENGTH = 8_192

const MAX_LABEL_LENGTH = 200
const MAX_NUMERIC_LENGTH = 100

interface CompactCalculationV1 {
  l: string
  b: string
  f: string
  r: string
  p: string
}

interface CompactSharedStateV1 {
  v: 1
  c: CompactCalculationV1[]
}

export type SharedLinkReadResult =
  | { status: "absent" }
  | { status: "invalid"; message: string }
  | { status: "valid"; calculations: CalculatorRecord[] }

const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

const decodeBase64Url = (value: string): string => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("The shared calculation payload is not valid base64url.")
  }
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
}

const compactCalculation = (
  record: CalculatorRecord,
): CompactCalculationV1 => ({
  l: record.label,
  b: record.costBasisUsd,
  f: record.feeBps,
  r: record.revSharePercent,
  p: record.perMillionPayout,
})

const isBoundedString = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && value.length <= maxLength

const isCompactCalculation = (
  value: unknown,
): value is CompactCalculationV1 => {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<CompactCalculationV1>
  return (
    isBoundedString(record.l, MAX_LABEL_LENGTH) &&
    isBoundedString(record.b, MAX_NUMERIC_LENGTH) &&
    isBoundedString(record.f, MAX_NUMERIC_LENGTH) &&
    isBoundedString(record.r, MAX_NUMERIC_LENGTH) &&
    isBoundedString(record.p, MAX_NUMERIC_LENGTH)
  )
}

const parseCompactState = (value: unknown): CompactSharedStateV1 => {
  if (!value || typeof value !== "object") {
    throw new Error("The shared calculation payload must be an object.")
  }
  const state = value as Partial<CompactSharedStateV1>
  if (state.v !== 1) {
    throw new Error("This shared calculation link uses an unsupported version.")
  }
  if (
    !Array.isArray(state.c) ||
    state.c.length === 0 ||
    state.c.length > MAX_SHARED_CALCULATIONS
  ) {
    throw new Error(
      `A shared link must contain 1–${MAX_SHARED_CALCULATIONS} calculations.`,
    )
  }
  if (!state.c.every(isCompactCalculation)) {
    throw new Error("One or more shared calculations have invalid fields.")
  }
  return { v: 1, c: state.c }
}

export const encodeSharedCalculations = (
  calculations: CalculatorRecord[],
): string => {
  if (
    calculations.length === 0 ||
    calculations.length > MAX_SHARED_CALCULATIONS
  ) {
    throw new Error(
      `Select between 1 and ${MAX_SHARED_CALCULATIONS} calculations to share.`,
    )
  }
  const compact: CompactSharedStateV1 = {
    v: 1,
    c: calculations.map(compactCalculation),
  }
  parseCompactState(compact)
  return encodeBase64Url(JSON.stringify(compact))
}

export const decodeSharedCalculations = (
  payload: string,
  idFactory: () => string = () => crypto.randomUUID(),
): CalculatorRecord[] => {
  if (payload.length > MAX_SHARED_LINK_LENGTH) {
    throw new Error("The shared calculation payload is too long.")
  }
  const compact = parseCompactState(JSON.parse(decodeBase64Url(payload)))
  return compact.c.map((record) => ({
    id: idFactory(),
    label: record.l,
    costBasisUsd: record.b,
    feeBps: record.f,
    revSharePercent: record.r,
    perMillionPayout: record.p,
  }))
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
